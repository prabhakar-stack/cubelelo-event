'use client';

import { usePathname } from 'next/navigation';

const NO_NAVBAR_ROUTES = ['/login', '/signup'];

export default function ClientMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = NO_NAVBAR_ROUTES.some(r => pathname === r);

  return (
    <main className={isAuthPage ? 'min-h-screen' : 'pt-14 min-h-screen'}>
      {children}
    </main>
  );
}
