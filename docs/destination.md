# psaltis — destination

Settled in a grilling session on 2026-09-20. This is the whole of what a fresh context needs to
start work; it replaces the v1 design (`../psaltis-v1/docs/design.md`), whose curriculum, scheduler
and platform decisions are reversed here. Break it into work items with `/to-work-items`.

## End state

**psaltis** is a static web app for learning Byzantine chant properly: first the scale system
and the modes, then the notation, then the Sunday hymns. It is built for the operator now and is
shareable with another parishioner later without rework.

When it is done:

- It runs from GitHub Pages over HTTPS (TypeScript + Vite, no backend). A phone opens it
  anywhere; progress lives in that browser (IndexedDB). The microphone works because the page
  is HTTPS.
- **Home** is a plain front door: the three sections and a *Where do I start?* link.
- **Scales** has one page per mode. Each shows a *ladder* — Νη Πα Βου Γα Δη Κε Ζω Νη′ vertically,
  the moria between adjacent steps, a movable base note (Western letter shown faintly as a hint,
  nowhere else) — with *play* (synthesised steps at the true microtonal intervals, an ison
  drone) and *tune* (live microphone pitch drawn on the ladder against the nearest step, with the
  distance off). Interval truth is the 1881 Patriarchal Committee system: 72 moria/octave;
  diatonic 12‑10‑8, soft chromatic 8‑14‑8, hard chromatic 6‑20‑4, enharmonic 12‑12‑6.
- **Notation** is a reading course through the neume families — quantity signs, time signs,
  quality signs, martyriai and phthorai — each with parallage examples sung against the ladder.
  Every neume is also a glossary entry linked from hymn scores. End state: the learner reads the
  score of a beginner hymn in parallage unaided.
- **Library** lists hymns. A hymn has one or more **settings**; a setting has a language, a
  score, one or more recordings, and its own mastery state. A hymn page offers *play* (YouTube
  embed, playing in‑page; several per setting), *learn*, *about* (history, where in the service it
  is sung — e.g. Holy Holy Holy during the Anaphora, after "Let us lift up our hearts") and the
  score (linked PDF from the AGES library). Filterable by mode, service, and status.
