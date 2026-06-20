import type { Metadata } from 'next';
import './globals.css';
import SessionProviderWrapper from '@/components/ui/SessionProviderWrapper';
import NavBar from '@/components/ui/NavBar';
import ClientMain from '@/components/ui/ClientMain';

export const metadata: Metadata = {
  title: 'Cubelelo — Elite Speedcubing Platform',
  description: 'Compete, practice, and track your speedcubing journey. WCA-style competitions, precision timer, and performance analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#0b0e11]">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-full text-[#e1e2e7] bg-[#0b0e11] antialiased"
        style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}
        suppressHydrationWarning
      >
        <SessionProviderWrapper>
          <NavBar />
          <ClientMain>{children}</ClientMain>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
