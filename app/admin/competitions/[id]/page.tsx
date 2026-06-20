'use client';
import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Loader2, Lock, Unlock, Play, Square,
  CheckCircle, AlertCircle, Download, RefreshCw, Shield, Video
} from 'lucide-react';

interface PageParams { params: Promise<{ id: string }> }

export default function AdminCompDetail({ params }: PageParams) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comp, setComp] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [scrambles, setScrambles] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'scrambles' | 'results' | 'anticheat'>('overview');
  const [selEvent, setSelEvent] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) { router.push('/login'); return; }
    Promise.all([
      fetch(`/api/competitions/${id}`).then(r => r.json()),
      fetch(`/api/admin/results?competitionId=${id}`).then(r => r.json()),
      fetch(`/api/admin/results?competitionId=${id}&flagged=true`).then(r => r.json()),
    ]).then(([compD, resD, flagD]) => {
      setComp(compD.competition);
      setResults(resD.results ?? []);
      setFlagged(flagD.results ?? []);
      const firstEvent = compD.competition?.events?.[0]?.eventId ?? compD.competition?.events?.[0] ?? '';
      setSelEvent(firstEvent);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [session, status, id, router]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const roundAction = async (action: string) => {
    setBusy(action);
    const res = await fetch(`/api/admin/competitions/${id}/rounds`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    flash(d.message ?? (d.ok ? 'Done' : d.error));
    setBusy('');
    if (d.ok && d.qualifiers) {
      flash(`Advanced ${d.qualifiers.length} competitors`);
    }
  };

  const scrambleAction = async (action: string) => {
    if (!selEvent) return;
    setBusy(action);
    const res = await fetch(`/api/admin/competitions/${id}/scrambles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, eventId: selEvent, count: 5 }),
    });
    const d = await res.json();
    setScrambles(d.scrambles ? { [selEvent]: { scrambles: d.scrambles, locked: d.locked } } : null);
    flash(d.ok ? `${action === 'generate' ? 'Generated' : action === 'lock' ? 'Locked' : 'Unlocked'} scrambles for ${selEvent}` : d.error);
    setBusy('');
  };

  const loadScrambles = async () => {
    if (!selEvent) return;
    const d = await fetch(`/api/admin/competitions/${id}/scrambles?eventId=${selEvent}`).then(r => r.json());
    setScrambles(d.scrambleSets ? { [selEvent]: d.scrambleSets } : null);
  };
  useEffect(() => { if (comp) loadScrambles(); }, [selEvent, comp]);

  const verifyResult = async (resultId: string, action: string) => {
    setBusy(resultId);
    const res = await fetch('/api/admin/results', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultId, action }),
    });
    const d = await res.json();
    if (d.ok) {
      setFlagged(prev => prev.filter(r => r.resultId !== resultId));
      flash(`Result ${action}d`);
    }
    setBusy('');
  };

  const DNF = 360000;
  const fmt = (ms: number) => !ms || ms >= DNF ? 'DNF' : (ms / 1000).toFixed(3);

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><Loader2 size={24} className="text-accent animate-spin" /></div>;
  if (!comp) return <div className="min-h-screen bg-bg flex items-center justify-center text-muted">Not found</div>;

  const compName = comp.name ?? comp.competitionName;
  const events: any[] = comp.events ?? [];
  const curScrambles = scrambles?.[selEvent];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/admin/competitions" className="inline-flex items-center gap-1 text-muted hover:text-fg text-xs mb-6 transition-colors">
          <ChevronLeft size={14} /> Competitions
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-xl font-black text-fg mb-1">{compName}</h1>
            <span className="text-xs font-mono text-muted">{comp.competitionId}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => roundAction('open')} disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50">
              {busy === 'open' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Open Round
            </button>
            <button onClick={() => roundAction('close')} disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-elevated border border-line-strong text-muted rounded-lg hover:text-fg transition-all disabled:opacity-50">
              {busy === 'close' ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />} Close Round
            </button>
            <button onClick={() => roundAction('advance')} disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-lg hover:bg-amber-400/20 transition-all disabled:opacity-50">
              {busy === 'advance' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Auto-Advance
            </button>
            <a href={`/api/admin/export/${comp.competitionId ?? id}`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded-lg hover:bg-emerald-400/20 transition-all">
              <Download size={12} /> Export CSV
            </a>
          </div>
        </div>

        {msg && <div className="mb-4 px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs">{msg}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface border border-line rounded-xl p-1">
          {(['overview', 'scrambles', 'results', 'anticheat'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t ? 'bg-elevated text-fg' : 'text-muted hover:text-fg'
              }`}>
              {t === 'anticheat' ? `🚩 Flagged (${flagged.length})` : t === 'scrambles' ? '🔐 Scrambles' : t === 'results' ? `📊 Results (${results.length})` : '📌 Overview'}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Status', comp.status], ['Events', events.map((e: any) => e.eventId ?? e).join(', ')],
              ['Registered', comp.registrationCount ?? 0], ['Rounds', comp.rounds ?? 1],
              ['Fee', comp.fee > 0 ? `₹${Math.round(comp.fee / 100)}` : 'Free'],
              ['Start', comp.startDate ? new Date(comp.startDate).toLocaleString('en-IN') : '—'],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between bg-surface border border-line rounded-xl px-4 py-3">
                <span className="text-muted">{k}</span>
                <span className="text-fg font-medium text-right max-w-[200px] truncate">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scrambles */}
        {tab === 'scrambles' && (
          <div className="space-y-4">
            {events.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {events.map((e: any) => {
                  const ev = e.eventId ?? e;
                  return (
                    <button key={ev} onClick={() => setSelEvent(ev)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                        selEvent === ev ? 'bg-accent/20 border border-accent/50 text-accent' : 'bg-elevated border border-line-strong text-muted hover:text-fg'
                      }`}>{ev}</button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {['generate', 'lock', 'unlock'].map(action => (
                <button key={action} onClick={() => scrambleAction(action)} disabled={!!busy}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all disabled:opacity-50 ${
                    action === 'lock' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20' :
                    action === 'unlock' ? 'bg-elevated border-line-strong text-muted hover:text-fg' :
                    'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
                  }`}>
                  {busy === action ? <Loader2 size={12} className="animate-spin" /> :
                    action === 'lock' ? <Lock size={12} /> : action === 'unlock' ? <Unlock size={12} /> : <RefreshCw size={12} />}
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              ))}
            </div>

            {curScrambles ? (
              <div className="bg-surface border border-line rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  {curScrambles.locked
                    ? <><Lock size={14} className="text-amber-400" /><span className="text-xs text-amber-400 font-semibold">LOCKED</span></>
                    : <><Unlock size={14} className="text-muted" /><span className="text-xs text-muted">Draft — not visible to competitors</span></>}
                </div>
                {(curScrambles.scrambles ?? []).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-line last:border-0">
                    <span className="text-[10px] font-mono text-muted flex-shrink-0 w-4">S{i + 1}</span>
                    <span className="font-mono text-xs text-fg break-all">{s}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted text-sm border border-dashed border-line rounded-2xl">
                No scrambles generated yet for {selEvent}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {tab === 'results' && (
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            {results.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm">No results yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-line text-muted">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Event</th>
                    <th className="px-4 py-2 text-right">ao5</th>
                    <th className="px-4 py-2 text-right">Best</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-center">Video</th>
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {results.map((r: any) => (
                      <tr key={r.resultId} className="hover:bg-elevated">
                        <td className="px-4 py-3 font-medium text-fg">{r.firstName} {r.lastName}</td>
                        <td className="px-4 py-3 font-mono text-muted">{r.eventId}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${r.averageTime >= DNF ? 'text-red-400' : 'text-fg'}`}>{fmt(r.averageTime)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted">{fmt(r.bestTime)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            r.status?.verified === 'verified' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-400/10' :
                            r.status?.verified === 'flagged' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                            'border-line-strong text-muted'
                          }`}>{r.status?.verified ?? 'pending'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.videoLink?.videoLink ? (
                            <a href={r.videoLink.videoLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"><Video size={13} /></a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Anti-cheat / flagged */}
        {tab === 'anticheat' && (
          <div className="space-y-3">
            {flagged.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm border border-dashed border-line rounded-2xl">
                <Shield size={28} className="mx-auto mb-2 opacity-20" /> No flagged results — all clear!
              </div>
            ) : flagged.map((r: any) => (
              <div key={r.resultId} className="bg-surface border border-red-500/20 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-fg">{r.firstName} {r.lastName} <span className="text-[10px] font-mono text-muted ml-1">{r.eventId}</span></p>
                    <p className="text-xs text-muted mt-0.5">ao5: <span className="text-fg font-mono">{fmt(r.averageTime)}</span> · Best: <span className="font-mono">{fmt(r.bestTime)}</span></p>
                    <div className="flex gap-1 mt-1">
                      {[r.value1, r.value2, r.value3, r.value4, r.value5].map((v: number, i: number) => (
                        <span key={i} className="font-mono text-[10px] text-muted">{fmt(v)}</span>
                      ))}
                    </div>
                    {r.videoLink?.videoLink && (
                      <a href={r.videoLink.videoLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1">
                        <Video size={11} /> Watch video
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => verifyResult(r.resultId, 'verify')} disabled={busy === r.resultId}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded-lg hover:bg-emerald-400/20 transition-all">
                      {busy === r.resultId ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Verify
                    </button>
                    <button onClick={() => verifyResult(r.resultId, 'plus2')} disabled={busy === r.resultId}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all">
                      +2
                    </button>
                    <button onClick={() => verifyResult(r.resultId, 'dnf')} disabled={busy === r.resultId}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">
                      <AlertCircle size={11} /> DNF
                    </button>
                    <button onClick={() => verifyResult(r.resultId, 'dq')} disabled={busy === r.resultId}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-elevated border border-line-strong text-muted rounded-lg hover:text-fg transition-all">
                      DQ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
