import { getStatusLabel } from '@/lib/utils/competition';

const STYLES: Record<string, string> = {
  LIVE: 'bg-red-500/10 text-red-400 border-red-500/30',
  REGISTRATION_OPEN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  REGISTRATION_CLOSED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  COMPLETED: 'bg-muted/10 text-muted border-line-strong',
  CANCELLED: 'bg-red-900/10 text-red-300 border-red-900/30',
  DRAFT: 'bg-muted/10 text-muted border-line-strong',
};

/** Canonical status pill used across cards, detail pages and admin. */
export default function StatusChip({ status, className = '' }: { status: string; className?: string }) {
  const cls = STYLES[status] ?? 'bg-muted/10 text-muted border-line-strong';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls} ${className}`}>
      {status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {getStatusLabel(status)}
    </span>
  );
}
