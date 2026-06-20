import mongoose, { Document, Schema } from 'mongoose';

export interface IPartialAdmin extends Document {
  userId: string;
  competitionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PartialAdminSchema = new Schema<IPartialAdmin>(
  {
    userId: { type: String, unique: true },
    competitionIds: [{ type: String }],
  },
  { timestamps: true, collection: 'partialadmins' }
);

export const PartialAdmin = mongoose.models.PartialAdmin ??
  mongoose.model<IPartialAdmin>('PartialAdmin', PartialAdminSchema);
