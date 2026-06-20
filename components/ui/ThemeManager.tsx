'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { applyTheme, getStoredTheme } from '@/lib/theme';

/**
 * Keeps the applied theme in sync:
 *  - on mount, re-applies the locally stored theme (belt-and-suspenders with the
 *    no-flash <head> script);
 *  - once authenticated, pulls the account's saved theme so the preference
 *    follows the user across devices.
 */
export default function ThemeManager() {
  const { status } = useSession();

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/profile')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d?.user) return;
        const t = d.user.theme;
        if (t === 'light' || t === 'dark') applyTheme(t);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status]);

  return null;
}
