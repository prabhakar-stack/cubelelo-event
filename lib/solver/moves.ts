/** WCA move-string utilities shared by all solver engines. */

export function parseAlg(alg: string): string[] {
  return alg.trim().split(/\s+/).filter(Boolean);
}

export function invertMove(m: string): string {
  if (m.endsWith('2')) return m;          // self-inverse
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

/** Inverse of an algorithm = reverse order + invert each move. */
export function invertAlg(alg: string): string {
  return parseAlg(alg).reverse().map(invertMove).join(' ');
}

export function countMoves(alg: string): number {
  return parseAlg(alg).length;
}
