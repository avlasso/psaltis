import { fold, foldLow, locate, moriaAbove, nearestStep, type TunerTarget } from './tuning';
import { octaveOf } from './moria';

const NI = 261.63;
const diatonic = octaveOf('diatonic');
const target: TunerTarget = { kind: 'scale', intervals: diatonic };

/** Hz of `moria` above Νη. */
const at = (moria: number) => NI * 2 ** (moria / 72);

describe('fold', () => {
  it('folds into [−4, 68) on the diatonic ladder', () => {
    expect(foldLow(diatonic)).toBe(-4);
    expect(fold(0, diatonic)).toBe(0);
    expect(fold(-2, diatonic)).toBe(-2);
    expect(fold(-4, diatonic)).toBe(-4);
    expect(fold(-4.5, diatonic)).toBeCloseTo(67.5, 9);
    expect(fold(68, diatonic)).toBe(-4);
    expect(fold(70, diatonic)).toBe(-2);
    expect(fold(72, diatonic)).toBe(0);
    expect(fold(-72 + 30, diatonic)).toBe(30);
    expect(fold(144 + 12, diatonic)).toBe(12);
  });

  it('puts the seam half the last interval below the octave for any genus', () => {
    expect(foldLow(octaveOf('hardChromatic'))).toBe(-2);
    expect(foldLow(octaveOf('enharmonic'))).toBe(-3);
  });
});

describe('nearestStep', () => {
  it('never returns the octave step', () => {
    expect(nearestStep(67.9, diatonic).step).toBe(6);
    expect(nearestStep(67.9, diatonic).offsetMoria).toBeCloseTo(3.9, 9);
    expect(nearestStep(-3.9, diatonic).step).toBe(0);
    expect(nearestStep(-3.9, diatonic).offsetMoria).toBeCloseTo(-3.9, 9);
  });

  it('splits the gap between two rungs at its midpoint', () => {
    expect(nearestStep(25.9, diatonic).step).toBe(2);
    expect(nearestStep(26.1, diatonic).step).toBe(3);
  });
});

describe('locate', () => {
  it('reads Νη at the base as step 0, offset 0', () => {
    const r = locate({ hz: NI, clarity: 1 }, target, NI);
    expect(r.step).toBe(0);
    expect(r.offsetMoria).toBeCloseTo(0, 9);
    expect(r.hz).toBe(NI);
    expect(r.clarity).toBe(1);
  });

  it('reads each rung at its own moria', () => {
    [0, 12, 22, 30, 42, 54, 64].forEach((m, step) => {
      const r = locate({ hz: at(m), clarity: 1 }, target, NI);
      expect(r.step).toBe(step);
      expect(r.offsetMoria).toBeCloseTo(0, 6);
    });
  });

  it('gives a signed offset in moria, sharp positive', () => {
    expect(locate({ hz: at(12 + 2), clarity: 1 }, target, NI).offsetMoria).toBeCloseTo(2, 6);
    const flat = locate({ hz: at(30 - 1.5), clarity: 1 }, target, NI);
    expect(flat.offsetMoria).toBeCloseTo(-1.5, 6);
    expect(flat.step).toBe(3);
  });

  it('folds a voice an octave below (and two above) onto the same rung', () => {
    const below = locate({ hz: at(22 - 72), clarity: 1 }, target, NI);
    expect(below.step).toBe(2);
    expect(below.offsetMoria).toBeCloseTo(0, 6);
    const above = locate({ hz: at(54 + 144 + 1), clarity: 1 }, target, NI);
    expect(above.step).toBe(5);
    expect(above.offsetMoria).toBeCloseTo(1, 6);
  });

  it('reads a flat Νη as Νη below its rung, not as a flat Νη′ at the top', () => {
    const r = locate({ hz: at(-2), clarity: 1 }, target, NI);
    expect(r.step).toBe(0);
    expect(r.offsetMoria).toBeCloseTo(-2, 6);
    expect(r.moria).toBeCloseTo(-2, 6);
  });

  it('reads Νη′ as Νη, and a sharp Ζω as Ζω until the seam', () => {
    expect(locate({ hz: at(72), clarity: 1 }, target, NI).step).toBe(0);
    const zo = locate({ hz: at(64 + 3), clarity: 1 }, target, NI);
    expect(zo.step).toBe(6);
    expect(zo.offsetMoria).toBeCloseTo(3, 6);
    const past = locate({ hz: at(64 + 5), clarity: 1 }, target, NI);
    expect(past.step).toBe(0);
    expect(past.offsetMoria).toBeCloseTo(-3, 6);
  });

  it('follows the base: the same Hz reads differently when Νη moves', () => {
    const hz = at(12);
    expect(locate({ hz, clarity: 1 }, target, NI).step).toBe(1);
    expect(locate({ hz, clarity: 1 }, target, at(12)).step).toBe(0);
  });

  it('refuses a NoteSequence target: reserved, not implemented', () => {
    const seq = { kind: 'sequence', notes: {} } as unknown as TunerTarget;
    expect(() => locate({ hz: NI, clarity: 1 }, seq, NI)).toThrow(/reserved/);
  });
});

describe('moriaAbove', () => {
  it('is 72 per octave and 12 for a Committee tone', () => {
    expect(moriaAbove(NI * 2, NI)).toBeCloseTo(72, 9);
    expect(moriaAbove(at(12), NI)).toBeCloseTo(12, 9);
  });
});
