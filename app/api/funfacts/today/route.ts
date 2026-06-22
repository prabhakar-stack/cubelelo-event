/**
 * GET /api/funfacts/today — deterministic daily rotation through the fun-fact set.
 * Returns { fact: null } until the dataset is loaded.
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { FunFact } from '@/lib/models/FunFact';

export async function GET() {
  try {
    await connectDB();
    const count = await FunFact.countDocuments({ active: true });
    if (count === 0) return NextResponse.json({ fact: null });

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const idx = dayOfYear % count;

    const doc = await FunFact.findOne({ active: true }).skip(idx).lean() as any;
    return NextResponse.json({ fact: doc?.text ?? null });
  } catch {
    return NextResponse.json({ fact: null });
  }
}
