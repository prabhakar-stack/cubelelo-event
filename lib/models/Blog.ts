import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  id: string;
  image: string;
  title: string;
  body: string;
  link: string;
  display: boolean;
  author: string;
  date: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    id: { type: String },
    image: { type: String },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    display: { type: Boolean, default: true },
    author: { type: String },
    date: { type: String },
    position: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'blogs' }
);

BlogSchema.index({ display: 1, position: 1 });

export const Blog = mongoose.models.Blog ?? mongoose.model<IBlog>('Blog', BlogSchema);
