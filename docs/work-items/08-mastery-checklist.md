# 08 — Mastery: self-declared per setting, two axes, persisted in the browser

## Outcome

Open decision 5 is decided: the checklist wording for *by ear* (from memory, in mode, against
the ison) and *by notation* (read from the score in parallage) is written down — three to five
items per axis. Each setting page shows both checklists; ticking is self-declared and persists
in IndexedDB in that browser. The Library list shows both axes per setting and its status filter
works off them.

## Acceptance criteria

- On the phone: tick both mastery boxes on Holy Holy Holy, reload — they stay ticked. Clear site
  data — they are gone (progress is browser-local by design).
- Library shows two indicators per setting (ear / notation); the status filter distinguishes
  *not started* / *in progress* / *declared* on either axis.
- Mastery is keyed by setting id: the second setting from item 06 has independent state.
- The storage module has a schema version constant and one unit test that reads back what it
  wrote (fake-indexeddb or equivalent).

## HITL / AFK

AFK to build; the checklist wording is drafted, shown to the operator, and takes their edit
before it ships.

## Constraints

- Nothing is judged by the tuner; no automatic ticking; no points, streaks or progress bars.
  Checkboxes and a date, nothing more.
- IndexedDB, not localStorage (the destination says IndexedDB; it also survives better on iOS).
- **Open decision 7 (export/import) stays open** — but store records as plain JSON-serialisable
  objects under a version constant, so export is a later addition rather than a migration.
- The two axes are fixed; the item wording is not sacred.

## Blockers

- 06.
