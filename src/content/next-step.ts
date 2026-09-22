/**
 * The roadmap's *next step* after a unit, for the hint at the end of a practice view (item 09).
 * Scales → hymns in that mode → the next mode. Nothing is gated: the hint is a link and a
 * sentence, and where the next unit is not built yet it says so and still links.
 */

import { type Mode, MODES, modeById } from '../theory/modes';
import { type Hymn, loadCatalogue, type Setting } from './hymns';

export interface NextStep {
  title: string;
  path: `/${string}`;
  /** False when the unit exists on the roadmap but has not been built ("not yet"). */
  ready: boolean;
}

function hymnsInMode(modeId: string): Hymn[] {
  return loadCatalogue().hymns.filter((h) => h.settings.some((s) => s.mode === modeId));
}

function modeStep(mode: Mode): NextStep {
  return mode.partial
    ? { title: `Mode ${mode.short} — not yet`, path: `/scales/${mode.id}`, ready: false }
    : { title: `Scales → ${mode.short}`, path: `/scales/${mode.id}`, ready: true };
}

/** The mode after `modeId` in roadmap order, or the first when it is the last. */
function nextMode(modeId: string): Mode {
  const i = MODES.findIndex((m) => m.id === modeId);
  return MODES[(i + 1) % MODES.length];
}

/** After a scale: its first hymn in the Library, else the next mode. */
export function afterScale(modeId: string): NextStep {
  const [hymn] = hymnsInMode(modeId);
  if (hymn) return { title: hymn.title_en, path: `/library/${hymn.slug}`, ready: true };
  return modeStep(nextMode(modeId));
}

/** After a hymn setting: the next hymn in the same mode, else the next mode. */
export function afterHymn(hymn: Hymn, setting: Setting): NextStep {
  const inMode = hymnsInMode(setting.mode);
  const next = inMode[inMode.findIndex((h) => h.id === hymn.id) + 1];
  if (next) return { title: next.title_en, path: `/library/${next.slug}`, ready: true };
  const mode = modeById(setting.mode);
  return modeStep(nextMode(mode?.id ?? MODES[0].id));
}
