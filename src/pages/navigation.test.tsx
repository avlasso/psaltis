import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../app';

function renderAt(pathname: string) {
  window.history.replaceState(null, '', pathname);
  return render(<App />);
}

describe('in-app navigation', () => {
  it('reaches the Pl. 4 ladder from the Scales list by clicking', async () => {
    renderAt('/psaltis/scales');
    fireEvent.click(screen.getByRole('link', { name: /Plagal Fourth Mode/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeDefined());
  });

  it('returns to Scales and can open Pl. 4 again', async () => {
    renderAt('/psaltis/scales/pl4');
    fireEvent.click(screen.getByRole('link', { name: 'Scales' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Scales' })).toBeDefined());
    fireEvent.click(screen.getByRole('link', { name: /Plagal Fourth Mode/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeDefined());
  });
});
