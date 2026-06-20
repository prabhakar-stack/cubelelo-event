'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CreditCard, TrendingUp, Loader2, FileText, RefreshCw } from 'lucide-react';

export default function AdminPayments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) { router.push('/login'); return; }
    fetchOrders('');
  }, [session, status]);

  const fetchOrders = async (s: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/payments?limit=200${s ? `&status=${s}` : ''}`).then(r => r.json()).catch(() => ({}));
    setOrders(res.orders ?? []);
    setTotal(res.total ?? 0);
    setRevenue(res.totalRevenuePaise ?? 0);
    setLoading(false);
  };

  const STATUS_COLORS: Record<string, string> = {
    paid: 'border-emerald-500/30 text-emerald-400 bg-emerald-400/10',
    created: 'border-line-strong text-muted',
    failed: 'border-red-500/30 text-red-400 bg-red-500/10',
    processing: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/admin" className="text-xs text-muted hover:text-fg mb-1 block">← Admin</Link>
        <h1 className="text-2xl font-black mb-6">Payments</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Orders', value: total, icon: CreditCard, color: 'text-accent' },
            { label: 'Revenue', value: `₹${Math.round(revenue / 100).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Paid Orders', value: orders.filter(o => o.status === 'paid').length, icon: CreditCard, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface border border-line rounded-2xl p-4">
              <Icon size={14} className={`${color} mb-2`} />
              <p className="text-xl font-black text-fg">{value}</p>
              <p className="text-[10px] text-muted font-mono">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['', 'paid', 'created', 'failed'].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); fetchOrders(s); }}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                filterStatus === s ? 'bg-accent/20 border border-accent/50 text-accent' : 'bg-elevated border border-line-strong text-muted hover:text-fg'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="text-accent animate-spin" /></div>
        ) : (
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-line text-muted">
                  <th className="px-4 py-2 text-left">Order ID / Invoice</th>
                  <th className="px-4 py-2 text-left hidden sm:table-cell">Competition</th>
                  <th className="px-4 py-2 text-right">Amount (incl. GST)</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-left hidden md:table-cell">Date</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o: any) => (
                    <tr key={o._id} className="hover:bg-elevated">
                      <td className="px-4 py-3">
                        <div className="font-mono text-muted text-[10px]">{o.orderId?.slice(-12)}</div>
                        {o.invoiceNumber && (
                          <div className="text-[10px] text-accent font-mono">{o.invoiceNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg hidden sm:table-cell truncate max-w-[140px]">{o.compId}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-fg">₹{Math.round(parseInt(o.amount || '0') / 100)}</div>
                        <div className="text-[10px] text-muted">GST: ₹{Math.round(parseInt(o.amount || '0') / 100 * 18/118)}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status] ?? 'border-line-strong text-muted'}`}>
                          {o.status}
                        </span>
                        {o.refundStatus && o.refundStatus !== 'none' && (
                          <div className="text-[10px] text-amber-400 mt-0.5">{o.refundStatus}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted hidden md:table-cell">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {o.status === 'paid' && o.invoiceNumber && (
                            <a href={`/api/orders/invoice/${o.orderId}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 text-[10px] text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-all">
                              <FileText size={10} /> Invoice
                            </a>
                          )}
                          {o.status === 'paid' && (!o.refundStatus || o.refundStatus === 'none') && (
                            <button
                              onClick={async () => {
                                if (!confirm('Mark this order for refund?')) return;
                                await fetch('/api/admin/payments', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ orderId: o.orderId, action: 'refund', reason: 'Admin initiated' }),
                                });
                                fetchOrders(filterStatus);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10 transition-all">
                              <RefreshCw size={10} /> Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
