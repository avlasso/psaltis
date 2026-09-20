import { render, screen } from '@testing-library/preact';
import { Scales } from './scales';
import { ModePage } from './mode';

describe('Scales', () => {
  it('lists the eight modes in roadmap order; only Pl. 4 links, tagged Beginner', () => {
    render(<Scales />);
    const shorts = Array.from(document.querySelectorAll('.mode__short')).map((el) => el.textContent);
    expect(shorts).toEqual(['Pl. 4', '1', 'Pl. 1', '4', '2', 'Pl. 2', '3', 'Grave']);

    const links = screen.getAllByRole('link').filter((a) => a.classList.contains('mode'));
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toContain('Plagal Fourth Mode');
    expect(links[0].getAttribute('href')).toBe('/psaltis/scales/pl4');
    expect(screen.getByText('Beginner')).toBeDefined();
    expect(screen.getAllByText('not yet')).toHaveLength(7);
  });
});

describe('ModePage', () => {
  it('shows the Pl. 4 ladder, play, ison and the source', () => {
    render(<ModePage id="pl4" />);
    expect(screen.getByRole('heading', { level: 1, name: /Pl\. 4/ })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ison off' })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Γα$/ })).toBeDefined();
    expect(screen.getByText(/Panteli/)).toBeDefined();
  });

  it('says not yet for an unsourced mode', () => {
    render(<ModePage id="m1" />);
    expect(screen.getByText(/Not yet/)).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
  });

  it('is Not found for an unknown mode', () => {
    render(<ModePage id="nope" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Not found' })).toBeDefined();
  });
});
