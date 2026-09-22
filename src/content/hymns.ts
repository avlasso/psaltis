/**
 * Hymns as data. One JSON file per hymn under `catalogue/hymns/`; the app reads them all at
 * build time. Two owners share a file: everything under `icxc` is ingested and rewritten by
 * `python -m psaltis ingest`; everything at the top level is the operator's, written by hand
 * and preserved across re-ingest. The operator's part that matters here is `settings[]`.
 *
 * Why flat JSON in the same file (open decision 8): the ingest tool already preserves
 * top-level fields, so a second file or format would add a parser and a second place to keep
 * in step for no gain at this size; `about` is a short paragraph, not an essay. Revisit if
 * item 07's verbatim quotations make JSON strings painful. Documented in `catalogue/README.md`.
 */

import type { ModeId } from '../theory/modes';
import { MODES } from '../theory/modes';

/**
 * Open decision 1: the GOA Digital Chant Stand serves the same `media/m/…` paths icxc lists,
 * directly under the host. Verified 2026-09-22 with real requests (200, application/pdf) on
 * Barrett gr/b, Dedes en/w and Theodoridis gr/b paths. icxc's `en_public` copies (names with
 * spaces) are not there; a setting must not point at those.
 */
export const GOA_MEDIA_ROOT = 'https://dcs.goarch.org/';

export type Language = 'gr' | 'en';

/** A YouTube recording of one setting. Never an icxc/GOA mp3. */
export interface Recording {
  /** The 11-character video id, not a URL. */
  youtube: string;
  singer: string;
  /** Choir, occasion, or edition — whatever tells the recordings apart. */
  label?: string;
  /** Seconds into the video where this hymn starts / ends, when the video holds a whole set. */
  start?: number;
  end?: number;
}

/**
 * One melody of a hymn: a language, a mode, a score, recordings, and later its own mastery
 * state (item 08) and `.byz` transcription. Greek and English are different melodies and so
 * different settings.
 */
export interface Setting {
  /** Stable within the hymn; mastery keys on `<hymn>/<setting>`. */
  id: string;
  language: Language;
  /** The scale the tuner takes on the practice view; a `ModeId` from `modes.ts`. */
  mode: ModeId;
  /** Composer, edition, or tradition — the line under the setting's heading. */
  label: string;
  /** A GOA `media/m/…` path (usually one of `icxc.scores[].path`), or null when GOA has none. */
  score: string | null;
  recordings: Recording[];
  /** Where in the service it is sung, what this setting is. Plain and short; history is item 07's. */
  about: string;
  /** Reserved for the Neanes transcription; always null for now. */
  byz: null;
}

/** The ingested part we read. The full shape is the Python tool's (`catalogue/README.md`). */
export interface IcxcBlock {
  text_gr: string;
  text_en: string;
  service: string;
  scores: { path: string; notation: string; language: string; source: string; label?: string }[];
}

/**
 * Roadmap signposting (item 10): a hymn is tagged *Beginner* or *not for beginners*, or
 * carries no tag at all. Nothing is gated by it — the tag is a hint on the Library list and
 * the hymn page. Papadic pieces (Cherubic, Communion) are the `advanced` case.
 */
export type Level = 'beginner' | 'advanced';
export const LEVEL_LABEL: Record<Level, string> = { beginner: 'Beginner', advanced: 'Not for beginners' };

export interface Hymn {
  id: string;
  /** Route segment: `/library/<slug>`. */
  slug: string;
  title_gr: string;
  title_en: string;
  /** Beginner signposting; absent on a hymn that is neither especially easy nor hard. */
  level?: Level;
  settings: Setting[];
  icxc: IcxcBlock;
}

/** Mastery (item 08) will derive this from stored ticks; until then every setting is not started. */
export type Status = 'not started' | 'in progress' | 'declared';
export const STATUSES: readonly Status[] = ['not started', 'in progress', 'declared'];

export function statusOf(_setting: Setting): Status {
  return 'not started';
}

export function scoreUrl(path: string): string {
  return GOA_MEDIA_ROOT + path.split('/').map(encodeURIComponent).join('/');
}

export function youtubeEmbedUrl(r: Recording): string {
  const q = new URLSearchParams({ playsinline: '1', rel: '0' });
  if (r.start !== undefined) q.set('start', String(Math.floor(r.start)));
  if (r.end !== undefined) q.set('end', String(Math.ceil(r.end)));
  return `https://www.youtube-nocookie.com/embed/${r.youtube}?${q}`;
}

// --- the content check ------------------------------------------------------------------------

export type CheckResult = { ok: true; hymn: Hymn } | { ok: false; errors: string[] };

