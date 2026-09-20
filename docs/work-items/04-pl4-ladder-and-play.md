# 04 — Scales → Pl. 4: the ladder with *play*

## Outcome

`/scales` lists the eight modes in roadmap order — Pl. 4 → 1 → Pl. 1 → 4 (diatonic), then
2 / Pl. 2 (chromatic), then 3 / Grave (enharmonic) — with Pl. 4 tagged *Beginner*. Only Pl. 4
links to a working page; the rest say "not yet". `/scales/pl4` shows the **ladder**: Νη Πα Βου
Γα Δη Κε Ζω Νη′ vertically, the moria between adjacent steps, a movable base note whose Western
letter is shown faintly as a hint and nowhere else. *Play* synthesises the steps ascending and
descending at the true 72‑moria intervals, with an ison drone toggle. A `modes` data module holds
the Committee genera and, per mode, its genus, base note and span; Pl. 4's entry is complete and
cited to a named theory text; other modes' entries may be partial but must say so.

## Acceptance criteria

- On the phone: *play* on Pl. 4 sounds Ni…Ni′ up and down against the ison; the steps are
  audibly not equal temperament (Vou and Zo are the tell). The sequence is diatonic
  12‑10‑8‑12‑12‑10‑8 = 72.
- Moving the base note re-labels the faint Western hint and shifts playback; the moria stay.
- Unit tests: each genus's structure sums to 72 over the octave; `frequencyOf(step, baseHz)`
  gives cumulative ratios of 2^(moria/72); from Ni, Γα is at 2^(30/72) × base.
- The theory text used for Pl. 4 is named in the module in a shape item 07 can render as a
  tutor *source* (quote, author, work, link).

## HITL / AFK

AFK, except the operator listens to the result on the phone.

## Constraints

- Interval truth is the 1881 Patriarchal Committee system only: 72 moria/octave; diatonic
  12‑10‑8, soft chromatic 8‑14‑8, hard chromatic 6‑20‑4, enharmonic 12‑12‑6. No Chrysanthine 68,
  no 12‑TET.
- **Open decision 2 is decided for Pl. 4 only**, from a named theory text. Standard attractions
  (ἕλξεις) may be recorded as data without being played yet. Do not invent values; where the
  source is unclear leave the field null and say so in a comment.
- **Open decision 6, base frequency for Ni, is decided here**: one documented default, adjustable
  on the ladder; the reason goes in the module comment. (The ison-default half of decision 6 is
  item 09's.)
- Note names Ni…Zo everywhere; Western letters only as the faint ladder hint.
- Synthesis is plain Web Audio oscillators and envelopes. No samples, no hosted audio.
- The ladder component will also carry the tuner needle (05) and be reused by practice (09):
  keep step positions addressable, but do not build those features here.

## Blockers

- 01.
