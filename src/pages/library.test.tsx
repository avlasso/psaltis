import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../app';
import { Library } from './library';

function renderAt(pathname: string) {
  window.history.replaceState(null, '', pathname);
  return render(<App />);
}

describe('Library', () => {
  it('lists Holy Holy Holy and filters by mode, service and status', () => {
    render(<Library />);
    expect(screen.getByRole('link', { name: /Holy, holy, holy/ })).toBeDefined();

    const [mode, service, status] = screen.getAllByRole('combobox');
    fireEvent.change(mode, { target: { value: 'pl4' } });
    fireEvent.change(service, { target: { value: 'Liturgy' } });
    fireEvent.change(status, { target: { value: 'not started' } });
    expect(screen.getByRole('link', { name: /Holy, holy, holy/ })).toBeDefined();

    fireEvent.change(status, { target: { value: 'declared' } });
    expect(screen.queryByRole('link', { name: /Holy, holy, holy/ })).toBeNull();
    expect(screen.getByText('No hymn matches these filters.')).toBeDefined();
  });

  it('opens the hymn page with play, about and the score', async () => {
    renderAt('/psaltis/library');
    fireEvent.click(screen.getByRole('link', { name: /Holy, holy, holy/ }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Holy, holy, holy, Lord' })).toBeDefined());

    // One embed per recording, none autoplaying, all from the no-cookie host.
    const frames = document.querySelectorAll('iframe');
    expect(frames.length).toBeGreaterThan(0);
    for (const f of frames) {
      expect(f.src.startsWith('https://www.youtube-nocookie.com/embed/')).toBe(true);
      expect(f.src).not.toContain('autoplay');
    }

    // The score opens on GOA, never on icxc.
    const score = screen.getByRole('link', { name: /Open the PDF on GOA/ }) as HTMLAnchorElement;
    expect(score.href.startsWith('https://dcs.goarch.org/media/m/')).toBe(true);
    expect(document.body.innerHTML).not.toContain('icxc.pro');

    expect(screen.getAllByRole('heading', { level: 3, name: 'About' }).length).toBeGreaterThan(0);
  });

  it('tags Holy Holy Holy as Beginner in the list and on its page', async () => {
    render(<Library />);
    expect(screen.getByText('Beginner')).toBeDefined();

    renderAt('/psaltis/library/holy-holy-holy');
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Holy, holy, holy, Lord' })).toBeDefined());
    expect(screen.getAllByText('Beginner').length).toBeGreaterThan(0);
  });

  it('404s an unknown hymn', async () => {
    renderAt('/psaltis/library/no-such-hymn');
    await waitFor(() => expect(screen.queryByRole('heading', { level: 1, name: 'Holy, holy, holy, Lord' })).toBeNull());
    expect(screen.queryByRole('link', { name: /Open the PDF on GOA/ })).toBeNull();
  });
});
