# 05 — Scales → Pl. 4: *tune* (live pitch on the ladder)

## Outcome

The Pl. 4 page has a *tune* control. With the microphone on, the learner's pitch is drawn live
on the ladder against the nearest step of the current scale and base note, with the distance off
shown in moria, signed. The tuner is **one reusable component that takes a target** — a scale
now; its interface leaves an explicit slot for a note sequence once `.byz` scores exist.

## Acceptance criteria

- On the phone over Pages: enable *tune*, hum Ni at the base; the needle lands on Νη reading ≈0.
  Slide up to Πα; the needle moves and the nearest-step label follows.
- Below the clarity threshold (silence, noise) the needle hides or greys; it never snaps to a
  random step.
- Humming an octave below the ladder still lands on the right step (octave folding is documented
  behaviour; the ladder shows one octave).
- `Tuner` takes `{ target: Scale, baseHz }` and emits `{ hz, step, offsetMoria, clarity }`; a
  unit test feeds synthetic Hz values and checks step and offset.
- *Play* and *tune* coexist: the ison can drone while tuning.

## HITL / AFK

HITL: the operator sings. Build AFK, then hand over.

## Constraints

- Uses item 03's detector unchanged. If it proves inadequate on the ladder, reopen 03 rather
  than patch here.
- It shows; it does not score. No pass/fail, streak, or praise — scored drills are a stated
  boundary.
- Offset is displayed in moria (1 morion ≈ 16.67 cents). Cents may appear in a debug view only.
- Target type: `Scale` implemented; a `NoteSequence` variant reserved in the type and not
  implemented.

## Blockers

- 03, 04.
