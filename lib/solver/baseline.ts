import { SolverEngine } from './types';
import { invertAlg, parseAlg, countMoves } from './moves';

/**
 * Baseline engine — produces a VALID solution (the inverse of the scramble) for
 * any puzzle. It is correct but not optimal; it exists so the full flow (solver
 * page, difficulty calc, problem analysis) works end-to-end.
 *
 * Real engines plug in here per puzzle:
 *   • Engine A (optimal): 2×2 IDA* with pruning table; 3×3 Kociemba/min2phase (WASM).
 *   • Engine B (algorithmic): layer-by-layer / CFOP step generator.
 */
export function makeBaselineEngine(puzzleType: string): SolverEngine {
  return {
    puzzleType,
    async solveOptimal(scramble) {
      const moves = invertAlg(scramble);
      return { moves, count: countMoves(moves), method: 'inverse-scramble (baseline)' };
    },
    async solveAlgorithmic(scramble) {
      const all = parseAlg(invertAlg(scramble));
      const stepSize = 4;
      const steps = [];
      for (let i = 0; i < all.length; i += stepSize) {
        steps.push({ label: `Step ${steps.length + 1}`, moves: all.slice(i, i + stepSize).join(' ') });
      }
      return { steps, totalCount: all.length, method: 'inverse-scramble grouped (baseline)' };
    },
  };
}
