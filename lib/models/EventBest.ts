import mongoose, { Document, Schema } from 'mongoose';

export interface IEventBest extends Document {
  competitionId: string;
  userId: string;
  name: string;
  eventId: string;
  bestSingle: string;   // ms as string
  bestAverage: string;  // ms as string
}

const EventBestSchema = new Schema<IEventBest>(
  {
    competitionId: { type: String },
    userId: { type: String, index: true },
    name: { type: String },
    eventId: { type: String },
    bestSingle: { type: String },
    bestAverage: { type: String },
  },
  { collection: 'eventbests' }
);

EventBestSchema.index({ userId: 1, eventId: 1 });
EventBestSchema.index({ eventId: 1, bestSingle: 1 });

export const EventBest = mongoose.models.EventBest ??
  mongoose.model<IEventBest>('EventBest', EventBestSchema);
