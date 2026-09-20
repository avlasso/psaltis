# 06 — Library: Holy Holy Holy (Pl. 4) with *play*, *about*, score — and the content format

## Outcome

Open decision 8 is decided: operator-owned content per hymn lives in a human-writable file (the
item chooses among flat JSON, YAML, or Markdown with front matter and records why in
`catalogue/README.md`). A hymn has `settings[]`; a setting has an `id`, `language`, a `score`
reference (into the ingested `icxc.scores` or a GOA path), `recordings[]` (YouTube video ids,
each with singer/label), an `about` text, and a reserved `byz: null` slot. `/library` lists hymns
filterable by mode, service and status. `/library/<hymn>` shows the settings, *play* (YouTube
embed playing in-page, one per recording), *about* (history; where in the service — for Holy Holy
Holy: the Anaphora, after "Let us lift up our hearts"), and the score link, which opens the PDF
on GOA. Open decision 1 (GOA media root) is decided here too.

## Acceptance criteria

- On the phone: Library → Holy Holy Holy; the video plays without leaving the page; *about* reads
  correctly; tapping the score opens the PDF from `dcs.goarch.org`, not icxc.
- Change the video id in the data file, rebuild/reload: the new video plays. No code touched.
- Add a second setting (any language) by copying the block: it appears with its own play/about/
  score. No code touched.
- Library filters by mode (Pl. 4), service (Liturgy), and status (before item 08 lands, "not
  started" is the only value and the filter still works).
- A content check (`npm run check:content` or a test) fails loudly on a malformed hymn file and
  names the offending field.
- `catalogue/README.md` documents the format with the Holy Holy Holy file as the example.

## HITL / AFK

HITL for **open decision 3**: the operator picks the composer/edition of the Greek Pl. 4 setting
and the YouTube recording. Claude stages two or three candidates (video id, singer, edition,
one line on why) and the operator accepts one. The operator also confirms the GOA score URL
opens in a browser.

## Constraints

- Ingest from icxc; link users to GOA. The ingested `icxc.scores[].path` looks like
  `media/m/<source>/<lang>/…/<b|w>/<name>.pdf`; find the `dcs.goarch.org` prefix that serves the
  same path, verify it with a real request, and keep it as one constant. If no GOA URL serves it,
  fall back to no link — never to icxc's `/api/file?path=` in the app.
- **Never** link or play `icxc.audio` mp3s. YouTube embeds are the only audio until the operator
  owns or licenses recordings.
- The YouTube iframe embed must play in-page on iOS Safari and Android Chrome. No autoplay.
- Greek and English settings of one hymn are different melodies and are different settings.
  The first setting is Greek Pl. 4. Chant text in the setting's language; UI English.
- The operator-owned file must survive re-ingest: the Python tool rewrites only the `icxc` block
  and preserves top-level fields (`write_hymn`); the new shape must be consistent with that, as
  a separate file or as the preserved top level — the item decides.
- The app may read content at build time or fetch JSON from the deployed site; either way,
  "reflected on next load" after a push must hold.
- **Open decision 4 (the *learn* tab) is not decided here.** Show *play*, *about*, score; leave a
  *learn* slot that says what it will be, or omit the tab. Do not invent phrase timings.
- Filters are mode, service, status — no more. Status derives from item 08's mastery state.

## Blockers

- 01, 02.
