import mongoose, { Document, Schema } from 'mongoose';

/** A purchasable item in the points shop (digital or physical). */
export interface IShopItem extends Document {
  itemId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category: 'digital' | 'physical';
  kind: 'streak_freeze' | 'premium_days' | 'coupon' | 'merch' | 'cube';
  pricePoints: number;
  payload?: Record<string, any>;   // e.g. { days: 7 } | { percent: 10 }
  stock?: number | null;           // null = unlimited
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopItemSchema = new Schema<IShopItem>(
  {
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    category: { type: String, enum: ['digital', 'physical'], required: true },
    kind: { type: String, enum: ['streak_freeze', 'premium_days', 'coupon', 'merch', 'cube'], required: true },
    pricePoints: { type: Number, required: true, min: 0 },
    payload: { type: Schema.Types.Mixed },
    stock: { type: Number, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'shopitems' },
);

export const ShopItem =
  mongoose.models.ShopItem ?? mongoose.model<IShopItem>('ShopItem', ShopItemSchema);
