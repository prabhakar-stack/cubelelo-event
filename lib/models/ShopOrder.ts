import mongoose, { Document, Schema } from 'mongoose';

/** A points-shop redemption. Digital goods auto-fulfill; physical goods queue. */
export interface IShopOrder extends Document {
  orderId: string;
  userId: string;               // CL ID
  itemId: string;
  kind: string;
  pricePoints: number;
  status: 'completed' | 'pending' | 'shipped' | 'cancelled' | 'refunded';
  fulfillment?: {
    code?: string;
    shippingAddress?: Record<string, any>;
    trackingId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ShopOrderSchema = new Schema<IShopOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    itemId: { type: String, required: true },
    kind: { type: String, required: true },
    pricePoints: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'pending', 'shipped', 'cancelled', 'refunded'], default: 'pending' },
    fulfillment: {
      code: { type: String },
      shippingAddress: { type: Schema.Types.Mixed },
      trackingId: { type: String },
    },
  },
  { timestamps: true, collection: 'shoporders' },
);

export const ShopOrder =
  mongoose.models.ShopOrder ?? mongoose.model<IShopOrder>('ShopOrder', ShopOrderSchema);
