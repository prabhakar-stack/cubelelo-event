/**
 * GET  /api/admin/payments?compId=XXX&status=paid&limit=100
 * PATCH /api/admin/payments  { orderId, action: 'refund', reason }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { Order } from '@/lib/models/Order';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();
  const { searchParams } = new URL(req.url);
  const compId = searchParams.get('compId') ?? '';
  const status = searchParams.get('status') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
  const skip = parseInt(searchParams.get('skip') ?? '0');

  const query: Record<string, any> = {};
  if (compId) query.compId = compId;
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(query),
  ]);

  const totalRevenue = orders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + (parseInt(o.amount) || 0), 0);

  return NextResponse.json({ orders, total, totalRevenuePaise: totalRevenue, limit, skip });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();
  const { orderId, action, reason } = await req.json();
  if (!orderId || action !== 'refund') {
    return NextResponse.json({ error: 'orderId and action=refund required' }, { status: 400 });
  }
  const order = await Order.findOne({ orderId });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  order.refundStatus = 'requested';
  order.refundReason = reason ?? 'Admin refund';
  await order.save();
  return NextResponse.json({ ok: true, message: 'Refund marked as requested. Process in Razorpay dashboard.' });
}
