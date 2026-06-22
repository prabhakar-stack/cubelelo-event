import mongoose, { Document, Schema } from 'mongoose';

/**
 * One canonical row per (problem, user). Holds the persisted hint/penalty state
 * (survives leaving & returning) and the best result + score. Individual attempts
 * are appended to `attempts` (feeds the Submissions tab).
 */
export interface IUserSubmission extends Document {
  problemId: string;
  userId: string;               // CL ID
  date: string;
  status: 'in_progress' | 'solved' | 'over_limit' | 'dnf';
  // ── Hint persistence ──
  hintsUsed: number;
  hintsRevealed: number[];      // which hint orders are open (re-shown on return)
  penaltyPercent: number;       // min(CAP, 5 × max(0, hintsUsed − 1))
  hintsLocked: boolean;         // cap reached OR no more hints
  lastHintAt?: Date;
  // ── Result / score ──
  bestSolution?: string;
  bestMoveCount?: number;
  bestTimeMs?: number;
  withinStepLimit?: boolean;
  finalScore?: number;
  pointsAwarded?: number;
  solvedAt?: Date;
  attempts: { solution: string; moveCount: number; status: string; scoreAtSubmit: number; createdAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSubmissionSchema = new Schema<IUserSubmission>(
  {
    problemId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: String },
    status: { type: String, enum: ['in_progress', 'solved', 'over_limit', 'dnf'], default: 'in_progress' },
    hintsUsed: { type: Number, default: 0 },
    hintsRevealed: [{ type: Number }],
    penaltyPercent: { type: Number, default: 0 },
    hintsLocked: { type: Boolean, default: false },
    lastHintAt: { type: Date },
    bestSolution: { type: String },
    bestMoveCount: { type: Number },
    bestTimeMs: { type: Number },
    withinStepLimit: { type: Boolean },
    finalScore: { type: Number },
    pointsAwarded: { type: Number },
    solvedAt: { type: Date },
    attempts: [{
      solution: String,
      moveCount: Number,
      status: String,
      scoreAtSubmit: Number,
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true, collection: 'usersubmissions' },
);

UserSubmissionSchema.index({ problemId: 1, userId: 1 }, { unique: true });

export const UserSubmission =
  mongoose.models.UserSubmission ?? mongoose.model<IUserSubmission>('UserSubmission', UserSubmissionSchema);
