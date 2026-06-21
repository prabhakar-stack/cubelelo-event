/**
 * Competition model — matches the real MongoDB schema exactly.
 *
 * Real DB field names preserved 1-to-1.
 * Use toApiShape() in API routes to convert to the frontend-friendly format.
 */

import mongoose, { Document, Schema } from 'mongoose';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const ScrambleSchema = new Schema(
  {
    defaultScramble: { type: Boolean, default: true },
    scramblePattern: [{ type: String }],
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    eventId: { type: String },        // "222", "333", "444" etc.
    eventName: { type: String },      // "2x2x2 Cube", "3x3x3 Cube" etc.
    scramble: { type: ScrambleSchema },
    start: { type: String },          // "1400" (24h time string)
    end: { type: String },            // "1430"
    resultVerified: { type: String, default: 'false' },
    competitorsIds: [{ type: String }],
  },
  { _id: true }
);

/**
 * Prize tier — rank-based winnings breakup (Dream11-style).
 * All money values are stored in **paise** (integer) so decimal rupee
 * amounts (e.g. ₹9.99 → 999) are represented exactly.
 *
 *  • mode 'fixed' → every rank in [rankStart, rankEnd] receives `amount`.
 *  • mode 'pool'  → `poolTotal` is split across the range using `distribution`.
 */
