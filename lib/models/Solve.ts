/**
 * Practice solves — saved per-user for the timer terminal.
 * Competition solves are embedded in Competition.solveResults.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type SolveStatus = 'OK' | '+2' | 'DNF';

export interface ISolve extends Document {
  userId: string;
  sessionId?: string;     // CubeSession._id (optional — can be freeform)
  sessionName?: string;   // denormalized for display
  puzzleType: string;     // '3x3x3', '2x2x2', etc.
  timeInMs: number;
  scramble: string;
  status: SolveStatus;
  notes?: string;
  isPB: boolean;          // true if this was a PB at time of solve
  createdAt: Date;
}

const SolveSchema = new Schema<ISolve>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, index: true },
    sessionName: { type: String },
    puzzleType: { type: String, required: true, index: true },
    timeInMs: { type: Number, required: true },
    scramble: { type: String, required: true },
    status: { type: String, enum: ['OK', '+2', 'DNF'], default: 'OK' },
    notes: { type: String },
    isPB: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound index: user's solves per puzzle, sorted by time (for PB queries)
SolveSchema.index({ userId: 1, puzzleType: 1, timeInMs: 1 });

export const Solve =
  mongoose.models.Solve ?? mongoose.model<ISolve>('Solve', SolveSchema);
