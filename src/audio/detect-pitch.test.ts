import { CLARITY_THRESHOLD, detectPitch, rmsDb } from './detect-pitch';
import { allDetectors } from './detectors';

const RATE = 48000;
const N = 2048;

function sine(hz: number, amplitude = 0.5, rate = RATE, n = N): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * Math.sin((2 * Math.PI * hz * i) / rate);
  return out;
}

/** A crude voice: a fundamental with decaying harmonics, the kind of thing that fools ACF. */
function voiceLike(hz: number, rate = RATE, n = N): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let h = 1; h <= 8; h++) s += Math.sin((2 * Math.PI * hz * h * i) / rate + h) / h;
    out[i] = 0.3 * s;
  }
  return out;
}

function noise(amplitude = 0.3, n = N): Float32Array {
  const out = new Float32Array(n);
  let seed = 12345;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    out[i] = amplitude * ((seed / 0x7fffffff) * 2 - 1);
  }
  return out;
}

describe('detectPitch', () => {
  it('reads a synthetic 220 Hz frame as 220 ± 1 Hz', () => {
    const pitch = detectPitch(sine(220), RATE);
    expect(pitch).not.toBeNull();
    expect(pitch!.hz).toBeGreaterThan(219);
    expect(pitch!.hz).toBeLessThan(221);
    expect(pitch!.clarity).toBeGreaterThanOrEqual(CLARITY_THRESHOLD);
  });

  it('returns null for a silent frame', () => {
    expect(detectPitch(new Float32Array(N), RATE)).toBeNull();
  });

  it('returns null for a frame below the silence gate even if it is periodic', () => {
    expect(detectPitch(sine(220, 0.001), RATE)).toBeNull();
  });

  it('returns null for noise', () => {
    expect(detectPitch(noise(), RATE)).toBeNull();
  });
});

describe('rmsDb', () => {
  it('is -Infinity for silence and about -9 dB for a half-amplitude sine', () => {
    expect(rmsDb(new Float32Array(N))).toBe(-Infinity);
    expect(rmsDb(sine(220, 0.5))).toBeCloseTo(20 * Math.log10(0.5 / Math.SQRT2), 1);
  });
});

describe.each(allDetectors())('$name', (detector) => {
  it.each([110, 220, 261.63, 440, 880])('finds a %s Hz sine within 1 Hz', (hz) => {
    const { hz: got, clarity } = detector.detect(sine(hz), RATE);
    expect(Math.abs(got - hz)).toBeLessThan(1);
    expect(clarity).toBeGreaterThan(0.9);
  });

  it.each([130, 196, 330])('finds the fundamental of a voice-like %s Hz tone, not a harmonic', (hz) => {
    const { hz: got } = detector.detect(voiceLike(hz), RATE);
    expect(Math.abs(got - hz)).toBeLessThan(2);
  });

  it('works at 44.1 kHz and with a 4096 frame', () => {
    expect(Math.abs(detector.detect(sine(220, 0.5, 44100), 44100).hz - 220)).toBeLessThan(1);
    expect(Math.abs(detector.detect(sine(220, 0.5, RATE, 4096), RATE).hz - 220)).toBeLessThan(1);
  });

  it('reports low clarity for noise', () => {
    expect(detector.detect(noise(), RATE).clarity).toBeLessThan(0.9);
  });
});
