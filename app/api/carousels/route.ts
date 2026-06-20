import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Carousel } from '@/lib/models/Carousel';

export async function GET() {
  try {
    await connectDB();
    const carousels = await Carousel.find({ display: true })
      .sort({ position: 1 })
      .lean();
    return NextResponse.json({ carousels });
  } catch (err) {
    console.error('[GET carousels]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
