import { afterHymn, afterScale } from './next-step';
import { hymnBySlug } from './hymns';

describe('next step', () => {
  it('after Pl. 4 is Holy Holy Holy', () => {
    expect(afterScale('pl4')).toEqual({ title: 'Holy, holy, holy, Lord', path: '/library/holy-holy-holy', ready: true });
  });

  it('after Holy Holy Holy is Mode 1, not yet — there is no second Pl. 4 hymn', () => {
    const hymn = hymnBySlug('holy-holy-holy')!;
    expect(afterHymn(hymn, hymn.settings[0])).toEqual({ title: 'Mode 1 — not yet', path: '/scales/m1', ready: false });
  });

  it('after a mode with no hymns is the next mode', () => {
    expect(afterScale('m1')).toMatchObject({ path: '/scales/pl1', ready: false });
  });
});
