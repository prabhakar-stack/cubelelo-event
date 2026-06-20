/**
 * POST /api/orders/verify
 * Called after Razorpay checkout success.
 * Verifies signature, marks order paid, creates PaidParticipant.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventIds }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Order } from '@/lib/models/Order';
import { PaidParticipant } from '@/lib/models/PaidParticipant';
import { Competition } from '@/lib/models/Competition';
import { User } from '@/lib/models/User';
import { PromoCode } from '@/lib/models/PromoCode';

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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const expectedSig = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Constant-time comparison to avoid signature timing leaks.
    const expBuf = Buffer.from(expectedSig, 'utf8');
    const gotBuf = Buffer.from(String(razorpay_signature), 'utf8');
    const sigValid = expBuf.length === gotBuf.length && timingSafeEqual(expBuf, gotBuf);
    if (!sigValid) {
      return NextResponse.json({ error: 'Payment signature invalid' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ orderId: razorpay_order_id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'paid') {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    // Mark paid and generate GST invoice reference
    order.status = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    if (!order.invoiceNumber) {
      const d = new Date();
      const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      order.invoiceNumber = `CUB-${ds}-${razorpay_order_id.slice(-6).toUpperCase()}`;
      order.invoicedAt = d;
    }
    await order.save();

    const user = await User.findOne({ email: session.user.email.toLowerCase() }).lean() as any;
    const userName = user
      ? (`${user.name?.firstName ?? ''} ${user.name?.lastName ?? ''}`.trim() || user.email)
      : session.user.name ?? session.user.email;

    // Create PaidParticipant
    const alreadyPaid = await PaidParticipant.findOne({ competitionId: order.compId, userId: order.userId });
    if (!alreadyPaid) {
      await PaidParticipant.create({
        name: userName,
        email: session.user.email,
        userId: order.userId,
        orderId: razorpay_order_id,
        competitionId: order.compId,
        events: order.eventIds,
        total: order.amount,
        regDateAndTime: nowIST(),
      });

      // Update competition competitorsIds
      await Competition.updateOne(
        { $or: [{ competitionId: order.compId }, { _id: order.compId }] },
        { $addToSet: { competitorsIds: order.userId } }
      );
    }

    // Track promo usage from the stored order (never trust the client here).
    if (order.promoCode && order.userId) {
      await PromoCode.updateOne(
        { code: order.promoCode.toString().toUpperCase().trim(), usedBy: { $ne: order.userId } },
        { $inc: { usedCount: 1 }, $addToSet: { usedBy: order.userId } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/orders/verify]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
