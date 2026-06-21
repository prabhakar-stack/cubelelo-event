'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Bell, Eye, Moon, Sun, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme';

type Status = { type: 'success' | 'error'; msg: string } | null;

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
        <Icon size={15} className="text-muted" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div>
        <p className="text-sm text-fg group-hover:text-accent transition-colors">{label}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${checked ? 'bg-accent' : 'bg-line-strong'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [prefs, setPrefs] = useState({
    notifEmail: true,
    notifPush: true,
    privacyPublic: true,
  });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sent'>('idle');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwStatus, setPwStatus] = useState<Status>(null);
  const [prefStatus, setPrefStatus] = useState<Status>(null);
  const [savingPw, setSavingPw] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Load current prefs from profile
  useEffect(() => {
    if (!session) return;
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setPrefs({
            notifEmail: d.user.notifEmail ?? true,
            notifPush: d.user.notifPush ?? true,
            privacyPublic: d.user.privacyPublic ?? true,
          });
          setEmailVerified(d.user.emailVerified ?? false);
          // Account theme is the source of truth across devices; fall back to local.
          const t: Theme = d.user.theme === 'light' || d.user.theme === 'dark'
            ? d.user.theme : getStoredTheme();
          setTheme(t);
          applyTheme(t);
        }
      })
      .catch(() => {});
    setTheme(getStoredTheme());
  }, [session]);

  const selectTheme = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
    // Persist to the account so the preference follows the user across devices.
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    setPrefStatus(null);
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const d = await r.json();
      if (r.ok) {
        setPrefStatus({ type: 'success', msg: 'Preferences saved.' });
      } else {
        setPrefStatus({ type: 'error', msg: d.error ?? 'Save failed' });
      }
    } catch {
      setPrefStatus({ type: 'error', msg: 'Network error' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const resendVerification = async () => {
    try { await fetch('/api/auth/resend-verification', { method: 'POST' }); setResendState('sent'); } catch { /* ignore */ }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    if (newPw !== confirmPw) { setPwStatus({ type: 'error', msg: 'Passwords do not match' }); return; }
    if (newPw.length < 8) { setPwStatus({ type: 'error', msg: 'New password must be at least 8 characters' }); return; }
    setSavingPw(true);
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', oldPassword: oldPw, newPassword: newPw }),
      });
      const d = await r.json();
      if (r.ok) {
        setPwStatus({ type: 'success', msg: 'Password updated successfully.' });
        setOldPw(''); setNewPw(''); setConfirmPw('');
      } else {
        setPwStatus({ type: 'error', msg: d.error ?? 'Password change failed' });
      }
    } catch {
      setPwStatus({ type: 'error', msg: 'Network error' });
    } finally {
      setSavingPw(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/profile/me" className="p-2 rounded-lg text-muted hover:text-fg hover:bg-line transition-all">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-fg">Account Settings</h1>
        </div>

        {/* Email verification notice */}
        {emailVerified === false && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-400 font-medium">Email not verified</p>
              <p className="text-xs text-muted">Verify your email to register for paid competitions.</p>
            </div>
            {resendState === 'sent' ? (
              <span className="text-xs text-emerald-400 font-medium">Sent ✓</span>
            ) : (
              <button onClick={resendVerification} className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-all">Resend</button>
            )}
          </div>
        )}

        {/* Password */}
        <Section title="Change Password" icon={Lock}>
          <form onSubmit={changePassword} className="space-y-3">
            {[
              { label: 'Current password', value: oldPw, setter: setOldPw },
              { label: 'New password', value: newPw, setter: setNewPw },
              { label: 'Confirm new password', value: confirmPw, setter: setConfirmPw },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="block text-xs text-muted mb-1">{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-elevated border border-line-strong text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            ))}
            {pwStatus && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${pwStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {pwStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {pwStatus.msg}
              </div>
            )}
            <button type="submit" disabled={savingPw}
              className="w-full py-2 rounded-xl text-sm font-bold bg-line text-fg hover:bg-line-strong disabled:opacity-50 transition-all">
              {savingPw ? 'Saving...' : 'Update Password'}
            </button>
          </form>
          <p className="text-xs text-muted">
            Signed in with Google? <Link href="/forgot-password" className="text-accent hover:underline">Set a password via email reset.</Link>
          </p>
        </Section>

        {/* Theme */}
        <Section title="Appearance" icon={theme === 'dark' ? Moon : Sun}>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map(t => (
              <button key={t} onClick={() => selectTheme(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  theme === t ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-elevated border-line-strong text-muted hover:text-fg hover:border-muted'
                }`}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">Applies instantly and saves to your account, syncing across devices.</p>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          <div className="space-y-4">
            <Toggle
              label="Email notifications"
              sub="Round opens, results published, advancement confirmed"
              checked={prefs.notifEmail}
              onChange={v => setPrefs(p => ({ ...p, notifEmail: v }))}
            />
            <Toggle
              label="Push notifications"
              sub="In-browser alerts when your round starts"
              checked={prefs.notifPush}
              onChange={v => setPrefs(p => ({ ...p, notifPush: v }))}
            />
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy" icon={Eye}>
          <Toggle
            label="Public profile"
            sub="Other cubers can see your profile, PBs and competition history"
            checked={prefs.privacyPublic}
            onChange={v => setPrefs(p => ({ ...p, privacyPublic: v }))}
          />
        </Section>

        {/* Save prefs */}
        {prefStatus && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${prefStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {prefStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {prefStatus.msg}
          </div>
        )}
        <button onClick={savePrefs} disabled={savingPrefs}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-accent text-black hover:bg-accent/80 disabled:opacity-50 transition-all">
          {savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>

      </div>
    </div>
  );
}
