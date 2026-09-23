/**
 * Mastery (item 08, open decision 5): self-declared, per setting, on two fixed axes. The
 * wording below is the operator's to edit; the item ids are what the browser stores, so change
 * the text freely but give an item a new id only when it asks something different — a ticked
 * item whose id disappears is simply no longer shown. Nothing here is judged by the tuner.
 */

export type Axis = 'ear' | 'notation';
export const AXES: readonly Axis[] = ['ear', 'notation'];

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface AxisChecklist {
  title: string;
  /** One line under the title saying what the axis means. */
  gloss: string;
  items: ChecklistItem[];
}

export const CHECKLIST: Record<Axis, AxisChecklist> = {
  ear: {
    title: 'By ear',
    gloss: 'From memory, in the mode, against the ison.',
    items: [
      { id: 'from-memory', text: 'I can sing it from start to finish without the score or a recording.' },
      { id: 'words', text: 'I know the words well enough not to stumble over them.' },
      {
        id: 'in-mode',
        text: "My steps sound like this mode's ladder on the Scales page, not like a Western scale.",
      },
      { id: 'against-ison', text: 'I can sing it over the ison and still end on the same note it holds.' },
    ],
  },
  notation: {
    title: 'By notation',
    gloss: 'Read from the score, in parallage.',
    items: [
      { id: 'start-note', text: 'I can find the starting note on the score from the sign at the beginning (the martyria).' },
      { id: 'say-parallage', text: 'I can say the note names (Νη, Πα, Βου…) of every line by following the neumes, slowly.' },
      { id: 'sing-parallage', text: 'I can sing that parallage in tune, from the score alone.' },
      { id: 'sing-words', text: 'I can sing the words from the score, keeping the melody the parallage gave me.' },
    ],
  },
};

/** What one setting's browser record holds: for each axis, the ticked item ids and the day each was ticked. */
export type Ticks = Record<Axis, Record<string, string>>;

export function emptyTicks(): Ticks {
  return { ear: {}, notation: {} };
}

export type Status = 'not started' | 'in progress' | 'declared';
export const STATUSES: readonly Status[] = ['not started', 'in progress', 'declared'];

/** Nothing ticked → not started; everything ticked → declared; otherwise in progress. */
export function axisStatus(ticks: Ticks, axis: Axis): Status {
  const items = CHECKLIST[axis].items;
  const ticked = items.filter((i) => ticks[axis][i.id]).length;
  if (ticked === 0) return 'not started';
  return ticked === items.length ? 'declared' : 'in progress';
}

/** The Library's status filter: a setting matches when either axis has that status. */
export function matchesStatus(ticks: Ticks, status: Status): boolean {
  return AXES.some((a) => axisStatus(ticks, a) === status);
}
