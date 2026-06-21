'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';

interface Notif { _id: string; type: string; title: string; body?: string; link?: string; read: boolean; createdAt: string }

export default function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    fetch('/api/notifications')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) { setItems(d.notifications ?? []); setUnread(d.unread ?? 0); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [status, load]);

  if (status !== 'authenticated') return null;

  const markAll = () => {
    fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(() => { setUnread(0); setItems(prev => prev.map(n => ({ ...n, read: true }))); })
      .catch(() => {});
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread) markAll(); }}
        aria-label="Notifications"
        className="relative p-1.5 rounded-lg text-muted hover:text-fg hover:bg-line transition-colors"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-72 bg-elevated border border-line-strong rounded-xl shadow-2xl z-20 overflow-hidden">
            <div className="px-3 py-2 border-b border-line">
              <p className="text-xs font-semibold text-fg">Notifications</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted">No notifications yet.</p>
              ) : (
                items.map(n => {
                  const inner = (
                    <div className={`px-3 py-2.5 border-b border-line last:border-0 ${n.read ? '' : 'bg-accent/5'}`}>
                      <p className="text-xs font-medium text-fg">{n.title}</p>
                      {n.body && <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{n.body}</p>}
                    </div>
                  );
                  return n.link
                    ? <Link key={n._id} href={n.link} onClick={() => setOpen(false)} className="block hover:bg-line transition-colors">{inner}</Link>
                    : <div key={n._id}>{inner}</div>;
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
