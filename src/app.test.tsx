import { render, screen } from '@testing-library/preact';
import { App } from './app';
import { BASE } from './routes';

function renderAt(pathname: string) {
  window.history.replaceState(null, '', pathname);
  return render(<App />);
}

describe('App routing under the Pages base path', () => {
  it('knows the base', () => {
    expect(BASE).toBe('/psaltis');
  });

  it('serves Home at the base, with and without a trailing slash', () => {
    for (const path of ['/psaltis/', '/psaltis']) {
      const { unmount } = renderAt(path);
      expect(screen.getByRole('heading', { level: 1, name: 'psaltis' })).toBeDefined();
      unmount();
    }
  });

  it('serves a deep link below the base', () => {
    renderAt('/psaltis/scales');
    expect(screen.getByRole('heading', { level: 1, name: 'Scales' })).toBeDefined();
  });

  it('serves the lab page, which Home does not link to', () => {
    renderAt('/psaltis/lab/tuner');
    expect(screen.getByRole('heading', { level: 1, name: 'Lab · tuner' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Start mic' })).toBeDefined();
  });

  it('falls back to Not found for unknown routes', () => {
    renderAt('/psaltis/nope');
    expect(screen.getByRole('heading', { level: 1, name: 'Not found' })).toBeDefined();
  });
});
