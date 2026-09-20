import { type Detector, type Estimate, MAX_HZ, MIN_HZ, parabolicPeak } from './types';

/** The absolute threshold from the paper (step 4); 0.1–0.2 is the usual range. */
const THRESHOLD = 0.15;

/**
 * YIN (de Cheveigné & Kawahara 2002), steps 1–5: difference function, cumulative mean
 * normalisation, absolute threshold, parabolic interpolation. Step 6 (best local estimate)
 * is skipped, as most real-time implementations do. Clarity is `1 − d′(τ)`, the
 * complement of the normalised difference at the chosen lag: 1 for a pure period, near 0
 * for noise, so it reads on the same axis as McLeod's.
 */
export class Yin implements Detector {
  readonly name = 'YIN';
  private buffers = new Map<number, Float32Array>();

  detect(frame: Float32Array, sampleRate: number): Estimate {
    const minLag = Math.floor(sampleRate / MAX_HZ);
    const maxLag = Math.min(Math.ceil(sampleRate / MIN_HZ), frame.length >> 1);
    if (maxLag <= minLag) return { hz: 0, clarity: 0 };

    let d = this.buffers.get(maxLag + 1);
    if (!d) {
      d = new Float32Array(maxLag + 1);
      this.buffers.set(maxLag + 1, d);
    }
    const half = frame.length >> 1;

    // Steps 1–2: difference function over half the frame.
    d[0] = 1;
    for (let tau = 1; tau <= maxLag; tau++) {
      let sum = 0;
      for (let i = 0; i < half; i++) {
        const delta = frame[i] - frame[i + tau];
        sum += delta * delta;
      }
      d[tau] = sum;
    }

    // Step 3: cumulative mean normalised difference, in place.
    let running = 0;
    for (let tau = 1; tau <= maxLag; tau++) {
      running += d[tau];
      d[tau] = running === 0 ? 1 : (d[tau] * tau) / running;
    }

    // Step 4: first dip under the threshold, walked to its local minimum.
    let tau = minLag;
    while (tau <= maxLag && d[tau] >= THRESHOLD) tau++;
    if (tau > maxLag) {
      // Nothing under the threshold: fall back to the global minimum so we still
      // return a guess, and let the low clarity speak for it.
      let best = minLag;
      for (let t = minLag + 1; t <= maxLag; t++) if (d[t] < d[best]) best = t;
      tau = best;
    } else {
      while (tau + 1 <= maxLag && d[tau + 1] < d[tau]) tau++;
    }

    // Step 5: refine the lag.
    const lag = parabolicPeak(d, tau);
    const clarity = Math.max(0, Math.min(1, 1 - d[tau]));
    return { hz: sampleRate / lag, clarity };
  }
}
