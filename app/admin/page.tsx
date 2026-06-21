'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Shield, Trophy, Users, CreditCard, FileText,
  Database, AlertCircle, Loader2, TrendingUp, Tag, ScrollText
} from 'lucide-react';

const NAV = [
  { href: '/admin/competitions', icon: Trophy, label: 'Competitions', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', desc: 'Create, manage, run rounds' },
  { href: '/admin/users', icon: Users, label: 'Users', color: 'text-accent', bg: 'bg-accent/10 border-accent/20', desc: 'Search, ban, manage roles' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', desc: 'Transaction log, revenue' },
  { href: '/admin/promos', icon: Tag, label: 'Promo Codes', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20', desc: 'Discount codes, usage limits' },
  { href: '/admin/content', icon: FileText, label: 'Content', color: 'text-lime', bg: 'bg-lime/10 border-lime/20', desc: 'Banners, announcements' },
  { href: '/admin/migration', icon: Database, label: 'Migration', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', desc: 'Import users, claim status' },
  { href: '/admin/audit', icon: ScrollText, label: 'Audit Log', color: 'text-purple-300', bg: 'bg-purple-300/10 border-purple-300/20', desc: 'Every admin action, logged' },
  { href: '/compete/admin', icon: Shield, label: 'Legacy Admin', color: 'text-muted', bg: 'bg-elevated border-line-strong', desc: 'Original competition panel' },
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
    return <div className="min-h-screen bg-bg flex items-center justify-center"><Loader2 size={24} className="text-accent animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Shield size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-fg">Admin Dashboard</h1>
            <p className="text-xs text-muted">Cubelelo Events Platform</p>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Competitions', value: stats.competitions, icon: Trophy, color: 'text-amber-400' },
              { label: 'Users', value: stats.users.toLocaleString(), icon: Users, color: 'text-accent' },
              { label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Flagged Results', value: stats.pending, icon: AlertCircle, color: 'text-red-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-surface border border-line rounded-2xl p-4">
                <Icon size={14} className={`${color} mb-2`} />
                <p className="text-2xl font-black text-fg">{value}</p>
                <p className="text-[10px] text-muted font-mono mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Nav cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV.map(({ href, icon: Icon, label, color, bg, desc }) => (
            <Link key={href} href={href}
              className="group bg-surface border border-line hover:border-line-strong rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
              <div className={`w-10 h-10 rounded-xl border ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="font-bold text-fg mb-1">{label}</p>
              <p className="text-xs text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
