import { DEFAULT_NI_HZ, MODES, modeById } from './modes';

describe('modes data', () => {
  it('lists the eight modes in roadmap order', () => {
    expect(MODES.map((m) => m.id)).toEqual(['pl4', 'm1', 'pl1', 'm4', 'm2', 'pl2', 'm3', 'grave']);
    expect(new Set(MODES.map((m) => m.number)).size).toBe(8);
  });

  it('has Pl. 4 complete, diatonic from Νη, 12-10-8-12-12-10-8', () => {
    const pl4 = modeById('pl4')!;
    expect(pl4.partial).toBe(false);
    expect(pl4.beginner).toBe(true);
    expect(pl4.genus).toBe('diatonic');
    expect(pl4.base).toBe('Ni');
    expect(pl4.span).toEqual(['Ni', "Ni'"]);
    expect(pl4.intervals).toEqual([12, 10, 8, 12, 12, 10, 8]);
  });

  it('cites Pl. 4 to a named text in the tutor-source shape', () => {
    const pl4 = modeById('pl4')!;
    expect(pl4.sources.length).toBeGreaterThan(0);
    for (const s of pl4.sources) {
      for (const field of ['quote', 'author', 'work', 'link'] as const) {
        expect(s[field].trim().length, field).toBeGreaterThan(0);
      }
      expect(s.link).toMatch(/^https:\/\//);
    }
    expect(pl4.sources[0].quote).toContain('12 10 8 | 12 | 12 10 8');
  });

  it('every mode with intervals sums to 72; partial modes say so and claim nothing', () => {
    for (const m of MODES) {
      if (m.intervals) {
        expect(m.intervals.reduce((a, b) => a + b, 0), m.id).toBe(72);
        expect(m.intervals.length).toBe(7);
      } else {
        expect(m.partial, m.id).toBe(true);
        expect(m.base).toBeNull();
        expect(m.span).toBeNull();
      }
    }
  });

  it('defaults Νη to C4 at A = 440', () => {
    expect(DEFAULT_NI_HZ).toBeCloseTo(440 * 2 ** (-9 / 12), 2);
  });
});
