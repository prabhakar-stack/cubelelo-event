import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;      // Razorpay order ID
  compId: string;       // competition ID
  eventIds: string[];   // e.g. ["222", "333"]
  userId: string;
  amount: string;       // in paise as string
  receipt: string;
  status: 'created' | 'processing' | 'paid' | 'failed';
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  invoiceNumber?: string;
  invoicedAt?: Date;
  refundStatus?: 'none' | 'requested' | 'processed';
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    compId: { type: String, required: true, index: true },
    eventIds: [{ type: String }],
    userId: { type: String, required: true, index: true },
    amount: { type: String },
    receipt: { type: String },
    status: { type: String, enum: ['created', 'processing', 'paid', 'failed'], default: 'created' },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    invoiceNumber: { type: String },
    invoicedAt: { type: Date },
    refundStatus: { type: String, enum: ['none', 'requested', 'processed'], default: 'none' },
    refundReason: { type: String },
  },
  { timestamps: true, collection: 'orders' }
);

export const Order = mongoose.models.Order ?? mongoose.model<IOrder>('Order', OrderSchema);
