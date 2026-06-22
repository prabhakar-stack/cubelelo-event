import mongoose, { Document, Schema } from 'mongoose';

/**
 * A cubing "problem" (LeetCode-style). Daily problems become archived "old"
 * problems once the day rolls over (which unlocks the Solution tab).
 * Difficulty is derived from the optimal solver's move count (Engine A).
 */
export interface IProblem extends Document {
  problemId: string;            // slug, e.g. "2026-06-22-333"
  mode: 'daily' | 'archived' | 'practice';
  puzzleType: string;           // '222' | '333' (generic string → NxN-scalable)
  scramble: string;             // WCA notation
  stepLimit: number;            // optimal-move budget the user must beat
  optimalMoveCount: number;     // from Engine A — also drives difficulty
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  basePoints: number;
  hints: { order: number; body: string }[];   // predefined hint ladder (≤10)
  solutions: {
    optimal?: { moves: string; count: number };
    algorithmic?: { steps: { label: string; moves: string }[] };
  };
  activeDate?: string;          // 'YYYY-MM-DD' — the day it is/was the Daily
  archivedAt?: Date | null;     // set when it rolls over → Solution tab unlocks
  stats?: { attempts: number; solvers: number; avgScore: number };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProblemSchema = new Schema<IProblem>(
  {
    problemId: { type: String, required: true, unique: true },
    mode: { type: String, enum: ['daily', 'archived', 'practice'], default: 'practice', index: true },
    puzzleType: { type: String, required: true, index: true },
    scramble: { type: String, required: true },
    stepLimit: { type: Number, default: 0 },
    optimalMoveCount: { type: Number, default: 0 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
    basePoints: { type: Number, default: 100 },
    hints: [{ order: Number, body: String }],
    solutions: {
      optimal: { moves: String, count: Number },
      algorithmic: { steps: [{ label: String, moves: String }] },
    },
    activeDate: { type: String, index: true },
    archivedAt: { type: Date, default: null },
    stats: {
      attempts: { type: Number, default: 0 },
      solvers: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'problems' },
);

ProblemSchema.index({ mode: 1, activeDate: 1 });

export const Problem =
  mongoose.models.Problem ?? mongoose.model<IProblem>('Problem', ProblemSchema);
