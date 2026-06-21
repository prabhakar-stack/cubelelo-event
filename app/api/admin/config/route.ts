/**
 * GET  /api/admin/config?key=rankTiers
 * PUT  /api/admin/config  { key, value }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/roles';
import { connectDB } from '@/lib/mongoose';
import { SiteConfig, DEFAULT_RANK_TIERS } from '@/lib/models/SiteConfig';

export async function GET(req: NextRequest) {
  const auth = await requireRole(['moderator']);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const key = new URL(req.url).searchParams.get('key') ?? 'rankTiers';
  const doc = await SiteConfig.findOne({ key }).lean() as any;

  if (key === 'rankTiers') {
    return NextResponse.json({ key, value: doc?.value ?? DEFAULT_RANK_TIERS });
  }
  return NextResponse.json({ key, value: doc?.value ?? null });
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(['moderator']);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  await SiteConfig.findOneAndUpdate({ key }, { key, value }, { upsert: true });
  return NextResponse.json({ ok: true, key, value });
}
