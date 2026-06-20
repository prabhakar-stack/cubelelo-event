export type Theme = 'dark' | 'light';

const KEY = 'cl_theme';

/** Apply a theme to <html> and persist it locally (no-flash source of truth). */
export function applyTheme(t: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', t === 'light');
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
}

/** Read the locally-stored theme; defaults to dark. */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const t = localStorage.getItem(KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch { /* ignore */ }
  return 'dark';
}
