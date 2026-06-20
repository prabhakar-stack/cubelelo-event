'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Shield, Trophy, Users, CreditCard, FileText,
  Database, AlertCircle, Loader2, TrendingUp, Tag
} from 'lucide-react';

const NAV = [
  { href: '/admin/competitions', icon: Trophy, label: 'Competitions', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', desc: 'Create, manage, run rounds' },
  { href: '/admin/users', icon: Users, label: 'Users', color: 'text-[#00dbe7]', bg: 'bg-[#00dbe7]/10 border-[#00dbe7]/20', desc: 'Search, ban, manage roles' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', desc: 'Transaction log, revenue' },
  { href: '/admin/promos', icon: Tag, label: 'Promo Codes', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20', desc: 'Discount codes, usage limits' },
  { href: '/admin/content', icon: FileText, label: 'Content', color: 'text-[#a3fa00]', bg: 'bg-[#a3fa00]/10 border-[#a3fa00]/20', desc: 'Banners, announcements' },
  { href: '/admin/migration', icon: Database, label: 'Migration', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', desc: 'Import users, claim status' },
  { href: '/compete/admin', icon: Shield, label: 'Legacy Admin', color: 'text-[#8b949e]', bg: 'bg-[#161b22] border-[#30363d]', desc: 'Original competition panel' },
];

interface Stats { competitions: number; users: number; revenue: number; pending: number }

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) {
      router.push('/login');
      return;
    }
    // Fetch summary stats
    Promise.all([
      fetch('/api/competitions?limit=1').then(r => r.json()),
      fetch('/api/admin/users?limit=1').then(r => r.json()),
      fetch('/api/admin/payments?status=paid&limit=1').then(r => r.json()),
      fetch('/api/admin/results?flagged=true&limit=1').then(r => r.json()),
    ]).then(([comps, users, pays, flags]) => {
      setStats({
        competitions: comps.total ?? 0,
        users: users.total ?? 0,
        revenue: Math.round((pays.totalRevenuePaise ?? 0) / 100),
        pending: flags.total ?? 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center"><Loader2 size={24} className="text-[#00dbe7] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 flex items-center justify-center">
            <Shield size={20} className="text-[#00dbe7]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
            <p className="text-xs text-[#8b949e]">Cubelelo Events Platform</p>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Competitions', value: stats.competitions, icon: Trophy, color: 'text-amber-400' },
              { label: 'Users', value: stats.users.toLocaleString(), icon: Users, color: 'text-[#00dbe7]' },
              { label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Flagged Results', value: stats.pending, icon: AlertCircle, color: 'text-red-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
                <Icon size={14} className={`${color} mb-2`} />
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Nav cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV.map(({ href, icon: Icon, label, color, bg, desc }) => (
            <Link key={href} href={href}
              className="group bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
              <div className={`w-10 h-10 rounded-xl border ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="font-bold text-white mb-1">{label}</p>
              <p className="text-xs text-[#8b949e]">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
