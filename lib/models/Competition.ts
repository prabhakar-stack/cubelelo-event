import mongoose, { Document, Schema } from 'mongoose';

export type CompetitionStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'WAIVED' | 'REFUNDED';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const ScrambleSetSchema = new Schema(
  {
    round: { type: Number, required: true },
    event: { type: String, required: true },  // puzzleType
    scrambles: [{ type: String }],            // array of 5 scrambles
    lockedAt: { type: Date },
    lockedBy: { type: String },               // admin user id
  },
  { _id: true }
);

const EntrySchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'WAIVED', 'REFUNDED'], default: 'PENDING' },
    paymentRef: { type: String },   // Razorpay payment ID
    registeredAt: { type: Date, default: Date.now },
    events: [{ type: String }],     // which events user entered
  },
  { _id: true }
);

// ─── Round result per competitor per solve ─────────────────────────────────────
const SolveResultSchema = new Schema(
  {
    userId: { type: String, required: true },
    round: { type: Number, required: true },
    event: { type: String, required: true },
    attemptNumber: { type: Number, required: true },   // 1-5
    timeInMs: { type: Number },                        // null = DNF
    scramble: { type: String },
    status: { type: String, enum: ['OK', '+2', 'DNF'], default: 'OK' },
    videoUrl: { type: String },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
    verifiedBy: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ─── Main Competition schema ─────────────────────────────────────────────────

export interface ICompetition extends Document {
  name: string;
  slug: string;
  description?: string;
  events: string[];           // ['3x3x3', '2x2x2', ...]
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  baseFee: number;            // paise
  perEventFee: number;        // paise
  isFree: boolean;
  maxEntries: number;
  status: CompetitionStatus;
  rounds: number;
  currentRound: number;
  prize?: string;
  rulesMarkdown?: string;
  bannerUrl?: string;
  createdBy: string;          // admin user id

  // Embedded arrays
  scrambleSets: mongoose.Types.DocumentArray<any>;
  entries: mongoose.Types.DocumentArray<any>;
  solveResults: mongoose.Types.DocumentArray<any>;

  createdAt: Date;
  updatedAt: Date;
}

const CompetitionSchema = new Schema<ICompetition>(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String },
    events: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date },
    baseFee: { type: Number, default: 0 },
    perEventFee: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    maxEntries: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
    },
    rounds: { type: Number, default: 1 },
    currentRound: { type: Number, default: 1 },
    prize: { type: String },
    rulesMarkdown: { type: String },
    bannerUrl: { type: String },
    createdBy: { type: String },

    scrambleSets: [ScrambleSetSchema],
    entries: [EntrySchema],
    solveResults: [SolveResultSchema],
  },
  { timestamps: true }
);

// Auto-generate slug from name
CompetitionSchema.pre('save', function (next) {
  if (this.isNew && !this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now();
  }
  next();
});

// Virtual: entries count
CompetitionSchema.virtual('entryCount').get(function () {
  return this.entries?.length ?? 0;
});

export const Competition =
  mongoose.models.Competition ??
  mongoose.model<ICompetition>('Competition', CompetitionSchema);
