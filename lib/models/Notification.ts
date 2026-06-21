import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: string;       // CL ID — the canonical cross-collection key
  type: string;         // 'round' | 'result' | 'advancement' | 'info'
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, default: 'info' },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'notifications' },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ?? mongoose.model<INotification>('Notification', NotificationSchema);
