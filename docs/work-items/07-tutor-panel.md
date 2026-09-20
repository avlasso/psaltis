# 07 — Tutor panel: notes and sources, on the hymn page and the scale page

## Outcome

Every unit page (the Pl. 4 scale, the Holy Holy Holy setting) has a *Tutor* context panel with
two visibly distinct kinds of entry. *Notes* are short factoids. *Sources* are verbatim quotations
with author, work and link — required for anything historical or narrative. The two are distinct
in the data (separate types, not a flag on one type). Holy Holy Holy carries at least one
*source*; Pl. 4 carries the theory-text citation from item 04 as a *source*.

## Acceptance criteria

- On the hymn page the source quotation shows author, work and a link that resolves; it is
  styled unmistakably as a quotation, and notes unmistakably not.
- On the Pl. 4 page the interval table's source appears the same way.
- The content check rejects a *source* missing any of quote/author/work/link, and a *note*
  longer than a short paragraph (pick a limit, e.g. 400 characters, and record it).
- Adding a note or a source is a data-file edit; no code touched.

## HITL / AFK

HITL: Claude drafts note candidates and finds source quotations; the operator accepts each
before it is committed. Nothing goes in unreviewed.

## Constraints

- Sources are verbatim — never paraphrased, never cut mid-sentence without an ellipsis. Short
  quotations under a clear citation, or permissively licensed text (Wikipedia is CC BY‑SA and
  needs the attribution the licence asks for). This is the precondition for sharing the app;
  keep to it from the first entry.
- Notes may be AI-drafted; they are marked as notes even when accurate. Anything historical or
  narrative is a source or it is not there.
- Tutor data lives where item 06 put the operator-owned hymn content, and beside the `modes`
  module for scales. Do not create a third place.
- The panel is one component; it takes a unit id and renders whatever that unit's data carries.

## Blockers

- 04, 06.
