import { act, fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { Ladder } from './ladder';
import { HOLD_MS } from './needle-filter';
import { Needle, type NeedleReading, Tuner } from './tuner';
import { octaveOf } from '../theory/moria';
import type { TunerTarget } from '../theory/tuning';

const RATE = 48000;
const NI = 261.63;
const diatonic = octaveOf('diatonic');
const target: TunerTarget = { kind: 'scale', intervals: diatonic };
const at = (moria: number) => NI * 2 ** (moria / 72);

/** What the fake mic feeds the next frames: a sine at `hz`, or silence. */
let sungHz: number | null = null;
let micLive = true;

vi.mock('../audio/mic', () => ({
  openMic: vi.fn(async (frameSize: number) => ({
    context: { sampleRate: RATE, state: 'running', resume: () => Promise.resolve() },
    ownContext: false,
    settings: { sampleRate: RATE },
    get live() {
      return micLive;
    },
    read(out: Float32Array) {
      if (!micLive) return false;
      for (let i = 0; i < frameSize; i++) out[i] = sungHz ? 0.5 * Math.sin((2 * Math.PI * sungHz * i) / RATE) : 0;
      return true;
    },
    setFrameSize() {},
    close() {},
  })),
}));

// Drive the loop by hand: each `tick` is one animation frame at a chosen time.
let pending: FrameRequestCallback | null = null;
let now = 0;
async function tick(ms = 40) {
  now += ms;
  const cb = pending;
  pending = null;
  await act(async () => {
    cb?.(now);
  });
}
async function ticks(n: number, ms = 40) {
  for (let i = 0; i < n; i++) await tick(ms);
}

function Harness({ base = NI }: { base?: number }) {
  const [reading, setReading] = useState<NeedleReading | null>(null);
  return (
    <>
      <Tuner target={target} baseHz={base} onReading={setReading} />
      <Ladder intervals={diatonic} base={{ midi: 60, hz: base, hint: 'C4' }} onBaseChange={() => {}} nearStep={reading?.step ?? null}>
        <Needle reading={reading} />
      </Ladder>
    </>
  );
}

const readout = () => document.querySelector('.tuner__readout')?.textContent ?? null;
const needle = () => document.querySelector<HTMLElement>('.ladder__needle');

beforeEach(() => {
  sungHz = null;
  micLive = true;
  pending = null;
  now = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => vi.unstubAllGlobals());

describe('Tuner', () => {
  it('is off until tapped, then listens', async () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Tune off' })).toBeDefined();
    expect(needle()).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tune off' }));
    });
    expect(screen.getByRole('button', { name: 'Tune on' })).toBeDefined();
    await tick();
    expect(readout()).toMatch(/Listening/);
    expect(needle()).toBeNull();
  });

  it('lands the needle on Πα reading 0 for a sung Πα; underlines Πα', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tune off' }));
    });
    sungHz = at(12);
    await ticks(3);
    expect(readout()).toBe('Πα0');
    expect(needle()).not.toBeNull();
    expect(parseFloat(needle()!.style.bottom)).toBeCloseTo((12 / 72) * 100, 0);
    expect(document.querySelector('#step-1')!.classList.contains('ladder__step--near')).toBe(true);
    expect(document.querySelector('#step-0')!.classList.contains('ladder__step--near')).toBe(false);
  });

  it('reads a sharp Γα as Γα +2 and a flat Νη an octave down as Νη −2 below the base', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tune off' }));
    });
    sungHz = at(32);
    await ticks(3);
    expect(readout()).toBe('Γα+2');

    // A gap resets the filter so the next note is taken as it is.
    sungHz = null;
    await ticks(2, HOLD_MS);
    sungHz = at(-2 - 72);
    await ticks(3);
    expect(readout()).toBe('Νη−2');
    expect(parseFloat(needle()!.style.bottom)).toBeCloseTo((-2 / 72) * 100, 0);
  });

  it('greys the needle through silence, then hides it; never snaps to a rung', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tune off' }));
    });
    sungHz = at(54);
    await ticks(3);
    expect(readout()).toBe('Κε0');
    sungHz = null;
    await tick(100);
    expect(needle()!.classList.contains('ladder__needle--stale')).toBe(true);
    expect(readout()).toBe('Κε0');
    await tick(HOLD_MS);
    expect(needle()).toBeNull();
    expect(readout()).toMatch(/Listening/);
  });

  it('offers Tap to resume when frames stop flowing, and resumes on the tap', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tune off' }));
    });
    sungHz = at(0);
    await ticks(2);
    micLive = false;
    await tick();
    expect(screen.getByRole('button', { name: 'Tap to resume' })).toBeDefined();
    micLive = true;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tap to resume' }));
    });
    await ticks(3);
    expect(screen.queryByRole('button', { name: 'Tap to resume' })).toBeNull();
    expect(readout()).toBe('Νη0');
  });

  it('turning off clears the needle', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tune off' }));
    });
    sungHz = at(22);
    await ticks(3);
    expect(needle()).not.toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tune on' }));
    });
    expect(needle()).toBeNull();
    expect(screen.getByRole('button', { name: 'Tune off' })).toBeDefined();
  });
});
