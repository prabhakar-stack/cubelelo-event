// Shared competition helpers — used by pages, components, and admin
// Extracted from app/compete/page.tsx to avoid exporting from a Next.js page file

export type CompetitionStatus =
  | 'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED'
  | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL';

// ─── Prizes ──────────────────────────────────────────────────────────────────
// All money values are in **paise** (integer). ₹9.99 → 999.

export type DistributionFn = 'uniform' | 'linear' | 'log';

export interface PrizeTier {
  rankStart: number;
  rankEnd: number;
  mode: 'fixed' | 'pool';
  amount?: number;       // paise — per-rank reward (mode 'fixed')
  poolTotal?: number;    // paise — total for the range (mode 'pool')
  distribution?: DistributionFn;
}

export interface Competition {
  _id: string;
  competitionId?: string;
  name: string;
  shortName?: string;
  description?: string;
  bannerUrl?: string;
  competitionType?: string;
  featured?: boolean;
  events: string[];
  eventDetails?: any[];
  startDate: string;
  endDate?: string;
  registrationOpen?: boolean;
  isFree: boolean;
  baseFee: number;        // paise
  perEventFee: number;    // paise
  maxEntries: number;
  currentEntries?: number;
  status: Exclude<CompetitionStatus, 'ALL'>;
  rounds: number;
  currentRound: number;
  prizes?: PrizeTier[];
  prizePool?: number;     // paise
  entries?: any[];
  rules?: { heading: string; body: string }[];
  faqs?: { heading: string; body: string }[];
}

// ─── Money formatting ────────────────────────────────────────────────────────

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format an integer paise value as an exact INR string, e.g. 99900 → "₹999.00". */
export function formatPrice(paise: number): string {
  return INR.format((paise ?? 0) / 100);
}

/** Total registration fee in paise for a competition given a number of events. */
export function registrationFee(comp: Pick<Competition, 'isFree' | 'baseFee' | 'perEventFee'>, eventCount: number): number {
  if (comp.isFree) return 0;
  return (comp.baseFee ?? 0) + (comp.perEventFee ?? 0) * Math.max(eventCount, 1);
}

// ─── Prize distribution ──────────────────────────────────────────────────────

/**
 * Relative weights for `count` ranks (index 0 = best rank), per distribution fn.
 *  • uniform → every rank equal
 *  • linear  → linearly decreasing (count, count-1, … 1)
 *  • log     → logarithmic decay 1/log2(i+2) (DCG-style)
 */
export function distributionWeights(count: number, fn: DistributionFn): number[] {
  if (count <= 0) return [];
  switch (fn) {
    case 'linear':
      return Array.from({ length: count }, (_, i) => count - i);
    case 'log':
      return Array.from({ length: count }, (_, i) => 1 / Math.log2(i + 2));
    case 'uniform':
    default:
      return Array.from({ length: count }, () => 1);
  }
}

/**
 * Split `poolTotal` paise across `count` ranks by the distribution function.
 * Uses integer paise with largest-remainder rounding so the parts sum exactly
 * to `poolTotal`.
 */
export function distributePool(poolTotal: number, count: number, fn: DistributionFn): number[] {
  if (count <= 0 || poolTotal <= 0) return Array.from({ length: Math.max(count, 0) }, () => 0);
  const weights = distributionWeights(count, fn);
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (poolTotal * w) / sum);
  const floored = raw.map(Math.floor);
  let remainder = poolTotal - floored.reduce((a, b) => a + b, 0);
  // Hand leftover paise to the highest-fractional ranks (best ranks first on ties).
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < order.length && remainder > 0; k++) {
    floored[order[k].i] += 1;
    remainder--;
  }
  return floored;
}

/** Resolve the prize (paise) for a given finishing rank, 0 if none. */
export function prizeForRank(prizes: PrizeTier[] | undefined, rank: number): number {
  if (!prizes?.length || rank < 1) return 0;
  const tier = prizes.find(t => rank >= t.rankStart && rank <= t.rankEnd);
  if (!tier) return 0;
  if (tier.mode === 'fixed') return tier.amount ?? 0;
  const count = tier.rankEnd - tier.rankStart + 1;
  const parts = distributePool(tier.poolTotal ?? 0, count, tier.distribution ?? 'uniform');
  return parts[rank - tier.rankStart] ?? 0;
}

/** Total prize pool (paise) across all tiers. */
export function totalPrizePool(prizes: PrizeTier[] | undefined): number {
  if (!prizes?.length) return 0;
  return prizes.reduce((sum, t) => {
    const count = Math.max(0, t.rankEnd - t.rankStart + 1);
    return sum + (t.mode === 'pool' ? (t.poolTotal ?? 0) : (t.amount ?? 0) * count);
  }, 0);
}

export function getPuzzleEmoji(type: string): string {
  const map: Record<string, string> = {
    '3x3x3': '🟧', '2x2x2': '🟩', '4x4x4': '🟦', '5x5x5': '🟪',
    'OH': '✋', 'Pyraminx': '🔺', 'Megaminx': '⭐', 'Skewb': '💠',
    'Square-1': '⬜', 'Clock': '🕐',
  };
  return map[type] ?? '🧩';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    REGISTRATION_OPEN: 'Registration Open',
    REGISTRATION_CLOSED: 'Upcoming',
    LIVE: 'LIVE',
    COMPLETED: 'Past',
    CANCELLED: 'Cancelled',
  };
  return map[status] ?? status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    LIVE: 'text-red-400 bg-red-500/10 border-red-500/30',
    REGISTRATION_OPEN: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    REGISTRATION_CLOSED: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    COMPLETED: 'text-[#8b949e] bg-[#8b949e]/10 border-[#8b949e]/30',
    DRAFT: 'text-[#8b949e] bg-[#8b949e]/10 border-[#8b949e]/30',
    CANCELLED: 'text-red-300 bg-red-900/10 border-red-900/30',
  };
  return map[status] ?? 'text-white';
}
