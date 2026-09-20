import { render, screen } from '@testing-library/preact';
import { Home } from './home';

describe('Home', () => {
  it('shows the three section tiles and the start link', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Scales' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Notation' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Library' })).toBeDefined();

    const links = screen.getAllByRole('link').map((a) => a.textContent?.trim());
    expect(links).toContain('Where do I start?');
    // Notation is a description only; it goes nowhere yet.
    expect(links.some((t) => t?.startsWith('Notation'))).toBe(false);
  });
});
