# catalogue

Content, as data. One JSON file per hymn under `hymns/`; the app reads these at build time, the
Python tool writes the ingested part. Adding a hymn, a setting or a recording is an edit here,
reflected on the next push. No code changes for content.

## One file, two owners

`hymns/<id>.json` — the id is the icxc `data-key` with its language segment and `.text` dropped
(`eu.lichrysbasil_gr_US_goa|euLI.Key1311.text` → `eu.lichrysbasil.euLI.Key1311`).

- **Everything under `icxc`** is sourced and rewritten by `python -m psaltis ingest`. Do not edit
  it by hand; the next ingest replaces it.
- **Everything at the top level is the operator's** and survives re-ingest (`write_hymn` keeps
  every top-level field it finds). The tool creates `id`, `kind`, `title_gr`, `title_en`,
  `transliteration` with defaults on first ingest; `slug` and `settings` are yours to add.

Why flat JSON in the same file rather than YAML or Markdown with front matter (open decision 8,
decided 2026-09-22): the ingest already preserves top-level fields, so a second file or a second
format would mean a parser and two files to keep in step for no gain at this size; `about` is a
short paragraph, not an essay; and the app's content check reads the same object the ingest
writes. The cost is JSON's quoting for prose. Revisit if the tutor's verbatim quotations (work
item 07) make it painful.

## The operator's part

A hymn the Library lists has a `slug` and a `settings` list. A file without `settings` (the
v1-era apolytikia, the apēchēmata) is not a Library hymn; the app skips it silently.

```jsonc
{
  "id": "eu.lichrysbasil.euLI.Key1311",
  "kind": "hymn",
  "title_gr": "Ἅγιος, ἅγιος, ἅγιος, Κύριος",
  "title_en": "Holy, holy, holy, Lord",
  "slug": "holy-holy-holy",                 // the route: /library/holy-holy-holy
  "transliteration": null,
  "settings": [
    {
      "id": "gr-pl4",                       // stable within the hymn; mastery keys on it
      "language": "gr",                     // "gr" | "en" — Greek and English are different melodies
      "mode": "pl4",                        // a mode id from src/theory/modes.ts
      "label": "Λειτουργικά of Konstantinos Pringos, Pl. 4 — the Patriarchal setting",
      "score": null,                        // a GOA "media/m/…" path, or null when GOA has none
      "recordings": [
        {
          "youtube": "lKMKyT8ItOc",         // the 11-character video id, never a URL
          "singer": "Thrasyvoulos Stanitsas",
          "label": "Pringos's Pl. 4 Liturgika, complete; 21 Dec 1969",
          "start": 200,                     // optional: seconds into a video that holds a whole set
          "end": 260                        // optional
        }
      ],
      "about": "Sung at the Anaphora. The priest says “Let us lift up our hearts” …",
      "byz": null                           // reserved for the Neanes transcription; leave null
    }
  ],
  "icxc": { "…": "written by the ingest" }
}
```

A setting is one melody: a language, a mode, a score, recordings, an *about*. The Greek and the
English of one hymn are different settings. To add a setting, copy a block and change its `id`.

- `score` — usually one of the `icxc.scores[].path` values for this hymn, chosen by the notation
  and edition you want; the app links it on GOA (below). `null` when GOA has nothing suitable —
  the page then says so. Never an icxc URL.
- `recordings` — YouTube only, one embed each, no autoplay. `singer` is required; `label` tells
  recordings apart; `start` / `end` cut a hymn out of a video that holds the whole set of
  Liturgika. May be empty ("No recording yet").
- `about` — where in the service it is sung and what this setting is. Short and plain. Anything
  historical or narrative belongs to the tutor as a *source* (work item 07), not here.

The check: `npm run check:content` (also part of `npm test`) fails on a malformed file and names
the file and field. The Library page shows the same problems in a box and lists the rest.

### Score links: the GOA media root (open decision 1)

The GOA Digital Chant Stand serves the same `media/m/…` paths icxc lists, directly under its
host: `https://dcs.goarch.org/` + `path`. Verified 2026-09-22 with real requests on Barrett,
Dedes and Theodoridis paths (200, `application/pdf`). The exception is icxc's own `en_public`
copies (file names with spaces, e.g. `… (Ages).pdf`): those are not on GOA and must not be used
as a `score`.

## The ingested part

- `icxc.scores[]` — every score icxc lists for the hymn: `source`, `language`, `notation`
  (`byzantine` | `western`), `url`, `path`, the dropdown `label` and the `mode` that label
  names (a set such as the Liturgika exists in several modes). Nothing is downloaded into this
  repo; `path` is where `python -m psaltis ingest` without `--no-media` would put the file under
  `../psaltis-library/icxc/`.
- `icxc.audio[]` — icxc/GOA mp3s, recorded as data only. The app never links or plays them.
- `icxc.mode` — the mode line icxc prints for the hymn, or `null` when it prints none (the
  Anaphora responses, for instance). A setting's mode is the operator's to state.
- `icxc.text_gr` / `text_en` — the chant text the hymn page shows, by the setting's language.
- `icxc.service` — the Library's service filter.

## Also here

- `modes.json` — the eight modes: names, apēchēma syllables, a one-sentence character.
- `rundowns/<id>.md` — a pew-length note per hymn, from v1.
- The v1-era files under `hymns/` still carry `stage`, `melodic_speed`, `phrases`. The app
  ignores them; the ingest no longer writes them. Delete them when you next touch a file.
