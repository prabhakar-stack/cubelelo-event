import type { Metadata } from 'next';
import './globals.css';
import SessionProviderWrapper from '@/components/ui/SessionProviderWrapper';
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';
import ClientMain from '@/components/ui/ClientMain';
import ThemeManager from '@/components/ui/ThemeManager';

export const metadata: Metadata = {
  title: 'Cubelelo — Elite Speedcubing Platform',
  description: 'Compete, practice, and track your speedcubing journey. WCA-style competitions, precision timer, and performance analytics.',
};

// Runs before paint to apply the saved theme — prevents a flash of the wrong theme.
const themeInitScript = `(function(){try{var t=localStorage.getItem('cl_theme');document.documentElement.classList.toggle('light',t==='light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-bg" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-full text-fg bg-bg antialiased"
        style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}
        suppressHydrationWarning
      >
        <SessionProviderWrapper>
          <ThemeManager />
          <NavBar />
          <ClientMain>{children}</ClientMain>
          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
