/**
 * GET /api/problems — the general problem set (archived + practice).
 * The active Daily problem is intentionally excluded here until it archives.
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Problem } from '@/lib/models/Problem';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const puzzleType = searchParams.get('puzzleType');
  const difficulty = searchParams.get('difficulty');

  const query: Record<string, any> = { active: true, mode: { $in: ['archived', 'practice'] } };
  if (puzzleType) query.puzzleType = puzzleType;
  if (difficulty) query.difficulty = difficulty;

  const problems = await Problem.find(query)
    .select('-solutions')            // solutions only revealed on the detail route
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ problems });
}
