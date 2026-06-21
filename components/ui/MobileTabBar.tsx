'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Trophy, Clock, BarChart3, User } from 'lucide-react';

const TABS = [
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/competitions', label: 'Compete', icon: Trophy },
  { href: '/timer', label: 'Timer', icon: Clock, center: true },
  { href: '/rankings', label: 'Rankings', icon: BarChart3 },
  { href: '/profile/me', label: 'Profile', icon: User },
];

/** Mobile-only bottom tab bar with an emphasized center Timer action. */
export default function MobileTabBar() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/signup') return null;

  const isActive = (h: string) => pathname === h || pathname.startsWith(h + '/');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-line">
      <div className="flex items-end justify-around px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ href, label, icon: Icon, center }) => {
          const active = isActive(href);
          if (center) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 -mt-5">
                <span className="w-12 h-12 rounded-full flex items-center justify-center bg-accent text-black border-4 border-bg shadow-lg shadow-accent/30">
                  <Icon size={20} />
                </span>
                <span className={`text-[10px] ${active ? 'text-accent' : 'text-muted'}`}>{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${active ? 'text-accent' : 'text-muted hover:text-fg'}`}
            >
              <Icon size={19} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
