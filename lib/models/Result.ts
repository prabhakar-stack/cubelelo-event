/**
 * Result — matches the real "results" collection exactly.
 * value1-5 are solve times in ms (360000 = DNF sentinel).
 * bestTime/averageTime in ms.
 */
import mongoose, { Document, Schema } from 'mongoose';

const DNF_SENTINEL = 360000; // ms value used to represent DNF in the DB

export interface IResult extends Document {
  resultId: string;
  firstName: string;
  lastName: string;
  email: string;
  competitionId: string;
  competitionName: string;
  eventId: string;
  userId: string;
  wcaId: string;
  country: string;
  status: {
    verified: boolean;
    judge: string | null;
    remark: string | null;
  };
  bestTime: number;
  averageTime: number;
  value1: number;
  value2: number;
  value3: number;
  value4: number;
  value5: number;
  plus2Array: string[];
  verificationArray: string[];
  videoLink: { videoLink: string | null };
  valueX: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    resultId: { type: String, index: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    competitionId: { type: String, index: true },
    competitionName: { type: String },
    eventId: { type: String },
    userId: { type: String, index: true },
    wcaId: { type: String, default: 'NA' },
    country: { type: String, default: 'India' },
    status: {
      verified: { type: Boolean, default: false },
      judge: { type: String, default: null },
      remark: { type: String, default: null },
    },
    bestTime: { type: Number, default: DNF_SENTINEL },
    averageTime: { type: Number, default: DNF_SENTINEL },
    value1: { type: Number, default: DNF_SENTINEL },
    value2: { type: Number, default: DNF_SENTINEL },
    value3: { type: Number, default: DNF_SENTINEL },
    value4: { type: Number, default: DNF_SENTINEL },
    value5: { type: Number, default: DNF_SENTINEL },
    plus2Array: [{ type: String }],
    verificationArray: [{ type: String }],
    videoLink: {
      videoLink: { type: String, default: null },
    },
    valueX: [{ type: String }],
  },
  { timestamps: true, collection: 'results' }
);

ResultSchema.index({ competitionId: 1, eventId: 1 });
ResultSchema.index({ userId: 1, competitionId: 1 });

// Utility: is a solve time a DNF?
export function isDNF(ms: number): boolean {
  return ms >= DNF_SENTINEL;
}

// Format ms → "H:SS.sss" or "DNF"
export function formatMs(ms: number): string {
  if (isDNF(ms)) return 'DNF';
  const total = Math.floor(ms);
  const min = Math.floor(total / 60000);
  const sec = Math.floor((total % 60000) / 1000);
  const milli = total % 1000;
  if (min > 0) return `${min}:${sec.toString().padStart(2,'0')}.${milli.toString().padStart(3,'0')}`;
  return `${sec}.${milli.toString().padStart(3,'0')}`;
}

// Compute ao5 from 5 values (removes best + worst, averages middle 3)
export function computeAo5(vals: number[]): number {
  if (vals.length < 5) return DNF_SENTINEL;
  const sorted = [...vals].sort((a, b) => a - b);
  const middle = sorted.slice(1, 4);
  if (middle.some(v => isDNF(v))) return DNF_SENTINEL;
  return Math.round(middle.reduce((s, v) => s + v, 0) / 3);
}

export const Result = mongoose.models.Result ?? mongoose.model<IResult>('Result', ResultSchema);
