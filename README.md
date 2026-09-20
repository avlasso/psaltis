# psaltis

A static web app for learning Byzantine chant properly: first the scale system and the modes,
then the notation, then the Sunday hymns. What it is and where it is going is in
[`docs/destination.md`](docs/destination.md); the work is cut into
[`docs/work-items/`](docs/work-items/).

Live: <https://avlasso.github.io/psaltis/>

## Run locally

```sh
npm install
npm run dev        # http://localhost:5173/psaltis/
npm test           # vitest, once
npm run build      # type-check, then build to dist/
npm run preview    # serve dist/ the way Pages would (mostly — see Deployment)
```

Node 24 (any version that runs Vite 8 works).

The microphone (needed by *tune*, later) works on `localhost` and over HTTPS only. The dev
server on `localhost` is fine; reaching it from a phone over the LAN is not, which is one reason
the app is deployed to Pages early.

## Deployment

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`: it
runs the tests, builds, and publishes `dist/` to GitHub Pages with the official `deploy-pages`
action. There is no other environment.

One-time setup, by hand: in the repo's **Settings → Pages**, set *Source* to **GitHub Actions**.

Two things make deep links work on Pages, and both must agree with the repo name:

- `base: '/psaltis/'` in [`vite.config.ts`](vite.config.ts). Every asset URL and every
  internal link carries this prefix; the router peels it off (see `src/routes.ts`).
- The build copies `index.html` to `404.html`. Pages serves that for any path it has no file
  for, so `…/psaltis/scales` boots the app, which then routes to Scales. (The HTTP status is
  still 404; browsers render it normally.) Hash routing was the alternative; path routing was
  chosen so that URLs read like pages.

If the repo is ever renamed, change `base` and the URL above, nothing else.

## Stack

TypeScript + Vite, with the smallest additions that give routing and components:

- **[Preact](https://preactjs.com/)** (MIT) — components with JSX, ~4 kB. Chosen over Svelte and
  Lit because it needs no compiler plugin (Vite's built-in JSX transform suffices) and its
  testing story is plain (`@testing-library/preact`).
- **[preact-iso](https://github.com/preactjs/preact-iso)** (MIT) — Preact's own router, ~1 kB.
  `src/app.tsx` has the routes; add new pages there.
- **[Lucide](https://lucide.dev/)** (`lucide-preact`, ISC) — the icon set. Every icon in the app,
  including `public/favicon.svg`, comes from it; the app generates no images. ISC (like MIT)
  asks that the copyright notice travel with the code; the minified bundle drops it, so the
  notices for Lucide, Preact and preact-iso ship as `public/licenses.txt`.
- **[Vitest](https://vitest.dev/)** with jsdom — tests live next to the code as `*.test.tsx`.

No backend, no accounts, no analytics, no paid services. Progress will live in the browser
(IndexedDB) when there is progress to keep.

## Layout

- `src/` — the app. `pages/` holds one file per route.
- `catalogue/` — content (hymns, modes, rundowns), arriving with work item 02. Adding a hymn or
  swapping a video is a file edit here; no code changes for content.
- `docs/` — destination and work items.

## Conventions

- Note names are Νη Πα Βου Γα Δη Κε Ζω / Ni Pa Vou Ga Di Ke Zo everywhere. Never Do‑Re‑Mi or
  C‑D‑E in UI text.
- UI language is English; chant text is in the setting's language.
