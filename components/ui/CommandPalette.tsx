'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Dumbbell, Trophy, Clock, BarChart3, User, Settings, Play, CornerDownLeft, Boxes, Wand2,
} from 'lucide-react';

type Item = { id: string; type: string; label: string; icon: React.ElementType; run: () => void };

const NAV = [
  { label: 'Train — problems', icon: Boxes, href: '/problems' },
  { label: 'Cube solver', icon: Wand2, href: '/solver' },
  { label: 'Cube builder', icon: Boxes, href: '/builder' },
  { label: 'Practice & daily challenge', icon: Dumbbell, href: '/practice' },
  { label: 'Competitions', icon: Trophy, href: '/competitions' },
  { label: 'Timer', icon: Clock, href: '/timer' },
  { label: 'Rankings', icon: BarChart3, href: '/rankings' },
  { label: "Start today's daily scramble", icon: Play, href: '/daily-challenge' },
  { label: 'My profile', icon: User, href: '/profile/me' },
  { label: 'Settings', icon: Settings, href: '/profile/me/settings' },
];

/** Global ⌘K command palette: jump to pages, competitions, or cubers. */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [comps, setComps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open via ⌘K / Ctrl+K, or a custom event fired by the nav search button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(o => !o); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('cl:open-palette', onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('cl:open-palette', onOpen); };
  }, []);

  useEffect(() => {
    if (!open) { setQuery(''); setActive(0); return; }
    inputRef.current?.focus();
    fetch('/api/competitions?limit=50')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.competitions) setComps(d.competitions); })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) { setUsers([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => setUsers((d?.users ?? []).slice(0, 5)))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  const go = useCallback((href: string) => { setOpen(false); router.push(href); }, [router]);

  const items: Item[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nav = NAV
      .filter(n => !q || n.label.toLowerCase().includes(q))
      .map((n, i) => ({ id: 'nav' + i, type: 'Go to', label: n.label, icon: n.icon, run: () => go(n.href) }));
    const c = comps
      .filter((x: any) => !q || (x.name ?? '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((x: any) => ({ id: 'c' + x._id, type: 'Competition', label: x.name, icon: Trophy, run: () => go(`/competitions/${x._id}`) }));
    const u = users.map((x: any) => ({ id: 'u' + x.clid, type: 'Cuber', label: x.name || x.clid, icon: User, run: () => go(`/profile/${x.clid}`) }));
    return [...nav, ...c, ...u];
  }, [query, comps, users, go]);

  useEffect(() => { setActive(a => Math.min(a, Math.max(items.length - 1, 0))); }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); items[active]?.run(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-surface border border-line-strong rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <Search size={16} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search competitions, cubers, or jump to…"
            className="flex-1 bg-transparent text-sm text-fg placeholder-muted focus:outline-none"
          />
          <span className="text-[10px] font-mono text-muted border border-line-strong rounded px-1.5 py-0.5">esc</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted">No matches</p>}
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => it.run()}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? 'bg-elevated' : ''}`}
              >
                <Icon size={16} className="text-muted flex-shrink-0" />
                <span className="flex-1 min-w-0 text-sm text-fg truncate">{it.label}</span>
                <span className="text-[10px] text-muted flex-shrink-0">{it.type}</span>
                {i === active && <CornerDownLeft size={13} className="text-muted flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
