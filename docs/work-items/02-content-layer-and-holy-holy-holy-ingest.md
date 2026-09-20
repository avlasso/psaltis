# 02 — Carry over the content layer; ingest Holy Holy Holy (Pl. 4)

## Outcome

`psaltis/ingest.py`, `psaltis/transliterate.py`, their tests and `catalogue/` live in this repo
as Python dev tools. v1's web, scheduler, quiz and db modules do not come across. Running the
ingest against an icxc **Liturgy** page produces `catalogue/hymns/<id>.json` for Holy Holy Holy
(Ἅγιος, ἅγιος, ἅγιος Κύριος Σαβαώθ), mode 8 (Pl. 4), in the v1 `icxc` shape.

## Acceptance criteria

- `pytest` passes here with only `httpx`, `beautifulsoup4`, `lxml` (+ `pytest` dev) as
  dependencies; `fastapi`, `uvicorn`, `jinja2`, `python-multipart`, `markdown` are gone from
  `pyproject.toml`, and `__main__.py` exposes only the ingest command(s).
- The ingest CLI writes the Holy Holy Holy file; a second run leaves operator-owned top-level
  fields untouched (the existing `write_hymn` contract, already under test).
- A Liturgy fixture under `tests/fixtures/` exists; `parse_service_page` on it yields the hymn
  with non-empty `text_gr` and `text_en`, `mode == 8`, and at least one Byzantine-notation entry
  in `scores`.
- `npm run build` does not touch Python; nothing under `psaltis/` is imported by the web app.

## HITL / AFK

AFK.

## Constraints

- Source is `../psaltis-v1/` (archived). Copy; do not symlink; leave v1 untouched.
- Ingest with `media=False`: PDFs and mp3s must not be committed to this repo.
  `config.LIBRARY_DIR` may keep pointing at `../psaltis-library/` for the page cache.
- The Liturgy page may not match the Vespers fixture the parser was written against (Anaphora
  hymns are Euchologion, not Octoechos; the mode line may be absent or fixed). Fix the parser
  under test if so. Do not hand-write the JSON to dodge the parser.
- The icxc `data-key` is the hymn's id. Find the real key on a Liturgy page
  (`/YYYY/MM/DD/liturgy/`, service code `LI`); do not guess it.
- `icxc.audio` entries (icxc/GOA mp3s) are recorded as data but must **never** be linked or
  played from the app.
- The apēchēmata and apolytikia already in `catalogue/hymns/` come across as-is. v1-era top-level
  fields (`stage`, `melodic_speed`, `phrases`) stay for now; item 06 decides the operator-owned
  shape.
