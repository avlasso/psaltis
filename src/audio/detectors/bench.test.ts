/**
 * Synthetic benchmark of the detector candidates: accuracy and octave errors under noise,
 * on a voice-like tone and on a glide, and compute time. Skipped in the normal test run;
 * `BENCH=1 npx vitest run bench` prints the tables that `docs/decisions/pitch-detector.md`
 * quotes. Timing is Node's V8, so it says which detector is cheaper, not what the phone does.
 */
import { allDetectors } from './index';

const RATE = 48000;

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff) * 2 - 1;
  };
}

/** A voice-like tone: 8 harmonics, 1/h amplitudes; `fundamental` scales h1 (phone mics thin it). */
function voice(hz: number, n: number, phase = 0, fundamental = 1): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let h = 1; h <= 8; h++) s += ((h === 1 ? fundamental : 1) / h) * Math.sin((2 * Math.PI * hz * h * (i + phase)) / RATE + h);
    out[i] = 0.3 * s;
  }
  return out;
}

function addNoise(frame: Float32Array, snrDb: number, rnd: () => number): Float32Array {
  let power = 0;
  for (const x of frame) power += x * x;
  const signalRms = Math.sqrt(power / frame.length);
  const noiseRms = signalRms / 10 ** (snrDb / 20);
  // Uniform noise has RMS amplitude/√3.
  const amp = noiseRms * Math.SQRT2 * 1.2247;
  const out = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) out[i] = frame[i] + amp * rnd() * 0.5;
  return out;
}

const cents = (got: number, want: number) => 1200 * Math.log2(got / want);

/** Vitest swallows console.table; write a Markdown table straight to stdout. */
function table(title: string, rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0]);
  const lines = [
    '',
    `### ${title}`,
    '',
    `| ${keys.join(' | ')} |`,
    `|${keys.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${keys.map((k) => String(r[k])).join(' | ')} |`),
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

function summarise(errors: number[]) {
  const fine = errors.filter((e) => Math.abs(e) < 600);
  const octave = errors.length - fine.length;
  const mean = fine.reduce((a, b) => a + b, 0) / (fine.length || 1);
  const sd = Math.sqrt(fine.reduce((a, b) => a + (b - mean) ** 2, 0) / (fine.length || 1));
  return { bias: mean.toFixed(1), jitter: sd.toFixed(2), octave: `${octave}/${errors.length}` };
}

describe.skipIf(!process.env.BENCH)('detector bench', () => {
  const detectors = allDetectors();
  const N = 2048;

  it('voice-like tone under noise', () => {
    const rows: Record<string, unknown>[] = [];
    for (const snr of [40, 20, 10]) {
      for (const d of detectors) {
        const rnd = lcg(7);
        const errors: number[] = [];
        for (const hz of [98, 130.8, 174.6, 220, 293.7, 392, 523.3]) {
          for (let k = 0; k < 20; k++) {
            const frame = addNoise(voice(hz, N, k * 311), snr, rnd);
            errors.push(cents(d.detect(frame, RATE).hz, hz));
          }
        }
        rows.push({ snr, detector: d.name, ...summarise(errors) });
      }
    }
    table(expect.getState().currentTestName ?? '', rows);
  });

  it('thin fundamental (phone mic), 20 dB SNR', () => {
    const rows: Record<string, unknown>[] = [];
    for (const fundamental of [0.5, 0.25, 0.1]) {
      for (const d of detectors) {
        const rnd = lcg(11);
        const errors: number[] = [];
        for (const hz of [98, 130.8, 174.6, 220, 293.7]) {
          for (let k = 0; k < 20; k++) {
            const frame = addNoise(voice(hz, N, k * 311, fundamental), 20, rnd);
            errors.push(cents(d.detect(frame, RATE).hz, hz));
          }
        }
        rows.push({ fundamental, detector: d.name, ...summarise(errors) });
      }
    }
    table(expect.getState().currentTestName ?? '', rows);
  });

  it('glide 130→260→130 Hz over 4 s, frames every 33 ms, 20 dB SNR', () => {
    const rows: Record<string, unknown>[] = [];
    const seconds = 4;
    const total = new Float32Array(RATE * seconds);
    let phase = 0;
    for (let i = 0; i < total.length; i++) {
      const t = i / RATE;
      const hz = 130 * 2 ** (t < seconds / 2 ? t / (seconds / 2) : 2 - t / (seconds / 2));
      phase += (2 * Math.PI * hz) / RATE;
      let s = 0;
      for (let h = 1; h <= 8; h++) s += Math.sin(h * phase + h) / h;
      total[i] = 0.3 * s;
    }
    for (const d of detectors) {
      const rnd = lcg(3);
      const errors: number[] = [];
      for (let start = 0; start + N <= total.length; start += Math.round(RATE / 30)) {
        const frame = addNoise(total.subarray(start, start + N), 20, rnd);
        const tMid = (start + N / 2) / RATE;
        const want = 130 * 2 ** (tMid < seconds / 2 ? tMid / (seconds / 2) : 2 - tMid / (seconds / 2));
        errors.push(cents(d.detect(frame, RATE).hz, want));
      }
      rows.push({ detector: d.name, ...summarise(errors) });
    }
    table(expect.getState().currentTestName ?? '', rows);
  });

  it('compute time per frame', () => {
    const rows: Record<string, unknown>[] = [];
    for (const n of [1024, 2048, 4096]) {
      const frame = voice(196, n);
      for (const d of detectors) {
        for (let i = 0; i < 20; i++) d.detect(frame, RATE); // warm up
        const t0 = performance.now();
        const reps = 200;
        for (let i = 0; i < reps; i++) d.detect(frame, RATE);
        rows.push({ frame: n, detector: d.name, ms: ((performance.now() - t0) / reps).toFixed(3) });
      }
    }
    table(expect.getState().currentTestName ?? '', rows);
  });
});
