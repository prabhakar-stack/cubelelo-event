import { SolverEngine, Difficulty } from './types';
import { makeBaselineEngine } from './baseline';

/**
 * Engine registry — keyed by puzzle type so NxNxN support is additive.
 * UI/testing is scoped to 2×2 and 3×3 for now; register more engines here.
 */
const engines: Record<string, SolverEngine> = {
  '222': makeBaselineEngine('222'),
  '333': makeBaselineEngine('333'),
};

export function getEngine(puzzleType: string): SolverEngine | null {
  return engines[puzzleType] ?? null;
}

export function registerEngine(engine: SolverEngine): void {
  engines[engine.puzzleType] = engine;
}

export function supportedPuzzles(): string[] {
  return Object.keys(engines);
}

/** Difficulty is determined strictly by the optimal move count (per puzzle). */
export function classifyDifficulty(puzzleType: string, optimalMoveCount: number): Difficulty {
  const t = puzzleType === '222' ? [4, 7, 10] : [16, 19, 22];
  if (optimalMoveCount <= t[0]) return 'easy';
  if (optimalMoveCount <= t[1]) return 'medium';
  if (optimalMoveCount <= t[2]) return 'hard';
  return 'expert';
}

/** Analyze a scramble: optimal solution + move count + derived difficulty. */
export async function analyzeScramble(scramble: string, puzzleType: string) {
  const engine = getEngine(puzzleType);
  if (!engine) throw new Error(`No solver engine registered for puzzle "${puzzleType}"`);
  const optimal = await engine.solveOptimal(scramble);
  return {
    optimal,
    optimalMoveCount: optimal.count,
    difficulty: classifyDifficulty(puzzleType, optimal.count),
  };
}

export * from './types';
