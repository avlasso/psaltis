import { fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { Ladder, stepPositions } from './ladder';
import { octaveOf } from '../theory/moria';
import { baseNote, clampBase, DEFAULT_BASE_MIDI } from '../theory/pitch';

const diatonic = octaveOf('diatonic');

/** The faint Western hint on step `i`, or null when it has none. */
function hintOf(i: number): string | null {
  return document.querySelector(`#step-${i} .ladder__hint`)?.textContent ?? null;
}

function Harness() {
  const [midi, setMidi] = useState(DEFAULT_BASE_MIDI);
  return <Ladder intervals={diatonic} base={baseNote(midi)} onBaseChange={(m) => setMidi(clampBase(m))} />;
}

describe('Ladder', () => {
  it('positions steps by moria: Γα at 30/72 of the height', () => {
    const p = stepPositions(diatonic);
    expect(p[0]).toBe(0);
    expect(p[3]).toBeCloseTo(30 / 72, 9);
    expect(p[7]).toBe(1);
  });

  it('shows Νη…Νη′ with the moria between and the faint hint at the base', () => {
    render(<Harness />);
    const steps = ['Νη', 'Πα', 'Βου', 'Γα', 'Δη', 'Κε', 'Ζω', 'Νη′'];
    const names = Array.from(document.querySelectorAll('.ladder__name')).map((el) => el.textContent);
    expect(names).toEqual(steps);
    const moria = Array.from(document.querySelectorAll('.ladder__moria')).map((el) => el.textContent);
    expect(moria).toEqual(['12', '10', '8', '12', '12', '10', '8']);
    expect(hintOf(0)).toBe('C4');
    expect(hintOf(7)).toBe('C5');
  });

  it('moving the base re-labels the hint; the moria stay', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Base note down' }));
    fireEvent.click(screen.getByRole('button', { name: 'Base note down' }));
    expect(hintOf(0)).toBe('B♭3');
    const moria = Array.from(document.querySelectorAll('.ladder__moria')).map((el) => el.textContent);
    expect(moria).toEqual(['12', '10', '8', '12', '12', '10', '8']);
  });

  it('stops at the ends of the range', () => {
    render(<Harness />);
    const down = screen.getByRole('button', { name: 'Base note down' }) as HTMLButtonElement;
    for (let i = 0; i < 10; i++) fireEvent.click(down);
    expect(hintOf(0)).toBe('G3');
    expect(down.disabled).toBe(true);
  });
});
