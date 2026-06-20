'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface PromoCode {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  maxUses: number;
  usedCount: number;
  minAmount: number;
  competitionId?: string;
  expiresAt?: string;
  active: boolean;
  usedBy: string[];
  createdAt: string;
}

const EMPTY_FORM = { code: '', type: 'percent', value: '', maxUses: '', minAmount: '', competitionId: '', expiresAt: '' };

export default function AdminPromos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') { router.push('/login'); return; }
    fetchPromos();
  }, [session, status]);

  async function fetchPromos() {
    setLoading(true);
    const data = await fetch('/api/admin/promos').then(r => r.json()).catch(() => ({}));
    setPromos(data.promos ?? []);
    setLoading(false);
  }

  async function create() {
    if (!form.code || !form.type || !form.value) { setError('Code, type, and value are required'); return; }
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        maxUses: Number(form.maxUses) || 0,
        minAmount: Number(form.minAmount) || 0,
        competitionId: form.competitionId || undefined,
        expiresAt: form.expiresAt || undefined,
      }),
    }).then(r => r.json()).catch(() => ({ error: 'Network error' }));

    if (res.error) { setError(res.error); setSaving(false); return; }
    setForm(EMPTY_FORM);
    await fetchPromos();
    setSaving(false);
  }

  async function toggleActive(code: string, active: boolean) {
    await fetch('/api/admin/promos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, active: !active }),
    });
    await fetchPromos();
  }

  async function deletePromo(code: string) {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    await fetch(`/api/admin/promos?code=${encodeURIComponent(code)}`, { method: 'DELETE' });
    await fetchPromos();
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/admin" className="text-xs text-[#8b949e] hover:text-white mb-1 block">← Admin</Link>
        <div className="flex items-center gap-2 mb-6">
          <Tag size={20} className="text-[#00dbe7]" />
          <h1 className="text-2xl font-black">Promo Codes</h1>
        </div>

        {/* Create form */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider mb-4">Create New Code</h2>
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'code', label: 'Code (e.g. CUBE20)', placeholder: 'CUBE20' },
              { key: 'value', label: 'Discount Value', placeholder: '20 (% or ₹)' },
              { key: 'maxUses', label: 'Max Uses (0 = unlimited)', placeholder: '100' },
              { key: 'minAmount', label: 'Min Order (₹)', placeholder: '299' },
              { key: 'competitionId', label: 'Competition ID (optional)', placeholder: 'Leave blank = all' },
              { key: 'expiresAt', label: 'Expiry Date (optional)', placeholder: '' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] text-[#8b949e] mb-1 uppercase tracking-wider">{label}</label>
                <input
                  type={key === 'expiresAt' ? 'datetime-local' : 'text'}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] text-[#8b949e] mb-1 uppercase tracking-wider">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-white focus:outline-none focus:border-[#00dbe7]"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
          </div>
          <button
            onClick={create}
            disabled={saving}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] text-sm font-semibold hover:bg-[#00dbe7]/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Promo Code
          </button>
        </div>

        {/* Promo list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#8b949e]">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-12 text-[#8b949e]">
            <Tag size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No promo codes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {promos.map(p => (
              <div key={p._id} className={`flex items-center gap-3 p-4 bg-[#0d1117] border rounded-xl transition-all ${p.active ? 'border-[#21262d]' : 'border-[#21262d] opacity-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#00dbe7]">{p.code}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${p.type === 'percent' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'}`}>
                      {p.type === 'percent' ? `${p.value}%` : `₹${p.value}`} off
                    </span>
                    {!p.active && <span className="text-[10px] text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <div className="flex gap-3 mt-1 text-[11px] text-[#8b949e]">
                    <span>Used: {p.usedCount}{p.maxUses > 0 ? `/${p.maxUses}` : ''}</span>
                    {p.minAmount > 0 && <span>Min ₹{p.minAmount}</span>}
                    {p.competitionId && <span>Comp: {p.competitionId}</span>}
                    {p.expiresAt && <span>Expires: {new Date(p.expiresAt).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
                <button onClick={() => toggleActive(p.code, p.active)} className="text-[#8b949e] hover:text-white transition-colors" title={p.active ? 'Deactivate' : 'Activate'}>
                  {p.active ? <ToggleRight size={20} className="text-[#00dbe7]" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => deletePromo(p.code)} className="text-[#8b949e] hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
