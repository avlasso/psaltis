import { cumulativeMoria, frequencyOf, GENERA, moriaToCents, octaveOf, type GenusName } from './moria';

describe('Committee genera', () => {
  it.each(Object.keys(GENERA) as GenusName[])('%s closes the octave at 72', (genus) => {
    expect(octaveOf(genus).reduce((a, b) => a + b, 0)).toBe(72);
  });

  it('spells the diatonic octave 12-10-8-12-12-10-8', () => {
    expect(octaveOf('diatonic')).toEqual([12, 10, 8, 12, 12, 10, 8]);
  });
});

describe('frequencyOf', () => {
  const diatonic = octaveOf('diatonic');

  it('gives cumulative ratios of 2^(moria/72)', () => {
    const cum = cumulativeMoria(diatonic);
    expect(cum).toEqual([0, 12, 22, 30, 42, 54, 64, 72]);
    for (let step = 0; step <= 7; step++) {
      expect(frequencyOf(step, 100, diatonic)).toBeCloseTo(100 * 2 ** (cum[step] / 72), 9);
    }
  });

  it('puts Γα at 2^(30/72) × base from Νη', () => {
    expect(frequencyOf(3, 261.63, diatonic)).toBeCloseTo(261.63 * 2 ** (30 / 72), 9);
  });

  it('puts Νη′ at exactly the octave', () => {
    expect(frequencyOf(7, 261.63, diatonic)).toBeCloseTo(523.26, 9);
  });

  it('rejects a step outside the scale', () => {
    expect(() => frequencyOf(8, 100, diatonic)).toThrow(RangeError);
  });

  it('is audibly not equal temperament: Βου sits 22 moria (366.7 cents) up, not 400', () => {
    expect(moriaToCents(22)).toBeCloseTo(366.667, 2);
  });
});
