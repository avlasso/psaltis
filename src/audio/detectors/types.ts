/**
 * A pitch detector reads one time-domain frame and returns its best guess, always — the
 * gate that turns a poor guess into "no pitch" is `detectPitch`'s job, so that every
 * candidate is judged on the same terms. `clarity` is normalised to 0–1, 1 being a pure
 * periodic signal, whatever the algorithm's native confidence measure.
 */
export interface Estimate {
  hz: number;
  clarity: number;
}

export interface Detector {
  /** Short name for the lab page and the decision doc. */
  readonly name: string;
  detect(frame: Float32Array, sampleRate: number): Estimate;
}

/** The lowest pitch any detector looks for; nobody chants below this. */
export const MIN_HZ = 60;
/** The highest; a soprano's top is around 1100 Hz. */
export const MAX_HZ = 1500;

/**
 * Refine an integer lag to a fractional one by fitting a parabola through the sample
 * and its neighbours. Shared by YIN and ACF; McLeod does its own inside pitchy.
 */
export function parabolicPeak(values: ArrayLike<number>, index: number): number {
  if (index <= 0 || index >= values.length - 1) return index;
  const a = values[index - 1];
  const b = values[index];
  const c = values[index + 1];
  const denominator = a - 2 * b + c;
  if (denominator === 0) return index;
  return index + (0.5 * (a - c)) / denominator;
}
