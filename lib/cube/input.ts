/**
 * Keyboard input mapping for the interactive cube engine.
 *
 * A KeyMap maps a `KeyboardEvent.key` to a WCA move (or whole-cube rotation).
 * The default uses the face letters directly — typing `r` turns R, `R` (shift)
 * turns R'. Arrow keys are reserved for camera/whole-cube rotation.
 *
 * Structured so custom / left- vs right-hand keymaps can be swapped wholesale
 * later (see HANDED_PRESETS) without changing the engine.
 */
export type KeyMap = Record<string, string>;

export const DEFAULT_KEYMAP: KeyMap = {
  r: 'R', R: "R'",
  l: 'L', L: "L'",
  u: 'U', U: "U'",
  d: 'D', D: "D'",
  f: 'F', F: "F'",
  b: 'B', B: "B'",
  // Arrow keys → camera / whole-cube rotation (never counted as solving moves).
  ArrowRight: 'y', ArrowLeft: "y'",
  ArrowUp: 'x', ArrowDown: "x'",
};

/** Whole-cube rotations — visual only, excluded from the solve move-count. */
export const ROTATION_MOVES = new Set(['x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2']);

export function isRotation(move: string): boolean {
  return ROTATION_MOVES.has(move);
}

/** Placeholder presets — wired into the engine now, exposed in settings later. */
export const HANDED_PRESETS: Record<string, KeyMap> = {
  default: DEFAULT_KEYMAP,
};
