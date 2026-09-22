/**
 * The content check over the real files: `npm run check:content`. Fails loudly, naming the
 * file and field, when a hymn under `catalogue/hymns/` is malformed.
 */
import { loadCatalogue } from './hymns';

describe('catalogue/hymns', () => {
  const { hymns, problems } = loadCatalogue();

  it('every hymn file with settings passes the check', () => {
    expect(problems).toEqual([]);
  });

  it('Holy Holy Holy is there with a Greek Pl. 4 setting', () => {
    const hhh = hymns.find((h) => h.slug === 'holy-holy-holy');
    expect(hhh?.icxc.service).toBe('Liturgy');
    expect(hhh?.settings.some((s) => s.language === 'gr' && s.mode === 'pl4')).toBe(true);
  });

  it('every score path is one icxc lists for that hymn', () => {
    // A GOA path outside icxc's list is allowed by the check, but none is expected yet; if one
    // appears on purpose, relax this test rather than the check.
    for (const h of hymns) {
      for (const s of h.settings) {
        if (s.score) expect(h.icxc.scores.map((sc) => sc.path)).toContain(s.score);
      }
    }
  });
});
