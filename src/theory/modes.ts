/**
 * The eight modes as data. Everything the ladder, the tutor panel and the tuner need to
 * know about a mode is a field here, written so that a chanter can check it without
 * reading code: the genus, the base note, the span, the seven intervals spelled out in
 * moria, the attractions, and the text each claim is taken from.
 *
 * Interval truth is the 1881 Patriarchal Committee system only (72 moria per octave;
 * `moria.ts`). `intervals` is written out rather than derived from the genus so that a
 * reviewer sees the numbers and a test checks they sum to 72.
 *
 * Pl. 4 is complete and cited. The other seven entries are partial (`partial: true`): the
 * genus is settled by the destination document, everything else is null until that mode's
 * own work item sources it from a theory text.
 */

import type { GenusName } from './moria';

/** Step names, base to octave. Note names are Ni…Zo everywhere; Western letters appear
 * only as the faint hint on the ladder (`pitch.ts`). */
export const STEP_NAMES = ['Νη', 'Πα', 'Βου', 'Γα', 'Δη', 'Κε', 'Ζω', 'Νη′'] as const;
export const STEP_NAMES_LATIN = ['Ni', 'Pa', 'Vou', 'Ga', 'Di', 'Ke', 'Zo', "Ni'"] as const;
export type StepName = (typeof STEP_NAMES_LATIN)[number];

/**
 * Where Νη sounds when the ladder opens. Byzantine pitch is relative: theory texts write
 * Νη on the staff as C (see `pl4.sources[1]`), but no text fixes a frequency and a chanter
 * takes the base where the voice sits. We realise the conventional C as C4 at A = 440
 * (261.63 Hz) because (a) the faint Western hint then reads exactly "C4", (b) a phone
 * speaker renders 262 Hz clearly where 131 Hz (C3) is thin, and (c) item 05's octave
 * folding lets a voice singing an octave lower still land on Νη. A default only; the
 * ladder's base stepper moves it (`pitch.ts`).
 */
export const DEFAULT_NI_HZ = 261.63;

/**
 * A verbatim quotation from a real text, with enough to find it again. Item 07 renders
 * this shape as a tutor *source*; hymns use the same shape. Never paraphrase into `quote`.
 */
export interface Source {
  quote: string;
  author: string;
  work: string;
  link: string;
  /** Page, table or section within the work, as printed there. */
  where?: string;
}

/**
 * A short factoid for the tutor panel: plain explanation, not a quotation. Notes may be
 * AI-drafted and are always shown as notes, visibly distinct from sources; anything
 * historical or narrative must be a `Source` instead. Item 07 sets the length limit.
 */
export interface Note {
  text: string;
}

/**
 * A standard attraction (ἕλξις): a step pulled toward a neighbour under a melodic
 * condition. Recorded as data; not played by the ladder. `moria` is signed (negative =
 * lowered) and null where the cited text gives the rule but not the size.
 */
export interface Attraction {
  step: StepName;
  moria: number | null;
  when: string;
}

export type ModeId = 'pl4' | 'm1' | 'pl1' | 'm4' | 'm2' | 'pl2' | 'm3' | 'grave';

export interface Mode {
  /** Stable id used in routes and by hymn data. */
  id: ModeId;
  /** 1–8, matching `catalogue/modes.json`. */
  number: number;
  nameGr: string;
  nameEn: string;
  /** Roadmap label: "Pl. 4", "1", "Grave". */
  short: string;
  genus: GenusName;
  /** Step the scale is built from. Null while unsourced. */
  base: StepName | null;
  /** The ladder's octave, base to octave. Null while unsourced. */
  span: [StepName, StepName] | null;
  /** Seven intervals in moria between adjacent steps of `span`. Null while unsourced. */
  intervals: number[] | null;
  /** Null when the cited text does not cover attractions; an empty list would claim there are none. */
  attractions: Attraction[] | null;
  sources: Source[];
  notes: Note[];
  /** True when any field above is null for want of a source; the page must say so. */
  partial: boolean;
  /** Roadmap: tagged Beginner on the Scales list. */
  beginner?: boolean;
}

