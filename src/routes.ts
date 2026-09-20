/**
 * The app lives under Vite's `base` (`/psaltis/` on GitHub Pages). The router matches
 * on the full pathname, so the outer router in `app.tsx` peels the base off and inner
 * routes are written base-free (`/scales`, `/library/...`). Links, however, must carry
 * the base; use `href()` for every internal link.
 */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(path: '/' | `/${string}`): string {
  return path === '/' ? `${BASE}/` : `${BASE}${path}`;
}
