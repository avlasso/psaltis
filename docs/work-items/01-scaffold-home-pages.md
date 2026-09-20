# 01 — App scaffold, Home, GitHub Pages deploy

## Outcome

A TypeScript + Vite static app in this repo deploys to GitHub Pages on every push to `main` and
opens on a phone over HTTPS. Home is a plain front door: three tiles — Scales, Notation,
Library — and a *Where do I start?* link. The Notation tile says in one sentence what the
section will be (a reading course through the neume families, with parallage examples) and goes
nowhere else. Scales and Library link to placeholder routes.

## Acceptance criteria

- The Pages URL (expected `https://avlasso.github.io/psaltis/`) opens on a phone with the
  padlock; Home shows the three tiles and the *Where do I start?* link.
- A deep link to a sub-route (e.g. `…/psaltis/scales`) reloads on Pages without a 404.
- `npm run build` and `npm test` (a test runner is installed; one trivial test passes) succeed
  locally and in the Actions workflow.
- `README.md` states how to run locally, how deployment works, which framework/router was
  chosen and why, which icon set is used and under what licence, and that content lives in
  `catalogue/` and the app has no backend.

## HITL / AFK

AFK, except: the operator must set the repo's Pages source to **GitHub Actions** once and
confirm the resulting URL.

## Constraints

- No backend, accounts, analytics, or paid services — nothing paid until a second user exists.
- Vite `base` must equal the Pages path (`/psaltis/`) or the deep-link criterion fails. Hash
  routing or a `404.html` copy of `index.html` are both fine; pick one and record it.
- Framework is the item's call (none / Preact / Svelte / Lit …); prefer the smallest thing that
  gives routing and components. The stack the operator settled is TypeScript + Vite, nothing more
  specific.
- **Open decision 9 (icon set) is decided here**: one permissively licensed open icon set. The
  app generates no images.
- Note names are Νη Πα Βου Γα Δη Κε Ζω / Ni Pa Vou Ga Di Ke Zo everywhere; never Do‑Re‑Mi or
  C‑D‑E in UI text. UI language is English.
- Do not bring the Python content layer across here; that is item 02.
