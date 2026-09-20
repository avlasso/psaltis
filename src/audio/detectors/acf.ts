import { type Detector, type Estimate, MAX_HZ, MIN_HZ, parabolicPeak } from './types';

/**
 * Plain time-domain autocorrelation, the "ACF2+" variant that circulates from Chris
 * Wilson's Web Audio pitch detector: trim the frame to where it is above a small
 * amplitude, correlate, take the first peak after the first zero crossing. The baseline
 * the other two must beat. Clarity is the peak's height relative to lag zero, each
 * scaled by its overlap so that a pure period reads 1 at any lag.
 */
export class Autocorrelation implements Detector {
  readonly name = 'Autocorrelation';
  private buffers = new Map<number, Float32Array>();

  detect(frame: Float32Array, sampleRate: number): Estimate {
    const minLag = Math.floor(sampleRate / MAX_HZ);
    const maxLag = Math.min(Math.ceil(sampleRate / MIN_HZ), frame.length >> 1);
    if (maxLag <= minLag) return { hz: 0, clarity: 0 };

    let r = this.buffers.get(maxLag + 1);
    if (!r) {
      r = new Float32Array(maxLag + 1);
      this.buffers.set(maxLag + 1, r);
    }

    const n = frame.length;
    for (let lag = 0; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) sum += frame[i] * frame[i + lag];
      r[lag] = sum;
    }
    if (r[0] <= 0) return { hz: 0, clarity: 0 };

    // Skip the main lobe: walk down until the correlation starts rising again.
    let lag = 1;
    while (lag < maxLag && r[lag] > r[lag + 1]) lag++;
    // Then the highest peak in the allowed range.
    let best = Math.max(lag, minLag);
    for (let t = best + 1; t <= maxLag; t++) if (r[t] > r[best]) best = t;

    const refined = parabolicPeak(r, best);
    const clarity = Math.max(0, Math.min(1, (r[best] / (n - best)) / (r[0] / n)));
    return { hz: sampleRate / refined, clarity };
  }
}