const pl4: Mode = {
  id: 'pl4',
  number: 8,
  nameGr: 'Ἦχος πλ. δʹ',
  nameEn: 'Plagal Fourth Mode',
  short: 'Pl. 4',
  genus: 'diatonic',
  base: 'Ni',
  span: ['Ni', "Ni'"],
  // Νη Πα Βου Γα Δη Κε Ζω Νη′ — diatonic 12-10-8, the disjunctive 12, 12-10-8 again.
  intervals: [12, 10, 8, 12, 12, 10, 8],
  // TODO(source): the cited paper gives the scale structure only and says nothing about
  // attractions, so none are recorded rather than half of them from memory. Fill this from
  // a theory text that states them — Boyer, *Byzantine Chant: The Received Tradition*
  // (Holy Cross Orthodox Press, 2022) or the Committee's own *Στοιχειώδης διδασκαλία τῆς
  // ἐκκλησιαστικῆς μουσικῆς* (Constantinople, 1888) — and add that text to `sources`.
  attractions: null,
  sources: [
    {
      quote:
        'Table 1. The scale structure of the eight modes (octoechos) measured in multiples of a morio. The two tetrachords are indicated. […] Fourth Plagal  Heirmoi/Stichera  12 10 8 | 12 | 12 10 8',
      author: 'Maria Panteli and Hendrik Purwins',
      work: 'A Computational Comparison of Theory and Practice of Scale Intonation in Byzantine Chant (Proceedings of ISMIR 2013)',
      link: 'https://archives.ismir.net/ismir2013/paper/000098.pdf',
      where: 'p. 2, Table 1',
    },
    {
      quote:
        'Using the natural scale (the white keys of the piano) from C to C, the Byzantine notes are named ni, pa, vou, gha, dhi, ke, zo, and the octave ni.',
      author: 'Stanley John Takis',
      work: 'A Primer on the Byzantine Musical System Using Western Notation and Theory',
      link: 'https://www.kelfar.net/orthodoxiaradio/Byzantine/byzmusic.pdf',
      where: 'p. 3',
    },
  ],
  notes: [
    {
      text: 'The diatonic modes — Pl. 4, 1, Pl. 1 and 4 — share one set of pitches, Νη Πα Βου Γα Δη Κε Ζω, built from 12‑10‑8 tetrachords. What makes this ladder Pl. 4’s is where it stands: the octave is read from Νη. Read the same rungs from Πα and the numbers between them change — that is First mode’s scale.',
    },
    {
      text: 'A mode is more than its scale. Pl. 4 also has its base and resting notes, its attractions — rungs that bend as the melody moves through them — and its own melodic formulae, announced by the apechema Νεάγιε. The ladder shows the first of these; the hymns teach the rest.',
    },
    {
      text: 'The numbers between rungs are moria: the octave is 72 of them, and Byzantine intervals are whole numbers of moria rather than a piano’s 100‑cent semitones. 12 is close to a Western whole tone; 8 is well short of one — which is why Βου and Ζω sound flatter than a piano’s E and B.',
    },
  ],
  partial: false,
  beginner: true,
};

/** A mode whose genus is settled but whose table is not yet sourced. */
function unsourced(fields: Pick<Mode, 'id' | 'number' | 'nameGr' | 'nameEn' | 'short' | 'genus'>): Mode {
  return { ...fields, base: null, span: null, intervals: null, attractions: null, sources: [], notes: [], partial: true };
}

/** All eight, in roadmap order: diatonic, then chromatic, then enharmonic. */
export const MODES: readonly Mode[] = [
  pl4,
  unsourced({ id: 'm1', number: 1, nameGr: 'Ἦχος αʹ', nameEn: 'First Mode', short: '1', genus: 'diatonic' }),
  unsourced({ id: 'pl1', number: 5, nameGr: 'Ἦχος πλ. αʹ', nameEn: 'Plagal First Mode', short: 'Pl. 1', genus: 'diatonic' }),
  unsourced({ id: 'm4', number: 4, nameGr: 'Ἦχος δʹ', nameEn: 'Fourth Mode', short: '4', genus: 'diatonic' }),
  unsourced({ id: 'm2', number: 2, nameGr: 'Ἦχος βʹ', nameEn: 'Second Mode', short: '2', genus: 'softChromatic' }),
  unsourced({ id: 'pl2', number: 6, nameGr: 'Ἦχος πλ. βʹ', nameEn: 'Plagal Second Mode', short: 'Pl. 2', genus: 'hardChromatic' }),
  unsourced({ id: 'm3', number: 3, nameGr: 'Ἦχος γʹ', nameEn: 'Third Mode', short: '3', genus: 'enharmonic' }),
  unsourced({ id: 'grave', number: 7, nameGr: 'Ἦχος βαρύς', nameEn: 'Grave Mode', short: 'Grave', genus: 'enharmonic' }),
];

export function modeById(id: string): Mode | undefined {
  return MODES.find((m) => m.id === id);
}
