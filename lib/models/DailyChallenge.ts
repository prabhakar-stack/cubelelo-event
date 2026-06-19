import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyChallenge extends Document {
  date: string;           // "YYYY-MM-DD"
  puzzleType: string;     // '3x3x3' for Phase 1
  scramble: string;
  createdAt: Date;
}

export interface IDailyChallengeEntry extends Document {
  challengeId: string;    // IDailyChallenge._id as string
  date: string;           // denormalized for easy queries
  userId: string;
  userName?: string;
  timeInMs?: number;
  status: 'OK' | '+2' | 'DNF';
  submittedAt: Date;
}

const DailyChallengeSchema = new Schema<IDailyChallenge>(
  {
    date: { type: String, required: true, unique: true },
    puzzleType: { type: String, required: true },
    scramble: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const DailyChallengeEntrySchema = new Schema<IDailyChallengeEntry>(
  {
    challengeId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String },
    timeInMs: { type: Number },
    status: { type: String, enum: ['OK', '+2', 'DNF'], default: 'OK' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// One entry per user per day
DailyChallengeEntrySchema.index({ challengeId: 1, userId: 1 }, { unique: true });

export const DailyChallenge =
  mongoose.models.DailyChallenge ??
  mongoose.model<IDailyChallenge>('DailyChallenge', DailyChallengeSchema);

export const DailyChallengeEntry =
  mongoose.models.DailyChallengeEntry ??
  mongoose.model<IDailyChallengeEntry>(
    'DailyChallengeEntry',
    DailyChallengeEntrySchema
  );
