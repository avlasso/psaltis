import { baseNote, BASE_MAX_MIDI, BASE_MIN_MIDI, clampBase, DEFAULT_BASE_MIDI } from './pitch';
import { DEFAULT_NI_HZ } from './modes';

describe('base note', () => {
  it('defaults to C4 and agrees with DEFAULT_NI_HZ', () => {
    const c4 = baseNote(DEFAULT_BASE_MIDI);
    expect(c4.hint).toBe('C4');
    expect(c4.hz).toBeCloseTo(DEFAULT_NI_HZ, 2);
  });

  it('labels the ends of the range', () => {
    expect(baseNote(BASE_MIN_MIDI).hint).toBe('G3');
    expect(baseNote(BASE_MAX_MIDI).hint).toBe('G4');
    expect(baseNote(69).hz).toBe(440);
  });

  it('clamps', () => {
    expect(clampBase(0)).toBe(BASE_MIN_MIDI);
    expect(clampBase(99)).toBe(BASE_MAX_MIDI);
    expect(clampBase(62)).toBe(62);
  });
});
