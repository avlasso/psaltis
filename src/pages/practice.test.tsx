import { fireEvent, render, screen } from '@testing-library/preact';
import { HymnPractice, ModePractice } from './practice';

// jsdom has no AudioContext; the ison toggle only needs a synth that accepts the calls.
vi.mock('../audio/synth', () => ({
  Synth: class {
    unlock() {}
    startIson() {}
    stopIson() {}
  },
}));

describe('ModePractice', () => {
  it('shows the Pl. 4 ladder, the tuner and the ison, but no Play', () => {
    render(<ModePractice id="pl4" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Practice Pl. 4' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tune off' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ison off' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
    expect(screen.getByRole('button', { name: /^Γα$/ })).toBeDefined();
  });

  it('toggles the ison in one tap', () => {
    render(<ModePractice id="pl4" />);
    fireEvent.click(screen.getByRole('button', { name: 'Ison off' }));
    expect(screen.getByRole('button', { name: 'Ison on' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('ends with the next step: Holy Holy Holy', () => {
    render(<ModePractice id="pl4" />);
    const next = screen.getByRole('link', { name: /Holy, holy, holy, Lord/ });
    expect(next.getAttribute('href')).toBe('/psaltis/library/holy-holy-holy');
  });

  it('is Not found for an unsourced mode', () => {
    render(<ModePractice id="m1" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Not found' })).toBeDefined();
  });
});

describe('HymnPractice', () => {
  it('shows the Greek text, the tuner on the Pl. 4 ladder, and no video', () => {
    const { container } = render(<HymnPractice slug="holy-holy-holy" setting="gr-pl4" />);
    expect(screen.getByRole('heading', { level: 1, name: /Practice Holy/ })).toBeDefined();
    expect(container.querySelector('.setting__text[lang="el"]')?.textContent).toMatch(/Ἅγιος/);
    expect(screen.getByRole('button', { name: 'Tune off' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ison off' })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Γα$/ })).toBeDefined();
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
  });

  it('ends with the placeholder next step while there is no second Pl. 4 hymn', () => {
    render(<HymnPractice slug="holy-holy-holy" setting="gr-pl4" />);
    expect(screen.getByRole('link', { name: /Mode 1 — not yet/ }).getAttribute('href')).toBe('/psaltis/scales/m1');
  });

  it('is Not found for an unknown setting', () => {
    render(<HymnPractice slug="holy-holy-holy" setting="nope" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Not found' })).toBeDefined();
  });
});
