import mongoose, { Document, Schema } from 'mongoose';

export interface IPaidParticipant extends Document {
  name: string;
  email: string;
  userId: string;
  orderId: string;
  competitionId: string;
  events: string[];       // e.g. ["222", "333"]
  total: string;          // total in paise as string
  regDateAndTime: string; // "DD/MM/YYYY HH:MM:SS"
  createdAt: Date;
  updatedAt: Date;
}

const PaidParticipantSchema = new Schema<IPaidParticipant>(
  {
    name: { type: String },
    email: { type: String },
    userId: { type: String, index: true },
    orderId: { type: String },
    competitionId: { type: String, index: true },
    events: [{ type: String }],
    total: { type: String },
    regDateAndTime: { type: String },
  },
  { timestamps: true, collection: 'paidparticipants' }
);

PaidParticipantSchema.index({ competitionId: 1, userId: 1 });

export const PaidParticipant = mongoose.models.PaidParticipant ??
  mongoose.model<IPaidParticipant>('PaidParticipant', PaidParticipantSchema);
