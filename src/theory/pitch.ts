/**
 * The movable base note. The base steps in 12-TET semitones at A = 440 so that every
 * position has an exact Western letter for the ladder's faint hint; the moria between
 * steps are untouched because the scale only ever sees `hz`.
 */

const LETTERS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

export interface BaseNote {
  /** MIDI number; C4 = 60. */
  midi: number;
  hz: number;
  /** Western letter with octave, e.g. "C4" — the hint, shown faintly and nowhere else. */
  hint: string;
}

export function baseNote(midi: number): BaseNote {
  const hz = 440 * 2 ** ((midi - 69) / 12);
  return { midi, hz, hint: `${LETTERS[midi % 12]}${Math.floor(midi / 12) - 1}` };
}

/** G3 … G4: an octave of choices around the default C4. */
export const BASE_MIN_MIDI = 55;
export const BASE_MAX_MIDI = 67;
export const DEFAULT_BASE_MIDI = 60;

export function clampBase(midi: number): number {
  return Math.min(BASE_MAX_MIDI, Math.max(BASE_MIN_MIDI, midi));
}
