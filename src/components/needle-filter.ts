/**
 * What the needle does between detector frames. `detectPitch` is stateless and the loop
 * runs ~30 frames/s; drawn raw, a voice's ±0.5 morion jitter shivers and every breath
 * blinks the needle. Decided in item 05 (`docs/decisions/tuner.md`):
 *
 * - an exponential average with a short time constant, so a slide still reads as live;
 * - reset on the first frame after a gap, so the needle never glides in from its old place;
 * - on a `null` frame the needle stays where it was, marked stale, and hides after a hold.
 *
 * Positions are folded moria, which wrap at the fold's seam; the average is taken on the
 * shortest way round so a frame on the far side of the seam (or a one-frame octave flip,
 * which folds to the same place) does not drag the needle across the ladder.
 */
import { MORIA_PER_OCTAVE } from '../theory/moria';

/** Time constant of the average, ms: about three frames at 30/s. */
export const SMOOTH_MS = 100;
/** How long a stale needle stays visible after the last detected frame, ms. */
export const HOLD_MS = 400;

export interface NeedleState {
  moria: number;
  /** True while showing the last known position through a gap. */
  stale: boolean;
}

export class NeedleFilter {
  private value: number | null = null;
  private lastSeen = -Infinity;

  /** `fold` brings any moria value into the target's window; the filter stays inside it. */
  constructor(
    private readonly fold: (moria: number) => number,
    private readonly smoothMs = SMOOTH_MS,
    private readonly holdMs = HOLD_MS,
  ) {}

  /** Feed one frame's folded moria (or `null` for no pitch) at time `now` in ms. */
  push(moria: number | null, now: number): NeedleState | null {
    const gap = now - this.lastSeen;
    if (moria === null) {
      if (this.value === null || gap > this.holdMs) {
        this.value = null;
        return null;
      }
      return { moria: this.value, stale: true };
    }
    if (this.value === null || gap > this.holdMs) {
      this.value = moria;
    } else {
      // Shortest way round the octave, then blend.
      let delta = (moria - this.value) % MORIA_PER_OCTAVE;
      if (delta > MORIA_PER_OCTAVE / 2) delta -= MORIA_PER_OCTAVE;
      if (delta < -MORIA_PER_OCTAVE / 2) delta += MORIA_PER_OCTAVE;
      const alpha = 1 - Math.exp(-gap / this.smoothMs);
      this.value = this.fold(this.value + alpha * delta);
    }
    this.lastSeen = now;
    return { moria: this.value, stale: false };
  }

  reset(): void {
    this.value = null;
    this.lastSeen = -Infinity;
  }
}
