// ─── Cubelelo Events Platform — Mock Data ────────────────────────────────────
// Used for frontend scaffolding before real backend is wired.
// All types mirror the Prisma schema in prisma/schema.prisma

export type CompetitionStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MockCompetition {
  id: string;
  name: string;
  description: string;
  puzzleType: string;
  startDate: string; // ISO string
  endDate: string;
  entryFee: number; // in INR
  maxEntries: number;
  currentEntries: number;
  status: CompetitionStatus;
  rounds: number;
  currentRound: number;
  prize?: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string;
  wcaId?: string;
  country: string;
  rank: number;
  role: 'ATHLETE' | 'ADMIN' | 'DELEGATE';
}

export interface MockLeaderboardEntry {
  rank: number;
  user: MockUser;
  average: number | null; // ms, null = DNF
  best: number | null;
  solves: (number | null)[]; // 5 attempts, null = DNF
}

export interface MockDailyChallenge {
  id: string;
  date: string;
  puzzleType: string;
  scramble: string;
}

// ─── Competitions ─────────────────────────────────────────────────────────────

export const MOCK_COMPETITIONS: MockCompetition[] = [
  {
    id: 'comp-001',
    name: 'Neo Cube Open 2026',
    description: 'Monthly open competition for all speedcubers. Hosted on the Cubelelo platform.',
    puzzleType: '3x3x3',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    entryFee: 99,
    maxEntries: 64,
    currentEntries: 41,
    status: 'REGISTRATION_OPEN',
    rounds: 3,
    currentRound: 1,
    prize: '₹5,000 + Trophy',
  },
  {
    id: 'comp-002',
    name: 'Speedcube Sprint #7',
    description: 'Quick-fire 2x2 speed round. 5 attempts, best average wins.',
    puzzleType: '2x2x2',
    startDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    entryFee: 49,
    maxEntries: 32,
    currentEntries: 32,
    status: 'REGISTRATION_CLOSED',
    rounds: 2,
    currentRound: 2,
    prize: '₹2,000',
  },
  {
    id: 'comp-003',
    name: 'Megaminx Masters',
    description: 'Elite Megaminx competition. WCA-style rounds.',
    puzzleType: 'Megaminx',
    startDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    entryFee: 149,
    maxEntries: 24,
    currentEntries: 22,
    status: 'LIVE',
    rounds: 2,
    currentRound: 1,
    prize: '₹8,000 + Medal',
  },
  {
    id: 'comp-004',
    name: 'OH Invitational',
    description: 'One-Handed solving only. Sub-30 to qualify.',
    puzzleType: 'OH',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    entryFee: 99,
    maxEntries: 16,
    currentEntries: 7,
    status: 'REGISTRATION_OPEN',
    rounds: 2,
    currentRound: 1,
    prize: '₹3,000',
  },
  {
    id: 'comp-005',
    name: '4x4x4 Relay Classic',
    description: 'Classic 4x4 relay — 3 attempts, best single counts.',
    puzzleType: '4x4x4',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    entryFee: 79,
    maxEntries: 48,
    currentEntries: 48,
    status: 'COMPLETED',
    rounds: 3,
    currentRound: 3,
    prize: '₹4,500',
  },
  {
    id: 'comp-006',
    name: 'Pyraminx Blitz',
    description: 'Fast-paced Pyraminx event. 5 attempts, best of 5.',
    puzzleType: 'Pyraminx',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    entryFee: 0,
    maxEntries: 100,
    currentEntries: 23,
    status: 'REGISTRATION_OPEN',
    rounds: 1,
    currentRound: 1,
    prize: 'Certificate + Ranking Points',
  },
];

// ─── Mock Users / Athletes ────────────────────────────────────────────────────

