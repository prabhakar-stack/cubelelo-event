'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, UserX, UserCheck, Shield, Loader2 } from 'lucide-react';

export default function AdminUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) { router.push('/login'); return; }
    search('');
  }, [session, status]);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}&limit=50`).then(r => r.json()).catch(() => ({}));
    setUsers(res.users ?? []);
    setTotal(res.total ?? 0);
    setLoading(false);
  }, []);

  const handleAction = async (userId: string, action: string, role?: string) => {
    setBusy(userId);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, role }),
    });
    const d = await res.json();
    if (d.ok) setUsers(prev => prev.map(u => u.userId === userId ? { ...u, active: d.active, role: d.role } : u));
    setBusy('');
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/admin" className="text-xs text-[#8b949e] hover:text-white mb-1 block">← Admin</Link>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">Users <span className="text-[#8b949e] text-base font-normal ml-2">{total.toLocaleString()} total</span></h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input type="text" value={q} onChange={e => { setQ(e.target.value); search(e.target.value); }}
            placeholder="Search by name, email, CL ID, WCA ID…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="text-[#00dbe7] animate-spin" /></div>
        ) : (
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#21262d] text-[#8b949e]">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">CL ID</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">WCA ID</th>
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-[#21262d]">
                  {users.map((u: any) => (
                    <tr key={u.userId ?? u._id} className="hover:bg-[#161b22] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{u.name?.firstName} {u.name?.lastName}</div>
                        <div className="text-[#8b949e] truncate max-w-[160px]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#8b949e] hidden sm:table-cell">{u.userId}</td>
                      <td className="px-4 py-3 font-mono text-[#8b949e] hidden md:table-cell">{u.wcaId || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          u.role === 'admin' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-[#30363d] text-[#8b949e]'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          u.active ? 'border-emerald-500/30 text-emerald-400 bg-emerald-400/10' : 'border-red-500/30 text-red-400 bg-red-500/10'
                        }`}>{u.active ? 'Active' : 'Disabled'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleAction(u.userId, u.active ? 'disable' : 'enable')}
                            disabled={busy === u.userId}
                            title={u.active ? 'Disable' : 'Enable'}
                            className="p-1.5 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#161b22] transition-all disabled:opacity-50">
                            {busy === u.userId ? <Loader2 size={11} className="animate-spin" /> : u.active ? <UserX size={11} /> : <UserCheck size={11} />}
                          </button>
                          <Link href={`/profile/${u.userId}`} className="p-1.5 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#161b22] transition-all">
                            <Shield size={11} />
                          </Link>
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
