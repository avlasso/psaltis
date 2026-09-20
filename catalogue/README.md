# catalogue

Content, as data. One JSON file per hymn under `hymns/`; the app reads these, the Python tools
write them.

- `hymns/<id>.json` — the id is the icxc `data-key` with its language segment and `.text`
  dropped (`eu.lichrysbasil_gr_US_goa|euLI.Key1311.text` → `eu.lichrysbasil.euLI.Key1311`).
  Everything under `icxc` is sourced and rewritten by `python -m psaltis ingest`; everything at
  the top level is the operator's and survives re-ingest: `title_gr`, `title_en`,
  `transliteration` (override), any `text_gr` / `text_en` / `mode` correction, and the v1-era
  `stage`, `melodic_speed`, `phrases`, kept until work item 06 settles the operator-owned shape.
- `icxc.scores[]` — every score icxc lists for the hymn: `source`, `language`, `notation`
  (`byzantine` | `western`), `url`, `path`, the dropdown `label` and the `mode` that label
  names (a set such as the Liturgika exists in several modes). Nothing is downloaded into this
  repo; `path` is where `python -m psaltis ingest` without `--no-media` would put the file under
  `../psaltis-library/icxc/`.
- `icxc.audio[]` — icxc/GOA mp3s, recorded as data only. The app never links or plays them.
- `icxc.mode` — the mode line icxc prints for the hymn, or `null` when it prints none (the
  Anaphora responses, for instance). A setting's mode is the operator's to state.
- `modes.json` — the eight modes: names, apēchēma syllables, a one-sentence character.
- `rundowns/<id>.md` — a pew-length note per hymn, from v1.
