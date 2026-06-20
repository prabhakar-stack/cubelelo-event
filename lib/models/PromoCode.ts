import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromoCode extends Document {
  code: string;            // e.g. "CUBELELO20"
  type: 'percent' | 'fixed'; // % discount or fixed INR off
  value: number;           // 20 for 20% or 50 for ₹50
  maxUses: number;         // 0 = unlimited
  usedCount: number;
  minAmount?: number;      // minimum order amount to apply
  competitionId?: string;  // if set, only valid for this competition
  expiresAt?: Date;
  active: boolean;
  usedBy: string[];        // userIds who have used it
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    type:          { type: String, enum: ['percent', 'fixed'], required: true },
    value:         { type: Number, required: true, min: 1 },
    maxUses:       { type: Number, default: 0 },
    usedCount:     { type: Number, default: 0 },
    minAmount:     { type: Number, default: 0 },
    competitionId: { type: String },
    expiresAt:     { type: Date },
    active:        { type: Boolean, default: true },
    usedBy:        [{ type: String }],
  },
  { timestamps: true, collection: 'promocodes' }
);

PromoCodeSchema.index({ code: 1 });

export const PromoCode: Model<IPromoCode> =
  mongoose.models.PromoCode ?? mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);
