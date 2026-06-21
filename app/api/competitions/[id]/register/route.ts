/**
 * POST /api/competitions/[id]/register
 * Creates a Razorpay order (or free registration) for a competition.
 *
 * Body: { eventIds: string[], isFree?: boolean }
 * Returns: { orderId, amount, currency, keyId } for Razorpay checkout
 *          OR { ok: true, message } for free registrations
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';
import { PaidParticipant } from '@/lib/models/PaidParticipant';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { PromoCode } from '@/lib/models/PromoCode';
// Razorpay imported dynamically to allow dev without SDK
let Razorpay: any;
try { Razorpay = require('razorpay'); } catch { Razorpay = null; }

function nowIST(): string {
  const d = new Date();
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const dd = ist.getUTCDate().toString().padStart(2, '0');
  const mm = (ist.getUTCMonth() + 1).toString().padStart(2, '0');
  const yyyy = ist.getUTCFullYear();
  const hh = ist.getUTCHours().toString().padStart(2, '0');
  const min = ist.getUTCMinutes().toString().padStart(2, '0');
  const ss = ist.getUTCSeconds().toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Sign in to register' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { eventIds = [], promoCode }: { eventIds: string[]; promoCode?: string } = body;

    await connectDB();

    // Load competition
    const comp = await Competition.findOne({
      $or: [
        { competitionId: id },
        ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
      ],
    }).lean() as any;
    if (!comp) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    if (!comp.registrationOpen) {
      return NextResponse.json({ error: 'Registration is closed' }, { status: 400 });
    }

    // Load user
    const user = await User.findOne({ email: session.user.email.toLowerCase() }).lean() as any;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userId: string = user.userId;
    const compId: string = comp.competitionId ?? comp._id.toString();

    // Check if already registered
    const existing = await PaidParticipant.findOne({ competitionId: compId, userId }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Already registered for this competition' }, { status: 409 });
    }

    // ── Free competition ──────────────────────────────────────────────────────
    if (comp.isFree !== false && !comp.baseFee) {
      const regDateAndTime = nowIST();
      await PaidParticipant.create({
        name: `${user.name?.firstName ?? ''} ${user.name?.lastName ?? ''}`.trim() || user.email,
        email: user.email,
        userId,
        orderId: `FREE-${Date.now()}`,
        competitionId: compId,
        events: eventIds,
        total: '0',
        regDateAndTime,
      });

      // Add to competition.competitorsIds
      await Competition.updateOne(
        { _id: comp._id },
        { $addToSet: { competitorsIds: userId } }
      );

      return NextResponse.json({ ok: true, free: true });
    }

    // Paid registration requires a verified email.
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before registering for a paid competition. Check your inbox or resend from Settings.', code: 'EMAIL_UNVERIFIED' },
        { status: 403 },
      );
    }

    // ── Paid competition — create Razorpay order ──────────────────────────────
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Payment not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Amount in paise: base fee + per-event fee × events
    const baseFee = comp.baseFee ?? 0;
    const perEventFee = comp.perEventFee ?? 0;
    let amountPaise = baseFee + perEventFee * Math.max(eventIds.length, 1);

    // Apply promo code if provided
    let appliedPromo: any = null;
    if (promoCode) {
      const promo = await PromoCode.findOne({
        code: promoCode.toString().toUpperCase().trim(),
        active: true,
      }).lean() as any;

      const isValid =
        promo &&
        (!promo.expiresAt || new Date(promo.expiresAt) > new Date()) &&
        (promo.maxUses === 0 || promo.usedCount < promo.maxUses) &&
        (!promo.competitionId || promo.competitionId === compId) &&
        (!promo.minAmount || amountPaise >= promo.minAmount) &&
        !promo.usedBy?.includes(userId);

      if (isValid) {
        let discount = 0;
        if (promo.type === 'percent') {
          discount = Math.floor((amountPaise * promo.value) / 100);
        } else {
          discount = promo.value * 100;
        }
        amountPaise = Math.max(0, amountPaise - discount);
        appliedPromo = promo;
      }
    }

    const receipt = `order_${Date.now()}_${Math.floor(Math.random() * 999999)}`;
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { userId, compId, eventIds: eventIds.join(',') },
    });

    // Save order to DB
    await Order.create({
      orderId: rzpOrder.id,
      compId,
      eventIds,
      userId,
      amount: String(amountPaise),
      receipt,
      status: 'created',
      promoCode: appliedPromo?.code ?? null,
    });

    return NextResponse.json({
      orderId: rzpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId,
      name: comp.competitionName,
      description: `Registration \u2014 ${comp.competitionName}`,
      prefill: { name: user.name?.firstName, email: user.email },
    });
  } catch (err) {
    console.error('[POST /api/competitions/[id]/register]', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
