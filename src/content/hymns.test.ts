import { buildCatalogue, checkHymn, scoreUrl, youtubeEmbedUrl } from './hymns';

function good(): Record<string, unknown> {
  return {
    id: 'x.y',
    slug: 'holy-holy-holy',
    title_gr: 'Ἅγιος',
    title_en: 'Holy',
    settings: [
      {
        id: 'gr-pl4',
        language: 'gr',
        mode: 'pl4',
        label: 'A setting',
        score: null,
        recordings: [{ youtube: 'lKMKyT8ItOc', singer: 'Someone', start: 200 }],
        about: 'Sung here.',
        byz: null,
      },
    ],
    icxc: { text_gr: 'Ἅγιος', text_en: 'Holy', service: 'Liturgy', scores: [] },
  };
}

function errorsOf(raw: unknown): string[] {
  const r = checkHymn(raw, 'f.json');
  return r.ok ? [] : r.errors;
}

describe('checkHymn', () => {
  it('accepts a well-formed hymn', () => {
    expect(checkHymn(good()).ok).toBe(true);
  });

  it('accepts a level tag and rejects an unknown one', () => {
    expect(checkHymn({ ...good(), level: 'beginner' }).ok).toBe(true);
    expect(checkHymn({ ...good(), level: 'advanced' }).ok).toBe(true);
    expect(errorsOf({ ...good(), level: 'hard' })).toEqual(['f.json: level must be "beginner", "advanced", or absent']);
  });

  it('names the offending field', () => {
    const h = good();
    (h.settings as Record<string, unknown>[])[0].recordings = [{ youtube: 'https://youtu.be/lKMKyT8ItOc', singer: 'S' }];
    expect(errorsOf(h)).toEqual(['f.json: settings[0].recordings[0].youtube must be the 11-character video id, not a URL']);
  });

  it('reports every problem, not just the first', () => {
    const h = good();
    const s = (h.settings as Record<string, unknown>[])[0];
    s.mode = 'mode 8';
    s.byz = {};
    s.score = 'https://icxc.pro/api/file?path=media/x.pdf';
    delete h.slug;
    const errors = errorsOf(h);
    expect(errors.some((e) => e.startsWith('f.json: slug '))).toBe(true);
    expect(errors.some((e) => e.startsWith('f.json: settings[0].mode '))).toBe(true);
    expect(errors.some((e) => e.startsWith('f.json: settings[0].byz '))).toBe(true);
    expect(errors.some((e) => e.startsWith('f.json: settings[0].score '))).toBe(true);
    expect(errors).toHaveLength(4);
  });

  it('rejects duplicate setting ids and a missing ingest block', () => {
    const h = good();
    h.settings = [(h.settings as unknown[])[0], (good().settings as unknown[])[0]];
    delete h.icxc;
    expect(errorsOf(h)).toEqual(['f.json: icxc missing — run the ingest', 'f.json: settings[1].id duplicates "gr-pl4"']);
  });
});

describe('buildCatalogue', () => {
  it('skips files without settings silently and reports broken ones', () => {
    const bad = good();
    (bad.settings as Record<string, unknown>[])[0].language = 'de';
    const files = {
      '/catalogue/hymns/a.json': good(),
      '/catalogue/hymns/apechema.m1.json': { id: 'apechema.m1', kind: 'apechema' },
      '/catalogue/hymns/b.json': bad,
    };
    const { hymns, problems } = buildCatalogue(files);
    expect(hymns.map((h) => h.id)).toEqual(['x.y']);
    expect(problems).toEqual(['b.json: settings[0].language must be "gr" or "en"']);
  });

  it('flags two hymns sharing a slug', () => {
    const { problems } = buildCatalogue({ '/a.json': good(), '/b.json': { ...good(), id: 'z' } });
    expect(problems).toEqual(['z: slug "holy-holy-holy" is also x.y\'s']);
  });
});

describe('urls', () => {
  it('links scores under the GOA root, escaping the path', () => {
    expect(scoreUrl('media/m/dedes/en/eu/lichrysbasil/w/liturgicmode8_simple.pdf')).toBe(
      'https://dcs.goarch.org/media/m/dedes/en/eu/lichrysbasil/w/liturgicmode8_simple.pdf',
    );
    expect(scoreUrl('media/m/x/a b.pdf')).toBe('https://dcs.goarch.org/media/m/x/a%20b.pdf');
  });

  it('embeds without autoplay, with start and end when given', () => {
    expect(youtubeEmbedUrl({ youtube: 'lKMKyT8ItOc', singer: 's' })).toBe(
      'https://www.youtube-nocookie.com/embed/lKMKyT8ItOc?playsinline=1&rel=0',
    );
    expect(youtubeEmbedUrl({ youtube: 'lKMKyT8ItOc', singer: 's', start: 201.4, end: 260.2 })).toBe(
      'https://www.youtube-nocookie.com/embed/lKMKyT8ItOc?playsinline=1&rel=0&start=201&end=261',
    );
  });
});
