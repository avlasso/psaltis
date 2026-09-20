/**
 * Interval arithmetic in the 1881 Patriarchal Committee system: the octave is 72 moria
 * and every interval is a whole number of them. Nothing here knows about modes or
 * frequencies beyond a base in Hz; the mode data lives in `modes.ts`.
 */

export const MORIA_PER_OCTAVE = 72;

/** A genus is the pattern of one tetrachord: three intervals summing to 30 moria. */
export type GenusName = 'diatonic' | 'softChromatic' | 'hardChromatic' | 'enharmonic';

export const GENERA: Record<GenusName, readonly [number, number, number]> = {
  diatonic: [12, 10, 8],
  softChromatic: [8, 14, 8],
  hardChromatic: [6, 20, 4],
  enharmonic: [12, 12, 6],
};

/**
 * The seven intervals of an octave built from two identical tetrachords joined by the
 * 12-moria disjunctive tone: t1 t2 t3 | 12 | t1 t2 t3.
 */
export function octaveOf(genus: GenusName): number[] {
  const t = GENERA[genus];
  return [...t, 12, ...t];
}

/** Moria from step 0 to each step, starting with 0 (so length = intervals.length + 1). */
export function cumulativeMoria(intervals: readonly number[]): number[] {
  const out = [0];
  for (const m of intervals) out.push(out[out.length - 1] + m);
  return out;
}

/** Frequency of `step` (0 = base) given the intervals in moria between adjacent steps. */
export function frequencyOf(step: number, baseHz: number, intervals: readonly number[]): number {
  const moria = cumulativeMoria(intervals)[step];
  if (moria === undefined) throw new RangeError(`step ${step} is outside the scale`);
  return baseHz * 2 ** (moria / MORIA_PER_OCTAVE);
}

export function moriaToCents(moria: number): number {
  return (moria * 1200) / MORIA_PER_OCTAVE;
}
