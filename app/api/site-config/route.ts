/**
 * GET /api/site-config — public, whitelisted site configuration (freeze date).
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { SiteConfig } from '@/lib/models/SiteConfig';

export async function GET() {
  try {
    await connectDB();
    const doc = await SiteConfig.findOne({ key: 'freezeDate' }).lean() as any;
    return NextResponse.json({ freezeDate: doc?.value ?? null });
  } catch {
    return NextResponse.json({ freezeDate: null });
  }
}
