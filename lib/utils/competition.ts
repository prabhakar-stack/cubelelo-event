// Shared competition helpers — used by pages, components, and admin
// Extracted from app/compete/page.tsx to avoid exporting from a Next.js page file

export type CompetitionStatus =
  | 'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED'
  | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL';

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
  baseFee: number;
  perEventFee: number;
  maxEntries: number;
  currentEntries?: number;
  status: Exclude<CompetitionStatus, 'ALL'>;
  rounds: number;
  currentRound: number;
  prize?: string;
  entries?: any[];
  rules?: { heading: string; body: string }[];
  faqs?: { heading: string; body: string }[];
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
