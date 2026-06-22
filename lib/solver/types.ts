/**
 * Dual-engine solver contracts. Engine A = optimal (fewest moves);
 * Engine B = algorithmic (human-readable, step-by-step). The interface is
 * puzzle-agnostic so NxNxN engines can be registered without touching callers.
 */
export interface OptimalResult {
  moves: string;     // WCA notation
  count: number;     // HTM move count — also drives difficulty
  method: string;    // which algorithm produced it
}

export interface AlgorithmicStep {
  label: string;
  moves: string;
}

export interface AlgorithmicResult {
  steps: AlgorithmicStep[];
  totalCount: number;
  method: string;
}

export interface SolverEngine {
  puzzleType: string;                                   // '222' | '333' | …
  solveOptimal(scramble: string): Promise<OptimalResult>;        // Engine A
  solveAlgorithmic(scramble: string): Promise<AlgorithmicResult>; // Engine B
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
