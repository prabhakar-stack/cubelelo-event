/**
 * POST /api/promo/validate
 * Body: { code, amount, competitionId? }
 * Returns: { valid, discount, finalAmount, message }
 *
 * Public — any logged-in user can validate a promo code before checkout.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { PromoCode } from '@/lib/models/PromoCode';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { code, amount, competitionId } = await req.json();
  if (!code || !amount) {
    return NextResponse.json({ valid: false, message: 'Code and amount are required' });
  }

  await connectDB();

  const promo = await PromoCode.findOne({ code: code.toString().toUpperCase().trim() }).lean() as any;

  if (!promo || !promo.active) {
    return NextResponse.json({ valid: false, message: 'Invalid or expired promo code' });
  }

  // Check expiry
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, message: 'This promo code has expired' });
  }

  // Check max uses
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ valid: false, message: 'Promo code usage limit reached' });
  }

  // Check competition restriction
  if (promo.competitionId && competitionId && promo.competitionId !== competitionId) {
    return NextResponse.json({ valid: false, message: 'Promo code not valid for this competition' });
  }

  // Check minimum amount (amount in paise, minAmount in paise)
  if (promo.minAmount && amount < promo.minAmount) {
    const minInRupees = Math.ceil(promo.minAmount / 100);
    return NextResponse.json({ valid: false, message: `Minimum order amount ₹${minInRupees} required` });
  }

  // Check if user already used it — usedBy stores CL IDs (userId), so key on that.
  const userId = (session.user as any).userId ?? session.user.email;
  if (promo.usedBy?.includes(userId)) {
    return NextResponse.json({ valid: false, message: 'You have already used this promo code' });
  }

  // Calculate discount (amount in paise)
  let discount = 0;
  if (promo.type === 'percent') {
    discount = Math.floor((amount * promo.value) / 100);
  } else {
    // fixed — value is in rupees, convert to paise
    discount = promo.value * 100;
  }
  discount = Math.min(discount, amount); // can't discount more than total

  return NextResponse.json({
    valid: true,
    discount,
    finalAmount: amount - discount,
    type: promo.type,
    value: promo.value,
    message: promo.type === 'percent'
      ? `${promo.value}% off applied!`
      : `₹${promo.value} off applied!`,
  });
}
