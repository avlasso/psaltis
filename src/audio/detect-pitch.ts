/**
 * The app's one pitch detector. Item 05 (tune) and everything after call `detectPitch`
 * and never a candidate directly, so the choice lives here and nowhere else.
 *
 * McLeod via pitchy, frame 2048, gate −60 dBFS, clarity ≥ 0.9: decided on 2026-09-20 by
 * singing into the phone on `/lab/tuner` and by the synthetic bench in
 * `detectors/bench.test.ts`; the reasons and the numbers are in
 * `docs/decisions/pitch-detector.md`. Change them there first.
 */
import { type Detector, McLeod } from './detectors';

/** Frame length in samples; the lab page lets the operator try the alternatives. */
export const FRAME_SIZE = 2048;
/**
 * Frames quieter than this (RMS, dBFS) are silence: no detector is consulted. With the
 * phone's automatic gain off, quiet singing at arm's length sits around −55; −50 cut it.
 */
export const SILENCE_DB = -60;
/** Estimates less clear than this are discarded. */
export const CLARITY_THRESHOLD = 0.9;

export interface Pitch {
  hz: number;
  /** 0–1; 1 is a pure periodic signal. Always ≥ the threshold in a returned pitch. */
  clarity: number;
}

export interface DetectOptions {
  detector?: Detector;
  silenceDb?: number;
  clarityThreshold?: number;
}

/** Root mean square of a frame, in dBFS (0 for a full-scale square wave, −∞ for silence). */
export function rmsDb(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  const rms = Math.sqrt(sum / frame.length);
  return rms === 0 ? -Infinity : 20 * Math.log10(rms);
}

const chosen: Detector = new McLeod();

/**
 * One frame in, one pitch or `null` out. No smoothing and no memory between frames: a
 * `null` means this frame had no pitch worth showing, and the caller decides what to draw.
 */
export function detectPitch(frame: Float32Array, sampleRate: number, options: DetectOptions = {}): Pitch | null {
  const { detector = chosen, silenceDb = SILENCE_DB, clarityThreshold = CLARITY_THRESHOLD } = options;
  if (rmsDb(frame) < silenceDb) return null;
  const { hz, clarity } = detector.detect(frame, sampleRate);
  if (hz <= 0 || clarity < clarityThreshold) return null;
  return { hz, clarity };
}
