# Work items — first slice

Decomposed from [`../destination.md`](../destination.md) on 2026-09-20. One file per item; each
is sized for a fresh context to pick up, do, and verify on its own. Together they deliver the
destination's **First slice** and meet its **Acceptance** section. The *Status* column is the
set's only state: mark an item done here when its commit lands, or the set drifts from the git log.

| #  | Item | Blocked by | HITL | Status |
|----|------|-----------|------|--------|
| 01 | [App scaffold, Home, GitHub Pages deploy](01-scaffold-home-pages.md) | — | enable Pages once | done 2026-09-20 |
| 02 | [Carry over the content layer; ingest Holy Holy Holy](02-content-layer-and-holy-holy-holy-ingest.md) | — | — | done 2026-09-20 |
| 03 | [Pitch-detector spike on a phone mic](03-pitch-detector-spike.md) | 01 | operator sings | done 2026-09-20 |
| 04 | [Scales → Pl. 4: ladder with *play*](04-pl4-ladder-and-play.md) | 01 | — | done 2026-09-20 |
| 05 | [Scales → Pl. 4: *tune*](05-pl4-tune.md) | 03, 04 | operator sings | done 2026-09-20 |
| 06 | [Library: Holy Holy Holy + content format](06-library-holy-holy-holy-and-content-format.md) | 01, 02 | operator picks setting & video | done 2026-09-22 |
| 07 | [Tutor panel](07-tutor-panel.md) | 04, 06 | operator accepts each source/note | open |
| 08 | [Mastery checklist](08-mastery-checklist.md) | 06 | operator edits wording | open |
| 09 | [*Practice this*](09-practice-this.md) | 05, 06 | — | done 2026-09-22 |
| 10 | [*Where do I start?*](10-where-do-i-start.md) | 04, 06 | — | open |

## Graph

```
01 ──┬── 03 ──┐
     │        ├── 05 ──┐
     ├── 04 ──┘        ├── 09
     │    │            │
02 ──┴── 06 ───────────┘
          │
          ├── 07 (also 04)
          ├── 08
          └── 10 (also 04)
```

01 and 02 are independent and can start at once. 03 and 04 are independent of each other; 03 is
the technical risk and 06 the content-shape risk, so start those early. 07, 08, 09, 10 are
independent of one another once their blockers land.

## Open decisions → where they are decided

| Destination's open decision | Decided in |
|---|---|
| 1. GOA media root URL | 06 |
| 2. Per-mode interval tables | 04, for Pl. 4 only; each later mode item does its own |
| 3. Which setting of Holy Holy Holy | 06 (operator) |
| 4. What the *learn* tab holds before `.byz` | **left open** — 06 shows play/about/score only |
| 5. Mastery checklist wording | 08 |
| 6. Default Ni frequency / ison on by default | 04 (frequency), 09 (ison default: off — [decisions/practice.md](../decisions/practice.md)) |
| 7. Progress export/import | **left open** — 08 keeps the door open (versioned plain records) |
| 8. Data format for operator-owned content | 06 |
| 9. Icon set | 01 |
| 10. Pitch detector | 03 |

## Not itemised yet, on purpose

These are settled as destination but not ready to be items: their shape depends on what the
first slice teaches. Itemise them after the slice is on the phone.

- **The other seven modes** — each is a repeat of 04 + 05 + 07 with its own sourced table, in
  roadmap order: 1, Pl. 1, 4, then 2 / Pl. 2, then 3 / Grave.
- **The Notation course** — neume families with parallage examples against the ladder, each
  neume a glossary entry linked from scores. The first slice only has a tile.
- **Hymn tiers 1–3 beyond Holy Holy Holy** — each hymn a repeat of 06 + 07 + operator picks;
  tier 1 (Liturgy fixed hymns) first.
- **A terms glossary** — plain-language entries for moria, tetrachord, genus, attraction, ison,
  apechema, parallage, reachable from wherever the term appears; the neume glossary from the
  destination probably lives with it. Asked for by the operator on 2026-09-20; where it lives
  and how entries are keyed is item 07's call or a small item after it.
- **The *learn* tab** (open decision 4) and **progress export/import** (open decision 7).
- **A preferences / settings menu** — language (Greek, English), notation, which recordings
  to show — so a hymn page shows what this learner needs rather than every setting and
  recording in one column. Asked for by the operator on 2026-09-22 after seeing item 06 on the
  phone; postponed by the operator until more hymns and settings exist to choose between.
- **Interactive `.byz` scores**, **hosted audio**, **record-and-compare** — stated boundaries;
  the hymn schema's `byz: null` slot and the tuner's `NoteSequence` target are the only
  concessions made now.
- **Practice with feedback against the score** — asked for by the operator on 2026-09-22 after
  item 09: the practice view of a hymn follows the hymn's own notes in time, highlights the
  expected step on the ladder (silently) and the corresponding neume on a Byzantine score shown
  beside it, and shows a plain following indicator — green while the sung step matches the
  expected one, red while it does not. Feedback, not gamification: no totals, no pass/fail, no
  record kept. Preconditions, in order: the setting transcribed in Neanes (the operator, per
  hymn) filling the `byz` slot; a renderer for that notation in the browser; the tuner's
  `NoteSequence` target implemented. The open design question is **what drives the clock** —
  a fixed tempo the learner follows, the score advancing when the expected note is heard, or
  the time-line of a chosen recording — since chant is free-rhythm and the destination's
  boundary on tuner-judged mastery is about exactly this alignment. Decide that before
  itemising; the green/red indicator is the last piece, not the first.