export const MOCK_USERS: MockUser[] = [
  { id: 'u1', name: 'Aditya Rathi', email: 'aditya@example.com', image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=aditya', wcaId: '2019RATH01', country: 'India', rank: 12, role: 'ATHLETE' },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@example.com', image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=priya', wcaId: '2020SHAR02', country: 'India', rank: 34, role: 'ATHLETE' },
  { id: 'u3', name: 'Rohan Mehta', email: 'rohan@example.com', image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=rohan', wcaId: '2018MEHT03', country: 'India', rank: 7, role: 'ATHLETE' },
  { id: 'u4', name: 'Kavya Singh', email: 'kavya@example.com', image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=kavya', country: 'India', rank: 89, role: 'ATHLETE' },
  { id: 'u5', name: 'Arjun Patel', email: 'arjun@example.com', image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=arjun', wcaId: '2021PATE01', country: 'India', rank: 55, role: 'ATHLETE' },
  { id: 'u6', name: 'Sneha Nair', email: 'sneha@example.com', image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=sneha', country: 'India', rank: 120, role: 'ATHLETE' },
  { id: 'u7', name: 'Dev Admin', email: 'dev@cubelelo.com', image: 'https://api.dicebear.com/8.x/avataaars/svg?seed=cubelelo', country: 'India', rank: 1, role: 'ADMIN' },
];

// ─── Mock Leaderboard ─────────────────────────────────────────────────────────

export const MOCK_LEADERBOARD: MockLeaderboardEntry[] = [
  { rank: 1, user: MOCK_USERS[2], average: 8432, best: 7821, solves: [7821, 8540, 8933, null, 9012] },
  { rank: 2, user: MOCK_USERS[0], average: 9120, best: 8670, solves: [8670, 9340, 9250, 8980, 10200] },
  { rank: 3, user: MOCK_USERS[1], average: 10890, best: 9900, solves: [9900, 11200, 10900, 10570, 11890] },
  { rank: 4, user: MOCK_USERS[4], average: 12340, best: 11100, solves: [11100, 12800, 12900, 11920, 13200] },
  { rank: 5, user: MOCK_USERS[3], average: 14500, best: 13200, solves: [13200, null, 14800, 15100, 14200] },
  { rank: 6, user: MOCK_USERS[5], average: 17800, best: 15400, solves: [15400, 18200, 17800, 18100, 17600] },
];

// ─── Daily Challenges ─────────────────────────────────────────────────────────

export function getTodaysDailyChallenge(): MockDailyChallenge {
  const today = new Date().toISOString().split('T')[0];
  // Seed scrambles by date for determinism
  const scrambles: Record<string, { puzzleType: string; scramble: string }> = {
    default: { puzzleType: '3x3x3', scramble: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  };
  const data = scrambles[today] ?? scrambles.default;
  return {
    id: `daily-${today}`,
    date: today,
    ...data,
  };
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export function getStatusLabel(status: CompetitionStatus): string {
  const labels: Record<CompetitionStatus, string> = {
    DRAFT: 'Draft',
    REGISTRATION_OPEN: 'Open',
    REGISTRATION_CLOSED: 'Closed',
    LIVE: '🔴 LIVE',
    COMPLETED: 'Ended',
    CANCELLED: 'Cancelled',
  };
  return labels[status];
}

export function getStatusColor(status: CompetitionStatus): string {
  const colors: Record<CompetitionStatus, string> = {
    DRAFT: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
    REGISTRATION_OPEN: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    REGISTRATION_CLOSED: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    LIVE: 'text-red-400 bg-red-400/10 border-red-400/30 animate-pulse',
    COMPLETED: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
    CANCELLED: 'text-red-500 bg-red-500/10 border-red-500/30',
  };
  return colors[status];
}

export function getPuzzleEmoji(puzzleType: string): string {
  const emojis: Record<string, string> = {
    '3x3x3': '🧊',
    '2x2x2': '🔷',
    '4x4x4': '🟦',
    'OH': '🖐️',
    'Pyraminx': '🔺',
    'Megaminx': '⭐',
  };
  return emojis[puzzleType] ?? '🧩';
}