const PrizeTierSchema = new Schema(
  {
    rankStart:    { type: Number, required: true, min: 1 },
    rankEnd:      { type: Number, required: true, min: 1 },
    mode:         { type: String, enum: ['fixed', 'pool'], required: true },
    amount:       { type: Number, default: 0, min: 0 },   // paise — per-rank reward (mode 'fixed')
    poolTotal:    { type: Number, default: 0, min: 0 },   // paise — total for range (mode 'pool')
    distribution: { type: String, enum: ['uniform', 'linear', 'log'], default: 'uniform' },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

export interface ICompetition extends Document {
  competitionId: string;
  competitionType: string;
  competitionProfile: string;   // S3 banner image URL
  anotherImage?: string;
  competitionName: string;
  shortName?: string;
  registrationOpen: boolean;
  status: 'upcoming' | 'live' | 'past';
  featured: boolean;
  start: string;                // "YYYY-MM-DD"
  end: string;
  description?: string;
  verified: string;             // "true" | "false" stored as string in legacy data
  rules?: string;               // JSON string: [{heading, body}]
  faqs?: string;                // JSON string: [{heading, body}]
  createdByAdminId?: string;
  events: mongoose.Types.DocumentArray<any>;
  competitorsIds: string[];
  // ─── Pricing & prizes ───
  isFree: boolean;
  baseFee: number;        // paise
  perEventFee: number;    // paise
  maxEntries: number;
  rounds: number;
  prizes: {
    rankStart: number;
    rankEnd: number;
    mode: 'fixed' | 'pool';
    amount?: number;        // paise
    poolTotal?: number;     // paise
    distribution?: 'uniform' | 'linear' | 'log';
  }[];
  // ─── Round state ───
  roundOpenedAt?: Date;
  roundClosedAt?: Date;
  advancementCount?: number;
  currentRound?: number;
  qualifiedUserIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CompetitionSchema = new Schema<ICompetition>(
  {
    competitionId: { type: String },
    competitionType: { type: String },
    competitionProfile: { type: String },
    anotherImage: { type: String },
    competitionName: { type: String, required: true },
    shortName: { type: String },
    registrationOpen: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'past'],
      default: 'upcoming',
    },
    featured: { type: Boolean, default: false },
    start: { type: String },
    end: { type: String },
    description: { type: String },
    verified: { type: String, default: 'false' },
    rules: { type: String },
    faqs: { type: String },
    createdByAdminId: { type: String },
    events: [EventSchema],
    competitorsIds: [{ type: String }],
    // ─── Pricing & prizes ───
    isFree:      { type: Boolean, default: true },
    baseFee:     { type: Number, default: 0 },   // paise
    perEventFee: { type: Number, default: 0 },   // paise
    maxEntries:  { type: Number, default: 100 },
    rounds:      { type: Number, default: 1 },
    prizes:      { type: [PrizeTierSchema], default: [] },
    // ─── Round state ───
    roundOpenedAt:    { type: Date },
    roundClosedAt:    { type: Date },
    advancementCount: { type: Number, default: 16 },
    currentRound:     { type: Number, default: 1 },
    qualifiedUserIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
    collection: 'competitions',
  }
);

CompetitionSchema.index({ status: 1, start: -1 });
CompetitionSchema.index({ competitionId: 1 }, { unique: true, sparse: true });
CompetitionSchema.index({ featured: 1 });

// ─── Status helpers ────────────────────────────────────────────────────────────

/** eventId codes ("222") → UI type strings ("2x2x2") */
const EVENT_ID_TO_TYPE: Record<string, string> = {
  '222': '2x2x2',  '333': '3x3x3',   '444': '4x4x4',
  '555': '5x5x5',  '666': '6x6x6',   '777': '7x7x7',
  '333oh': 'OH',   '333bf': 'BLD',   'pyram': 'Pyraminx',
  'skewb': 'Skewb','minx': 'Megaminx','sq1': 'Square-1',
  'clock': 'Clock','333mbf': 'Multi-BLD',
};

export function mapEventId(id: string): string {
  return EVENT_ID_TO_TYPE[id] ?? id;
}

/** DB status + registrationOpen → uppercase UI status string */
export function mapDbStatus(status: string, registrationOpen: boolean): string {
  if (status === 'live') return 'LIVE';
  if (status === 'past') return 'COMPLETED';
  return registrationOpen ? 'REGISTRATION_OPEN' : 'REGISTRATION_CLOSED';
}

/** Sum of all prize tiers in paise (fixed: amount × ranks; pool: poolTotal). */
function computePrizePool(prizes: any[]): number {
  if (!Array.isArray(prizes)) return 0;
  return prizes.reduce((sum, t) => {
    const count = Math.max(0, (t.rankEnd ?? t.rankStart ?? 0) - (t.rankStart ?? 0) + 1);
    if (t.mode === 'pool') return sum + (t.poolTotal ?? 0);
    return sum + (t.amount ?? 0) * count;
  }, 0);
}

/**
 * Converts a lean() competition doc to the shape the frontend expects.
 * Call this in every API route before returning JSON.
 */
export function toApiShape(doc: any) {
  if (!doc) return null;
  const eventTypes = (doc.events ?? []).map((e: any) => mapEventId(e.eventId));
  return {
    _id: doc._id?.toString(),
    competitionId: doc.competitionId,
    name: doc.competitionName,
    shortName: doc.shortName,
    description: doc.description,
    bannerUrl: doc.competitionProfile,
    competitionType: doc.competitionType,
    featured: doc.featured ?? false,
    startDate: doc.start,
    endDate: doc.end,
    events: eventTypes,
    eventDetails: (doc.events ?? []).map((e: any) => ({
      eventId: e.eventId,
      eventName: e.eventName,
      type: mapEventId(e.eventId),
      start: e.start,
      end: e.end,
      resultVerified: e.resultVerified,
      competitorsIds: e.competitorsIds ?? [],
    })),
    registrationOpen: doc.registrationOpen,
    status: mapDbStatus(doc.status, doc.registrationOpen),
    isFree: doc.isFree ?? true,
    baseFee: doc.baseFee ?? 0,
    perEventFee: doc.perEventFee ?? 0,
    maxEntries: doc.maxEntries ?? 999,
    currentEntries: (doc.competitorsIds ?? []).length,
    entries: doc.competitorsIds ?? [],
    prizes: doc.prizes ?? [],
    prizePool: computePrizePool(doc.prizes ?? []),
    rules: (() => { try { return JSON.parse(doc.rules ?? '[]'); } catch { return []; } })(),
    faqs:  (() => { try { return JSON.parse(doc.faqs  ?? '[]'); } catch { return []; } })(),
    rounds: doc.rounds ?? 1,
    currentRound: doc.currentRound ?? 1,
    qualifiedUserIds: doc.qualifiedUserIds ?? [],
    roundOpenedAt: doc.roundOpenedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const Competition =
  mongoose.models.Competition ??
  mongoose.model<ICompetition>('Competition', CompetitionSchema);
