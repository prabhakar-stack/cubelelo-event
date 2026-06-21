'use client';

import { usePathname } from 'next/navigation';
import FreezeBanner from '@/components/ui/FreezeBanner';

const NO_NAVBAR_ROUTES = ['/login', '/signup'];

export default function ClientMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = NO_NAVBAR_ROUTES.some(r => pathname === r);

  return (
    <main className={isAuthPage ? 'min-h-screen' : 'pt-14 pb-16 md:pb-0 min-h-screen'}>
      {!isAuthPage && <FreezeBanner />}
      {children}
    </main>
  );
}
