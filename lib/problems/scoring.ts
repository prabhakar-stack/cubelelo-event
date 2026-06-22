/**
 * Hint penalty + scoring math for Active Daily Problems.
 *
 * Rule: Hint 1 is free. Each hint after that adds a flat 5%, capped at 50%.
 * Hints are disabled once the cap is hit OR no hints remain.
 *
 * (CAP/STEP are config so the 45%-at-10-hints vs 50%-at-11-hints choice is a
 * one-line change.)
 */
export const HINT_STEP = 5;       // % per hint after the first
export const HINT_PENALTY_CAP = 50;

export function hintPenaltyPercent(hintsUsed: number): number {
  return Math.min(HINT_PENALTY_CAP, HINT_STEP * Math.max(0, hintsUsed - 1));
}

export function hintsLocked(hintsUsed: number, totalHints: number): boolean {
  return hintPenaltyPercent(hintsUsed) >= HINT_PENALTY_CAP || hintsUsed >= totalHints;
}

/** Final awarded score after the hint penalty (only when solved within limit). */
export function finalScore(basePoints: number, penaltyPercent: number): number {
  return Math.round(basePoints * (1 - penaltyPercent / 100));
}
