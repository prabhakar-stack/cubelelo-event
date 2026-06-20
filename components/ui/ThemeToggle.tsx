'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme';

/**
 * Compact appearance (light/dark) toggle — LeetCode-style single icon button.
 * Applies instantly, persists locally, and saves to the account when signed in.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { status } = useSession();
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('light') ? 'light' : getStoredTheme());
    const onChange = (e: Event) => {
      const t = (e as CustomEvent).detail as Theme;
      if (t === 'light' || t === 'dark') setTheme(t);
    };
    window.addEventListener('cl:themechange', onChange);
    return () => window.removeEventListener('cl:themechange', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    if (status === 'authenticated') {
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next }),
      }).catch(() => {});
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className={`p-1.5 rounded-lg text-muted hover:text-fg hover:bg-line transition-colors ${className}`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
