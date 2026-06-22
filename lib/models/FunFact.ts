import mongoose, { Document, Schema } from 'mongoose';

/** A cubing fun-fact for the "Daily Cube Fun-Fact" component. */
export interface IFunFact extends Document {
  text: string;
  category?: string;
  active: boolean;
  createdAt: Date;
}

const FunFactSchema = new Schema<IFunFact>(
  {
    text: { type: String, required: true },
    category: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'funfacts' },
);

export const FunFact =
  mongoose.models.FunFact ?? mongoose.model<IFunFact>('FunFact', FunFactSchema);
