/**
 * GET /api/problems/[id] — one problem.
 * Solutions are withheld while it is the ACTIVE daily (Solution tab locked);
 * they're returned once archived. Lock is enforced here, not just in the UI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Problem } from '@/lib/models/Problem';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const problem = await Problem.findOne({ problemId: id }).lean() as any;
  if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });

  const solutionUnlocked = problem.mode !== 'daily' || !!problem.archivedAt;
  if (!solutionUnlocked) problem.solutions = undefined;

  return NextResponse.json({ problem, solutionUnlocked });
}
