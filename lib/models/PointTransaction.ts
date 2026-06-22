import mongoose, { Document, Schema } from 'mongoose';

/**
 * Immutable points ledger — the source of truth for a user's balance
 * (User.pointsBalance is the denormalized cache, always reconcilable from here).
 */
export interface IPointTransaction extends Document {
  userId: string;               // CL ID
  amount: number;               // signed: +earn / −spend
  reason:
    | 'daily_streak' | 'daily_solve' | 'optimal_bonus' | 'competition'
    | 'profile_complete' | 'hint_penalty' | 'purchase' | 'refund' | 'admin_adjust';
  refType?: string;
  refId?: string;
  balanceAfter: number;
  note?: string;
  createdAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true, index: true },
    refType: { type: String },
    refId: { type: String },
    balanceAfter: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'pointtransactions' },
);

PointTransactionSchema.index({ userId: 1, createdAt: -1 });

export const PointTransaction =
  mongoose.models.PointTransaction ?? mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);
