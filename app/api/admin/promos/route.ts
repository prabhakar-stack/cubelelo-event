/**
 * GET  /api/admin/promos         — list all promo codes
 * POST /api/admin/promos         — create promo code
 * PATCH /api/admin/promos        — toggle active / update
 * DELETE /api/admin/promos?code= — delete
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { PromoCode } from '@/lib/models/PromoCode';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();
  const promos = await PromoCode.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ promos });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();

  const { code, type, value, maxUses = 0, minAmount = 0, competitionId, expiresAt } = await req.json();
  if (!code || !type || !value) {
    return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 });
  }
  if (!['percent', 'fixed'].includes(type)) {
    return NextResponse.json({ error: 'type must be percent or fixed' }, { status: 400 });
  }

  try {
    const promo = await PromoCode.create({
      code: code.toString().toUpperCase().trim(),
      type,
      value: Number(value),
      maxUses: Number(maxUses),
      minAmount: Number(minAmount),
      competitionId: competitionId || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      active: true,
    });
    return NextResponse.json({ ok: true, promo });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 409 });
    }
    throw err;
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();

  const { code, active, value, maxUses, expiresAt } = await req.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const update: Record<string, any> = {};
  if (active !== undefined) update.active = active;
  if (value !== undefined) update.value = Number(value);
  if (maxUses !== undefined) update.maxUses = Number(maxUses);
  if (expiresAt !== undefined) update.expiresAt = expiresAt ? new Date(expiresAt) : null;

  const promo = await PromoCode.findOneAndUpdate(
    { code: code.toString().toUpperCase() },
    { $set: update },
    { new: true }
  ).lean();

  if (!promo) return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
  return NextResponse.json({ ok: true, promo });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();

  const code = new URL(req.url).searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code param required' }, { status: 400 });

  await PromoCode.deleteOne({ code: code.toString().toUpperCase() });
  return NextResponse.json({ ok: true });
}
