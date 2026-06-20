import mongoose, { Document, Schema } from 'mongoose';

export interface IPastResult extends Document {
  competitionId: string;
  eventId: string;
  name: string;
  rank: string;
}

const PastResultSchema = new Schema<IPastResult>(
  {
    competitionId: { type: String, index: true },
    eventId: { type: String },
    name: { type: String },
    rank: { type: String },
  },
  { collection: 'pastresults' }
);

export const PastResult = mongoose.models.PastResult ??
  mongoose.model<IPastResult>('PastResult', PastResultSchema);
