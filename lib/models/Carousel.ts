import mongoose, { Document, Schema } from 'mongoose';

export interface ICarousel extends Document {
  id: string;
  image: string;
  link: string;
  colour: string;
  position: string;   // "left" | "right" | "center"
  text: string;       // JSON string
  key: number;
  display: boolean;
  mobileCarousel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CarouselSchema = new Schema<ICarousel>(
  {
    id: { type: String },
    image: { type: String },
    link: { type: String },
    colour: { type: String, default: 'white' },
    position: { type: String, default: 'left' },
    text: { type: String, default: '{}' },
    key: { type: Number, default: 0 },
    display: { type: Boolean, default: true },
    mobileCarousel: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'carousels' }
);

CarouselSchema.index({ display: 1, key: 1 });

export const Carousel = mongoose.models.Carousel ?? mongoose.model<ICarousel>('Carousel', CarouselSchema);
