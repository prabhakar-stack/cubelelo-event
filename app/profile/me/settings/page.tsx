'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Bell, Eye, Moon, Sun, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = { type: 'success' | 'error'; msg: string } | null;

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-white">
        <Icon size={15} className="text-[#8b949e]" />
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
        <p className="text-sm text-white group-hover:text-[#00dbe7] transition-colors">{label}</p>
        {sub && <p className="text-xs text-[#8b949e] mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${checked ? 'bg-[#00dbe7]' : 'bg-[#30363d]'}`}
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
        }
      })
      .catch(() => {});
    const stored = localStorage.getItem('cl_theme');
    if (stored === 'light' || stored === 'dark') setTheme(stored);
  }, [session]);

  const applyTheme = (t: 'dark' | 'light') => {
    setTheme(t);
    localStorage.setItem('cl_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    return <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#00dbe7]/30 border-t-[#00dbe7] rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/profile/me" className="p-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-white">Account Settings</h1>
        </div>

        {/* Password */}
        <Section title="Change Password" icon={Lock}>
          <form onSubmit={changePassword} className="space-y-3">
            {[
              { label: 'Current password', value: oldPw, setter: setOldPw },
              { label: 'New password', value: newPw, setter: setNewPw },
              { label: 'Confirm new password', value: confirmPw, setter: setConfirmPw },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="block text-xs text-[#8b949e] mb-1">{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161b22] border border-[#30363d] text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors"
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
              className="w-full py-2 rounded-xl text-sm font-bold bg-[#21262d] text-white hover:bg-[#30363d] disabled:opacity-50 transition-all">
              {savingPw ? 'Saving...' : 'Update Password'}
            </button>
          </form>
          <p className="text-xs text-[#8b949e]">
            Signed in with Google? <Link href="/forgot-password" className="text-[#00dbe7] hover:underline">Set a password via email reset.</Link>
          </p>
        </Section>

        {/* Theme */}
        <Section title="Appearance" icon={theme === 'dark' ? Moon : Sun}>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map(t => (
              <button key={t} onClick={() => applyTheme(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  theme === t ? 'bg-[#00dbe7]/10 border-[#00dbe7]/40 text-[#00dbe7]' : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e]'
                }`}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#8b949e]">Dark mode is default. Your preference is saved locally.</p>
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
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#00dbe7] text-black hover:bg-[#00dbe7]/80 disabled:opacity-50 transition-all">
          {savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>

      </div>
    </div>
  );
}
