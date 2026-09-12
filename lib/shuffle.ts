/**
 * Deterministic answer-order shuffling.
 *
 * The same `seed` always produces the same permutation, so both players in a
 * 1v1 see answers in the identical order (fair "first correct wins"), while
 * different questions get different orders — fixing patterns like "the answer
 * is always B".
 */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a permutation of [0..n-1] where result[displayPos] = originalIndex.
 * Stable for a given seed.
 */
export function orderedIndices(n: number, seed: string): number[] {
  const rnd = mulberry32(hashStr(seed));
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
