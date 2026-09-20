import { PitchDetector } from 'pitchy';
import { type Detector, type Estimate, MAX_HZ } from './types';

/**
 * McLeod pitch method (NSDF peak picking) as implemented by pitchy. Its clarity is the
 * height of the chosen NSDF peak, already 0–1. pitchy's own volume gate is disabled so
 * that the shared RMS gate in `detectPitch` is the only one.
 */
export class McLeod implements Detector {
  readonly name = 'McLeod (pitchy)';
  private detectors = new Map<number, PitchDetector<Float32Array>>();

  detect(frame: Float32Array, sampleRate: number): Estimate {
    let d = this.detectors.get(frame.length);
    if (!d) {
      d = PitchDetector.forFloat32Array(frame.length);
      d.minVolumeAbsolute = 0;
      this.detectors.set(frame.length, d);
    }
    const [hz, clarity] = d.findPitch(frame, sampleRate);
    if (!Number.isFinite(hz) || hz <= 0 || hz > MAX_HZ) return { hz: 0, clarity: 0 };
    return { hz, clarity };
  }
}
