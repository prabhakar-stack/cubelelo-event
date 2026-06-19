/**
 * Named practice session — groups solves together.
 * e.g. "Tuesday 3x3 practice"
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICubeSession extends Document {
  userId: string;
  name: string;
  puzzleType: string;
  solveCount: number;
  bestSingle?: number;    // ms
  bestAo5?: number;       // ms
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
}

const CubeSessionSchema = new Schema<ICubeSession>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    puzzleType: { type: String, required: true },
    solveCount: { type: Number, default: 0 },
    bestSingle: { type: Number },
    bestAo5: { type: Number },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const CubeSession =
  mongoose.models.CubeSession ??
  mongoose.model<ICubeSession>('CubeSession', CubeSessionSchema);
