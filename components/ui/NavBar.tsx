'use client';

import React, { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
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
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-20 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-[#21262d]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">
                          {session.user?.name}
                        </p>
                        {session.user?.role === 'ADMIN' && (
                          <span className="text-[9px] font-mono font-bold text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded-full">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8b949e] truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      {session.user?.role === 'ADMIN' && (
                        <Link
                          href="/compete/admin"
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Shield size={14} />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setProfileOpen(false); }}
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
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-sm font-medium text-white border border-[#30363d] transition-all"
            >
              <LogIn size={14} />
              <span className="hidden sm:block">Sign in</span>
            </button>
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
          {NAV_LINKS.map(({ href, label, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive(href)
                  ? 'bg-[#21262d] text-[#00dbe7]'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/60'
              }`}
            >
              <Icon size={18} />
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-[#8b949e]">{description}</div>
              </div>
            </Link>
          ))}
          {!session && (
            <div className="pt-2 border-t border-[#21262d]">
              <button
                onClick={() => { signIn('google'); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#21262d] text-sm font-medium text-white"
              >
                <LogIn size={15} />
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