const MODE_IDS = new Set<string>(MODES.map((m) => m.id));
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validates one hymn file and names every offending field. */
export function checkHymn(raw: unknown, file = '<hymn>'): CheckResult {
  const errors: string[] = [];
  const at = (field: string, msg: string) => errors.push(`${file}: ${field} ${msg}`);

  if (!isRecord(raw)) return { ok: false, errors: [`${file}: not a JSON object`] };
  for (const f of ['id', 'title_gr', 'title_en'] as const) {
    if (typeof raw[f] !== 'string' || !raw[f]) at(f, 'must be a non-empty string');
  }
  if (!isRecord(raw.icxc)) at('icxc', 'missing — run the ingest');
  else {
    if (typeof raw.icxc.text_gr !== 'string') at('icxc.text_gr', 'must be a string');
    if (typeof raw.icxc.text_en !== 'string') at('icxc.text_en', 'must be a string');
    if (typeof raw.icxc.service !== 'string') at('icxc.service', 'must be a string');
    if (!Array.isArray(raw.icxc.scores)) at('icxc.scores', 'must be a list');
  }

  if (raw.level !== undefined && raw.level !== 'beginner' && raw.level !== 'advanced') {
    at('level', 'must be "beginner", "advanced", or absent');
  }

  if (!Array.isArray(raw.settings)) {
    at('settings', 'must be a list');
  } else {
    if (typeof raw.slug !== 'string' || !SLUG.test(raw.slug)) at('slug', 'must be lower-case words joined by hyphens');
    const ids = new Set<string>();
    raw.settings.forEach((s, i) => {
      const p = `settings[${i}]`;
      if (!isRecord(s)) return at(p, 'must be an object');
      if (typeof s.id !== 'string' || !SLUG.test(s.id)) at(`${p}.id`, 'must be lower-case words joined by hyphens');
      else if (ids.has(s.id)) at(`${p}.id`, `duplicates "${s.id}"`);
      else ids.add(s.id);
      if (s.language !== 'gr' && s.language !== 'en') at(`${p}.language`, 'must be "gr" or "en"');
      if (typeof s.mode !== 'string' || !MODE_IDS.has(s.mode)) at(`${p}.mode`, `must be one of ${[...MODE_IDS].join(', ')}`);
      if (typeof s.label !== 'string' || !s.label) at(`${p}.label`, 'must be a non-empty string');
      if (s.score !== null && (typeof s.score !== 'string' || !s.score.startsWith('media/'))) {
        at(`${p}.score`, 'must be a GOA "media/…" path or null');
      }
      if (typeof s.about !== 'string' || !s.about) at(`${p}.about`, 'must be a non-empty string');
      if (s.byz !== null) at(`${p}.byz`, 'is reserved; must be null');
      if (!Array.isArray(s.recordings)) at(`${p}.recordings`, 'must be a list (may be empty)');
      else {
        s.recordings.forEach((r, j) => {
          const q = `${p}.recordings[${j}]`;
          if (!isRecord(r)) return at(q, 'must be an object');
          if (typeof r.youtube !== 'string' || !YOUTUBE_ID.test(r.youtube)) {
            at(`${q}.youtube`, 'must be the 11-character video id, not a URL');
          }
          if (typeof r.singer !== 'string' || !r.singer) at(`${q}.singer`, 'must be a non-empty string');
          if (r.label !== undefined && typeof r.label !== 'string') at(`${q}.label`, 'must be a string if present');
          for (const f of ['start', 'end'] as const) {
            if (r[f] !== undefined && (typeof r[f] !== 'number' || r[f] < 0)) at(`${q}.${f}`, 'must be seconds (a number ≥ 0)');
          }
        });
      }
    });
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, hymn: raw as unknown as Hymn };
}

// --- loading ------------------------------------------------------------------------------------

export interface Catalogue {
  hymns: Hymn[];
  /** Every problem found, one line each, for the Library page to show. Empty when all is well. */
  problems: string[];
}

/**
 * Builds the Library from every file under `catalogue/hymns/`. Files without `settings` are
 * not Library hymns (v1-era ingests, apēchēmata) and are skipped silently; a file *with*
 * `settings` that fails the check is skipped and reported, so one typo never blanks the whole
 * Library — and `npm run check:content` fails on it.
 */
export function buildCatalogue(files: Record<string, unknown>): Catalogue {
  const hymns: Hymn[] = [];
  const problems: string[] = [];
  for (const [path, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    if (!isRecord(raw) || !('settings' in raw)) continue;
    const name = path.slice(path.lastIndexOf('/') + 1);
    const result = checkHymn(raw, name);
    if (result.ok) hymns.push(result.hymn);
    else problems.push(...result.errors);
  }
  const slugs = new Map<string, string>();
  for (const h of hymns) {
    const other = slugs.get(h.slug);
    if (other) problems.push(`${h.id}: slug "${h.slug}" is also ${other}'s`);
    slugs.set(h.slug, h.id);
  }
  return { hymns, problems };
}

const FILES = import.meta.glob('/catalogue/hymns/*.json', { eager: true, import: 'default' });

let catalogue: Catalogue | undefined;

export function loadCatalogue(): Catalogue {
  catalogue ??= buildCatalogue(FILES);
  return catalogue;
}

export function hymnBySlug(slug: string): Hymn | undefined {
  return loadCatalogue().hymns.find((h) => h.slug === slug);
}