- Three things cut across every **unit** (a mode's scale, a neume group, a hymn setting):
  - **Tutor**: a context panel. *Notes* are short factoids (may be AI‑drafted, operator‑reviewed).
    *Sources* are verbatim quotations from a real source with author, work and link — required
    for anything historical or narrative, never paraphrased. The two kinds are distinct in the
    data and visibly distinct on the page. Claude finds candidates; the operator accepts.
  - **Practice**: every unit ends in *Practice this* — the same material, reference audio off
    (ison optional), the tuner visible. It shows; it does not score.
  - **Roadmap**: a *Where do I start?* help page, plus implicit signposting — a *Beginner* tag on
    Pl. 4 and the simplest hymns, a next‑step hint at the end of a unit. No gates, streaks,
    points or progress bars.
- **Mastery** is self‑declared per setting against a short checklist on two independent axes:
  *by ear* (from memory, in mode, against the ison) and *by notation* (read from the score in
  parallage). Library shows both. Nothing is judged by the tuner.
- Content is data: adding or removing a hymn, adding a setting, swapping a video or an excerpt
  is a file edit in the repo, reflected on next load. No code changes for content.
- The tuner is one reusable component that takes a *target* (a scale now; a hymn's note
  sequence once `.byz` scores exist).

## Orders and rules

- Mode order on the roadmap: **Pl. 4 → 1 → Pl. 1 → 4** (diatonic), then **2 / Pl. 2**
  (chromatic), then **3 / Grave** (enharmonic).
- Hymn selection rule, in tiers: (1) Divine Liturgy fixed hymns, each in its most common setting;
  (2) the eight Resurrectional apolytikia; (3) fixed Vespers/Orthros pieces, explicitly including
  *Κύριε ἐκέκραξα* in its eight modes. Papadic pieces (Cherubic, Communion) are carried with a
  *not for beginners* tag, not excluded.
- Note names Ni…Zo everywhere. UI English; chant text in the setting's language.
- Greek and English settings of one hymn are different melodies and are stored as different
  settings. Which settings get filled is decided per hymn, later; the app is language‑agnostic.
- The app generates no images. Icons come from an open icon set or the operator.

## Boundaries

Considered and set aside, with the reason:

- **Scored drills** ("sing Ni Pa Vou, pass/fail per note") — the first thing that becomes
  gamification; revisit after weeks of using *tune*.
- **Tuner‑judged mastery** — aligning free‑rhythm singing to a score is a research problem; a
  wrong verdict is worse than none.
- **Record‑and‑compare** — a useful later aid on the practice view, not part of the definition.
- **Interactive `.byz` scores** (Neanes format: render in‑browser, highlight neumes as audio
  plays, tap a neume to hear its step, play the score in synthesised parallage). Planned Library
  upgrade after the initial hymn set exists; the per‑hymn cost is the operator transcribing each
  setting in Neanes. The hymn schema reserves a slot for it from day one.
- **Hosted audio files** — only when the operator has recordings they own or licensed ones;
  YouTube embeds until then. **Never hot‑link** icxc/GOA mp3s.
- **v1's spaced‑repetition scheduler and mode‑recognition quiz** — dropped, not deferred.
- **Accounts, hosting, public launch** — nothing paid for until a second user exists.

## Constraints

- Microphone access requires HTTPS or localhost; this is why the app is static on GitHub Pages
  and not a local server reached over the LAN.
- "Byzantine Tuner" (App Store, E. Lambros) is closed source; nothing is reused. Pitch detection
  is commodity (Web Audio + McLeod/YIN, e.g. `pitchy`); the Byzantine part is a data table we
  own. Open‑source neighbours for UI reference only: ByzanTone (Elm), Byzantine chant studio.
- Score files: GOA Digital Chant Stand (`dcs.goarch.org`) and icxc.pro run the same AGES engine
  and serve the same PDFs at the same `/media/m/<source>/<lang>/…/<b|w>/<name>.pdf` paths.
  **Ingest from icxc** (it exposes stable `data-key`s); **link users to GOA** (the official host).
- Tutor *sources* must be short quotations under a clear citation, or from permissively licensed
  material (Wikipedia is CC BY‑SA), before the app is shared beyond the operator.
- Selecting videos, excerpts and settings is the operator's job. Claude stages candidates.

## Carried over from v1

Only the content layer: `psaltis/ingest.py`, `psaltis/transliterate.py`, their tests under
`tests/`, and `catalogue/` (hymn JSON, `modes.json`, rundowns). Ingest and transliteration stay
Python dev tools that write JSON into the repo; they never run in the app. v1 is archived as
`psaltis-v1`; this repo takes the name `psaltis` once the operator renames the folders.

## First slice

Home + **Scales for Pl. 4** (ladder, play, tune) + **Library for Holy Holy Holy, Pl. 4** (one
setting: play, about, score, a tutor panel with at least one *source*, practice, mastery
checklist). Notation is a tile saying what it will be. Each part thin but working end to end: the
tuner is the technical risk, the hymn page the content‑shape risk.

## Acceptance

- On a phone over the GitHub Pages URL: open Scales → Pl. 4, hear Ni…Ni′ at Committee intervals
  with the ison, hum a step and see the needle land on it.
- Open Library → Holy Holy Holy: video plays without leaving the page; the source quotation shows
  author, work and link; the score opens; both mastery boxes can be ticked and survive a reload.
- Swap the hymn's video by editing one data file and reloading; add a second setting the same
  way; no code touched.
- *Where do I start?* answers the question for someone who has never opened the app.

## Open decisions

Left genuinely unresolved; decide in the work item that needs them, not silently.

1. **GOA media root URL** for score links — verify the exact prefix under `dcs.goarch.org` that
   serves the same `/media/m/…` paths as icxc.
2. **Per‑mode interval tables** — the Committee genera are fixed, but each mode's base note,
   scale span, and standard attractions (ἕλξεις) need writing down; source them from a named
   theory text and cite it as a tutor *source*.
3. **Which setting of Holy Holy Holy** is the first — composer/edition of the Greek Pl. 4
   setting, and which YouTube recording. Operator picks.
4. **What the hymn page's *learn* tab contains before `.byz` scores exist** — phrase list with
   start/end seconds on the embed? Text with stress marks? Just play + score + practice?
5. **Exact mastery checklist items** per axis; the two axes are settled, the wording is not.
6. **Default base frequency** for Ni and whether the ison drone is on by default in practice.
7. **Progress export/import** across browsers — needed once a second device or user appears;
   format unspecified.
8. **Data format** for operator‑owned content (settings, videos, excerpts, about text) — flat
   JSON per hymn, YAML, or Markdown with front matter; must be human‑writable. The icxc‑owned
   fields keep v1's ingested shape.
9. **Icon set** and the app's visual language.
10. **Pitch detector**: McLeod (`pitchy`) vs YIN vs autocorrelation; decide by testing on a
    sung voice with the phone mic.
