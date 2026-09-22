import { render, screen } from '@testing-library/preact';
import guide from '/catalogue/guide/where-do-i-start.md?raw';
import { MODES } from '../theory/modes';
import { Start } from './start';

describe('Where do I start?', () => {
  it('answers with the three sections, the path through them and a first step', () => {
    render(<Start />);

    expect(screen.getByRole('heading', { level: 1, name: 'Where do I start?' })).toBeDefined();
    const text = document.body.textContent ?? '';
    for (const section of ['Scales', 'Notation', 'Library']) expect(text).toContain(section);
    expect(text).toContain('scales → notation → hymns');

    const targets = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(targets).toContain('/psaltis/scales/pl4');
    expect(targets).toContain('/psaltis/library/holy-holy-holy');
  });

  it('names the modes in roadmap order, so the page cannot drift from MODES', () => {
    expect(guide).toContain(MODES.map((m) => m.short).join(' → '));
  });

  it('stays about a phone screen long', () => {
    // The item asks for about one screen; this is the guard against it growing into an essay.
    expect(guide.split(/\s+/).length).toBeLessThan(450);
  });
});
