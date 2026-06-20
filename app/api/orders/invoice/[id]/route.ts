/**
 * GET /api/orders/invoice/[id]
 * Returns GST-compliant invoice HTML for a paid order.
 * Accessible by the order owner or admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Order } from '@/lib/models/Order';

const ADMIN_EMAILS = ['prabhakar@cubelelo.com', process.env.NEXTAUTH_ADMIN_EMAIL].filter(Boolean);
const GST_RATE = 0.18; // 18% GST
const GSTIN = process.env.CUBELELO_GSTIN ?? 'XXXXXXXXXXXXXXXXX';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const order = await Order.findOne({
    $or: [{ orderId: id }, { _id: id.length === 24 ? id : undefined }]
  }).lean() as any;

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const isOwner = order.userId === session.user.id;
  const isAdmin = ADMIN_EMAILS.includes(session.user.email) || session.user.role === 'admin';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (order.status !== 'paid') return NextResponse.json({ error: 'Invoice only available for paid orders' }, { status: 400 });

  const amountPaise = parseInt(order.amount ?? '0');
  const amountRs = amountPaise / 100;
  const gstAmount = amountRs * GST_RATE / (1 + GST_RATE); // GST already included
  const baseAmount = amountRs - gstAmount;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; font-size: 13px; }
  h1 { color: #00aab8; font-size: 22px; margin-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .label { color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  .total { font-weight: bold; font-size: 15px; }
  .footer { margin-top: 32px; font-size: 11px; color: #888; }
  .notice { background: #fff8e1; border: 1px solid #f9a825; padding: 10px 14px; border-radius: 6px; margin-top: 20px; font-size: 11px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Cubelelo</h1>
    <div>India's Premier Speedcubing Platform</div>
    <div style="margin-top:8px" class="label">GSTIN: ${GSTIN}</div>
  </div>
  <div style="text-align:right">
    <div class="label">Tax Invoice</div>
    <div style="font-size:18px;font-weight:bold">${order.invoiceNumber ?? 'PENDING'}</div>
    <div class="label" style="margin-top:4px">Date: ${order.invoicedAt ? new Date(order.invoicedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
  </div>
</div>

<hr/>

<div style="margin-top:16px">
  <div class="label">Bill To</div>
  <div>${order.userId}</div>
  <div style="color:#666; font-size:12px">Competition: ${order.compId}</div>
</div>

<table>
  <thead>
    <tr>
      <th>#</th><th>Description</th><th style="text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>Competition Registration — ${order.compId}<br/>
        <span style="color:#666;font-size:11px">Events: ${(order.eventIds ?? []).join(', ') || 'N/A'}</span>
      </td>
      <td style="text-align:right">₹${baseAmount.toFixed(2)}</td>
    </tr>
    <tr>
      <td></td><td style="color:#666">GST @ 18% (SAC 998431)</td>
      <td style="text-align:right">₹${gstAmount.toFixed(2)}</td>
    </tr>
    <tr>
      <td></td><td class="total">Total</td>
      <td class="total" style="text-align:right">₹${amountRs.toFixed(2)}</td>
    </tr>
  </tbody>
</table>

<div class="notice">⚠️ Registration fees are non-refundable. This is a valid tax invoice under GST regulations.</div>

<div class="footer">
  <div>Payment ID: ${order.razorpayPaymentId ?? 'N/A'} · Order ID: ${order.orderId}</div>
  <div style="margin-top:4px">This is a computer-generated invoice and does not require a physical signature.</div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="invoice-${order.invoiceNumber ?? order.orderId}.html"`,
    },
  });
}
