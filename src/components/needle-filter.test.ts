import { HOLD_MS, NeedleFilter } from './needle-filter';
import { fold } from '../theory/tuning';
import { octaveOf } from '../theory/moria';

const diatonic = octaveOf('diatonic');
const make = () => new NeedleFilter((m) => fold(m, diatonic));

describe('NeedleFilter', () => {
  it('is null until a pitch arrives, then takes the first frame as it is', () => {
    const f = make();
    expect(f.push(null, 0)).toBeNull();
    expect(f.push(12, 33)).toEqual({ moria: 12, stale: false });
  });

  it('averages toward a new value with a ~100 ms time constant', () => {
    const f = make();
    f.push(12, 0);
    const a = f.push(22, 33)!;
    expect(a.moria).toBeGreaterThan(12);
    expect(a.moria).toBeLessThan(22);
    let t = 33;
    for (let i = 0; i < 20; i++) f.push(22, (t += 33));
    expect(f.push(22, t + 33)!.moria).toBeCloseTo(22, 1);
  });

  it('holds the last position as stale through a gap, then hides', () => {
    const f = make();
    f.push(30, 0);
    expect(f.push(null, 100)).toEqual({ moria: 30, stale: true });
    expect(f.push(null, HOLD_MS)).toEqual({ moria: 30, stale: true });
    expect(f.push(null, HOLD_MS + 1)).toBeNull();
  });

  it('resets after a gap instead of gliding in from the old place', () => {
    const f = make();
    f.push(0, 0);
    f.push(null, 200);
    expect(f.push(54, HOLD_MS + 50)).toEqual({ moria: 54, stale: false });
  });

  it('blends the short way round the seam', () => {
    const f = make();
    f.push(67, 0);
    // −3 is 2 moria above 67 across the seam, not 70 below it: the blend moves up a
    // fraction of 2 and stays at the top end of the window (or wraps to the bottom).
    const s = f.push(-3, 33)!;
    const wentUpABit = s.moria > 67 && s.moria < 68;
    const wrapped = s.moria >= -4 && s.moria < -3;
    expect(wentUpABit || wrapped).toBe(true);
  });

  it('ignores a one-frame octave flip that folds to the same place', () => {
    const f = make();
    f.push(22, 0);
    expect(f.push(fold(22 + 72, diatonic), 33)!.moria).toBeCloseTo(22, 9);
  });
});
