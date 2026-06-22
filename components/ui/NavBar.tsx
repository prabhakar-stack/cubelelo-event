'use client';

import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Timer, Trophy, Dumbbell, BarChart3, LogIn, LogOut, ChevronDown,
  Shield, UserPlus, Search, Boxes,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LiveBadge from '@/components/ui/LiveBadge';
import StreakFlame from '@/components/ui/StreakFlame';
import NotificationBell from '@/components/ui/NotificationBell';

const NAV_LINKS = [
  { href: '/problems', label: 'Train', icon: Boxes },
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/competitions', label: 'Compete', icon: Trophy },
  { href: '/timer', label: 'Timer', icon: Timer },
  { href: '/rankings', label: 'Rankings', icon: BarChart3 },
];

function openPalette() {
  window.dispatchEvent(new CustomEvent('cl:open-palette'));
}

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Auth pages have their own branding
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-lime flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow">
            <span className="text-black font-black text-xs">CB</span>
          </div>
          <span className="font-bold text-sm text-fg hidden sm:block">
            Cube<span className="text-accent">lelo</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive(href) ? 'bg-line text-accent' : 'text-muted hover:text-fg hover:bg-line/60'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Command palette trigger (desktop) */}
        <button
          onClick={openPalette}
          className="hidden sm:flex items-center gap-2 flex-1 max-w-xs mx-2 px-3 py-1.5 bg-elevated border border-line-strong rounded-lg text-xs text-muted hover:text-fg hover:border-muted transition-all"
        >
          <Search size={13} />
          <span className="flex-1 text-left">Search CL ID, competition…</span>
          <span className="font-mono text-[10px] border border-line-strong rounded px-1">⌘K</span>
        </button>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Search icon (mobile) */}
          <button onClick={openPalette} aria-label="Search" className="sm:hidden p-1.5 rounded-lg text-muted hover:text-fg hover:bg-line transition-colors">
            <Search size={17} />
          </button>

          <LiveBadge />
          <StreakFlame />

          <NotificationBell />

          <ThemeToggle />

          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-line animate-pulse" />
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-1.5 sm:px-2 py-1.5 rounded-lg hover:bg-line transition-all"
              >
                {session.user?.image ? (
                  <Image src={session.user.image} alt={session.user.name ?? 'User'} width={28} height={28} className="rounded-full border border-line-strong" unoptimized />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-lime flex items-center justify-center text-black font-bold text-xs">
                    {session.user?.name?.[0] ?? '?'}
                  </div>
                )}
                <span className="text-sm text-fg hidden lg:block max-w-[100px] truncate">{session.user?.name}</span>
                <ChevronDown size={13} className="text-muted hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-elevated border border-line-strong rounded-xl shadow-2xl z-20 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-line">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-semibold text-fg truncate">{session.user?.name}</p>
                        {session.user?.role === 'admin' && (
                          <span className="text-[9px] font-mono font-bold text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded-full flex-shrink-0">ADMIN</span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate">{session.user?.email}</p>
                      {(session.user as any)?.userId && (
                        <p className="text-[10px] font-mono text-muted mt-0.5">{(session.user as any).userId}</p>
                      )}
                    </div>
                    <div className="p-1">
                      {session.user?.role === 'admin' && (
                        <Link href="/compete/admin" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
                          <Shield size={14} /> Admin Panel
                        </Link>
                      )}
                      <Link href="/profile/me" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-fg hover:bg-line rounded-lg transition-colors">
                        Profile & Settings
                      </Link>
                      <button onClick={() => { signOut({ callbackUrl: '/' }); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-fg hover:bg-line border border-transparent hover:border-line-strong transition-all">
                <LogIn size={14} />
                <span className="hidden sm:block">Sign in</span>
              </Link>
              <Link href="/signup" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-black text-sm font-bold transition-all">
                <UserPlus size={14} />
                <span className="hidden sm:block">Sign up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
