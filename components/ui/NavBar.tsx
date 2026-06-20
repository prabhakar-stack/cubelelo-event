'use client';

import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Timer,
  Trophy,
  Dumbbell,
  LogIn,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Shield,
  UserPlus,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/timer', label: 'Timer', icon: Timer, description: 'Practice & Sessions' },
  { href: '/compete', label: 'Compete', icon: Trophy, description: 'Competitions & Events' },
  { href: '/practice', label: 'Practice', icon: Dumbbell, description: 'Drills & Daily Challenge' },
];

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  // Don't show navbar on auth pages — they have their own branding
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/80 backdrop-blur-xl border-b border-[#21262d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center shadow-lg shadow-[#00dbe7]/20 group-hover:shadow-[#00dbe7]/40 transition-shadow">
            <span className="text-black font-black text-xs">CB</span>
          </div>
          <span className="font-bold text-sm text-white hidden sm:block">
            Cube<span className="text-[#00dbe7]">lelo</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive(href)
                  ? 'bg-[#21262d] text-[#00dbe7]'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/60'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-2">
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-[#21262d] animate-pulse" />
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#21262d] transition-all"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? 'User'}
                    width={28}
                    height={28}
                    className="rounded-full border border-[#30363d]"
                    unoptimized
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center text-black font-bold text-xs">
                    {session.user?.name?.[0] ?? '?'}
                  </div>
                )}
                <span className="text-sm text-white hidden sm:block max-w-[100px] truncate">
                  {session.user?.name}
                </span>
                <ChevronDown size={13} className="text-[#8b949e]" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-20 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-[#21262d]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">
                          {session.user?.name}
                        </p>
                        {session.user?.role === 'admin' && (
                          <span className="text-[9px] font-mono font-bold text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8b949e] truncate">{session.user?.email}</p>
                      {(session.user as any)?.clId && (
                        <p className="text-[10px] font-mono text-[#8b949e] mt-0.5">
                          {(session.user as any).clId}
                        </p>
                      )}
                    </div>
                    <div className="p-1">
                      {session.user?.role === 'admin' && (
                        <Link
                          href="/compete/admin"
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Shield size={14} />
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/profile/me"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
                      >
                        Profile & Settings
                      </Link>
                      <button
                        onClick={() => { signOut({ callbackUrl: '/' }); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition-all"
              >
                <LogIn size={14} />
                <span className="hidden sm:block">Sign in</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00dbe7] hover:bg-[#00c4d0] text-black text-sm font-bold transition-all"
              >
                <UserPlus size={14} />
                <span className="hidden sm:block">Sign up</span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d1117] border-t border-[#21262d] px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(href)
                  ? 'bg-[#21262d] text-[#00dbe7]'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/60'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {!session && (
            <div className="pt-2 border-t border-[#21262d] space-y-1 mt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all">
                <LogIn size={16} /> Sign in
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-[#00dbe7]/10 text-[#00dbe7] hover:bg-[#00dbe7]/20 transition-all">
                <UserPlus size={16} /> Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
