# Mastery: the checklist wording and how progress is kept (item 08)

Open decision 5, decided 2026-09-22: the operator accepted the drafted wording as it stands.

## The checklists

The wording lives in `CHECKLIST` in `src/content/mastery.ts`, the one place to edit it. Each
item has an id the browser stores; edit the text freely, and change an id only when the item
asks something different (a ticked item whose id disappears is no longer shown or counted).

**By ear** — from memory, in the mode, against the ison.

1. I can sing it from start to finish without the score or a recording.
2. I know the words well enough not to stumble over them.
3. My steps sound like this mode's ladder on the Scales page, not like a Western scale.
4. I can sing it over the ison and still end on the same note it holds.

**By notation** — read from the score, in parallage.

1. I can find the starting note on the score from the sign at the beginning (the martyria).
2. I can say the note names (Νη, Πα, Βου…) of every line by following the neumes, slowly.
3. I can sing that parallage in tune, from the score alone.
4. I can sing the words from the score, keeping the melody the parallage gave me.

## Status

Per axis: nothing ticked is *not started*, everything ticked is *declared*, anything between
is *in progress*. The Library shows both axes on every setting. Its status filter keeps a
setting when **either** axis has the chosen status, so a setting declared by ear and not
started by notation appears under both. An axis selector would be the next step if that
proves confusing.

## Storage

IndexedDB database `psaltis`, object store `mastery`, one record per setting keyed
`<hymn id>/<setting id>`: `{ schema: 1, key, ticks: { ear: { <item id>: "YYYY-MM-DD" },
notation: { … } } }`. Plain JSON, so export/import (open decision 7, still open) can dump and
load these records as they are. `SCHEMA_VERSION` in `src/progress/store.ts` goes up if the shape
changes. If IndexedDB will not open, ticks work for the visit and the page says they will not
be kept.
