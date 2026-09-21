/**
 * Where a sung pitch sits on a target: the arithmetic behind the tuner's needle and
 * readout, with no audio in it. Item 05 decided the shape (`docs/decisions/tuner.md`):
 *
 * - A pitch is measured in moria above the base, then **folded** into one octave so a
 *   voice singing an octave below the ladder still lands on the right rung. The fold's
 *   seam sits midway between the last step and the octave (Ζω and Νη′ on the diatonic
 *   ladder: [−4, 68)), not at the base, so a slightly flat Νη sits just below its rung
 *   rather than at the top of the ladder as a flat Νη′. Νη′ is therefore never a landing
 *   target: it reads as Νη.
 * - The nearest step and the signed offset (positive = sharp) are read from the folded
 *   value. Whole moria are for the readout; the needle keeps the fraction.
 */
import { cumulativeMoria, MORIA_PER_OCTAVE } from './moria';

/**
 * Reserved for a hymn's note sequence once `.byz` scores exist (destination: Boundaries).
 * Nothing constructs or reads one yet; the tuner's target type carries the slot so that
 * item 09 and the Library can be written against it without a later signature change.
 */
export interface NoteSequence {
  readonly reserved: never;
}

export type TunerTarget =
  | { kind: 'scale'; intervals: readonly number[] }
  | { kind: 'sequence'; notes: NoteSequence };

/** What the tuner emits for a detected pitch. */
export interface Reading {
  hz: number;
  clarity: number;
  /** Folded moria above the base; the needle's continuous position. */
  moria: number;
  /** Nearest step, 0 = base. Never the octave step (see the fold). */
  step: number;
  /** Signed distance from that step in moria: positive is sharp. Not rounded. */
  offsetMoria: number;
}

export function moriaAbove(hz: number, baseHz: number): number {
  return MORIA_PER_OCTAVE * Math.log2(hz / baseHz);
}

/** Lower edge of the fold window: half the last interval below the base. */
export function foldLow(intervals: readonly number[]): number {
  return -intervals[intervals.length - 1] / 2;
}

/** Bring any moria value into the window [foldLow, foldLow + 72). */
export function fold(moria: number, intervals: readonly number[]): number {
  const low = foldLow(intervals);
  return moria - MORIA_PER_OCTAVE * Math.floor((moria - low) / MORIA_PER_OCTAVE);
}

/** Nearest step to an already-folded value, and the signed offset from it. */
export function nearestStep(foldedMoria: number, intervals: readonly number[]): { step: number; offsetMoria: number } {
  const steps = cumulativeMoria(intervals).slice(0, -1);
  let step = 0;
  for (let i = 1; i < steps.length; i++) {
    if (Math.abs(foldedMoria - steps[i]) < Math.abs(foldedMoria - steps[step])) step = i;
  }
  return { step, offsetMoria: foldedMoria - steps[step] };
}

export function intervalsOf(target: TunerTarget): readonly number[] {
  if (target.kind === 'sequence') throw new Error('NoteSequence targets are reserved; not implemented');
  return target.intervals;
}

/** Everything the tuner says about one detected pitch against a target. */
export function locate(pitch: { hz: number; clarity: number }, target: TunerTarget, baseHz: number): Reading {
  const intervals = intervalsOf(target);
  const moria = fold(moriaAbove(pitch.hz, baseHz), intervals);
  return { hz: pitch.hz, clarity: pitch.clarity, moria, ...nearestStep(moria, intervals) };
}

/** The same, from a folded position the needle filter has already smoothed. */
export function locateMoria(moria: number, target: TunerTarget, hz: number, clarity: number): Reading {
  return { hz, clarity, moria, ...nearestStep(moria, intervalsOf(target)) };
}
