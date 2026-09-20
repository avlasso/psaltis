import { ArrowLeft, Mic as MicIcon, MicOff, Play, Square } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CLARITY_THRESHOLD, FRAME_SIZE, rmsDb, SILENCE_DB } from '../../audio/detect-pitch';
import { allDetectors, type Detector } from '../../audio/detectors';
import { type Mic, openMic } from '../../audio/mic';
import { Synth } from '../../audio/synth';
import { href } from '../../routes';

/**
 * `/lab/tuner` — the pitch-detector bench. Not linked from Home. Runs every candidate on
 * the same mic frames and shows what each makes of them, so that the choice in
 * `docs/decisions/pitch-detector.md` rests on a sung voice through the phone, not on a
 * paper. Outputs Hz only; the ladder is item 05's business.
 */

const FRAME_SIZES = [1024, 2048, 4096];
const UPDATES_PER_SECOND = 30;
const TRACE_SECONDS = 6;
const JITTER_WINDOW_MS = 1000;
const TRACE_MIN_HZ = 70;
const TRACE_MAX_HZ = 1200;
const COLOURS = ['#c0392b', '#2471a3', '#1e8449'];
/** Νη at the app's default base; a tone the operator has heard on the ladder. */
const DEFAULT_REFERENCE_HZ = 261.63;

interface Sample {
  t: number;
  /** Cents above A4 = 440 Hz; an absolute pitch axis for jitter and flips. */
  cents: number;
}

interface Stats {
  hz: number;
  clarity: number;
  accepted: boolean;
  /** Distance from the nearest equal-tempered semitone, signed, in cents. */
  offCents: number | null;
  /** Standard deviation in cents over the last second of accepted frames. */
  jitter: number | null;
  octaveFlips: number;
  lastMs: number;
  maxMs: number;
  recent: Sample[];
  trace: Sample[];
}

function freshStats(): Stats {
  return {
    hz: 0,
    clarity: 0,
    accepted: false,
    offCents: null,
    jitter: null,
    octaveFlips: 0,
    lastMs: 0,
    maxMs: 0,
    recent: [],
    trace: [],
  };
}

function centsAboveA4(hz: number): number {
  return 1200 * Math.log2(hz / 440);
}

function stdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function LabTuner() {
  const detectors = useRef<Detector[]>(allDetectors());
  const stats = useRef<Stats[]>(detectors.current.map(freshStats));
  const mic = useRef<Mic | null>(null);
  const synth = useRef<Synth>();
  const frame = useRef(new Float32Array(FRAME_SIZE));
  const raf = useRef(0);
  const lastTick = useRef(0);
  const tickTimes = useRef<number[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameSize, setFrameSize] = useState(FRAME_SIZE);
  const [threshold, setThreshold] = useState(CLARITY_THRESHOLD);
  const [processing, setProcessing] = useState(false);
  const [referenceHz, setReferenceHz] = useState(DEFAULT_REFERENCE_HZ);
  const [referenceOn, setReferenceOn] = useState(false);
  const [level, setLevel] = useState(-Infinity);
  const [rate, setRate] = useState(0);
  const [, setTick] = useState(0);

  // Live values the rAF loop reads without re-subscribing.
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const referenceRef = useRef<number | null>(null);
  referenceRef.current = referenceOn ? referenceHz : null;

  function loop(now: number) {
    raf.current = requestAnimationFrame(loop);
    const m = mic.current;
    if (!m) return;
    if (now - lastTick.current < 1000 / UPDATES_PER_SECOND) return;
    lastTick.current = now;
    if (!m.read(frame.current)) return;

    const sampleRate = m.context.sampleRate;
    const db = rmsDb(frame.current);
    const silent = db < SILENCE_DB;
    const clarityFloor = thresholdRef.current;

    detectors.current.forEach((d, i) => {
      const s = stats.current[i];
      const t0 = performance.now();
      const { hz, clarity } = d.detect(frame.current, sampleRate);
      s.lastMs = performance.now() - t0;
      s.maxMs = Math.max(s.maxMs, s.lastMs);
      s.hz = hz;
      s.clarity = clarity;
      // The same gate as detectPitch: silence first, then clarity.
      s.accepted = !silent && hz > 0 && clarity >= clarityFloor;

      if (s.accepted) {
        const cents = centsAboveA4(hz);
        const offCents = cents - Math.round(cents / 100) * 100;
        s.offCents = offCents;
        const previous = s.recent[s.recent.length - 1];
        if (previous && now - previous.t < 500) {
          const jump = Math.abs(cents - previous.cents);
          // A jump within a semitone of an octave (or two) is an octave error, not a leap.
          if (Math.abs(jump - 1200) < 100 || Math.abs(jump - 2400) < 100) s.octaveFlips++;
        }
        s.recent.push({ t: now, cents });
        s.trace.push({ t: now, cents });
      } else {
        s.offCents = null;
      }
      while (s.recent.length && now - s.recent[0].t > JITTER_WINDOW_MS) s.recent.shift();
      while (s.trace.length && now - s.trace[0].t > TRACE_SECONDS * 1000) s.trace.shift();
      s.jitter = s.recent.length >= 5 ? stdDev(s.recent.map((r) => r.cents)) : null;
    });

    tickTimes.current.push(now);
    while (tickTimes.current.length && now - tickTimes.current[0] > 1000) tickTimes.current.shift();
    setRate(tickTimes.current.length);
    setLevel(db);
    draw(now);
    setTick((n) => n + 1);
  }

  function draw(now: number) {
    const el = canvas.current;
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (el.width !== w * dpr || el.height !== h * dpr) {
      el.width = w * dpr;
      el.height = h * dpr;
    }
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const lo = Math.log2(TRACE_MIN_HZ);
    const hi = Math.log2(TRACE_MAX_HZ);
    const y = (hz: number) => h - ((Math.log2(hz) - lo) / (hi - lo)) * h;
    const x = (t: number) => w - ((now - t) / (TRACE_SECONDS * 1000)) * w;

    // Octave lines, so a flip is visible as a jump between them.
    ctx.strokeStyle = 'rgba(128,128,128,0.3)';
    ctx.lineWidth = 1;
    for (let hz = 110; hz < TRACE_MAX_HZ; hz *= 2) {
      ctx.beginPath();
      ctx.moveTo(0, y(hz));
      ctx.lineTo(w, y(hz));
      ctx.stroke();
    }

    const reference = referenceRef.current;
    if (reference) {
      ctx.strokeStyle = 'rgba(128,128,128,0.8)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y(reference));
      ctx.lineTo(w, y(reference));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    stats.current.forEach((s, i) => {
      ctx.fillStyle = COLOURS[i];
      for (const p of s.trace) {
        const hz = 440 * 2 ** (p.cents / 1200);
        if (hz < TRACE_MIN_HZ || hz > TRACE_MAX_HZ) continue;
        ctx.fillRect(x(p.t) - 1, y(hz) - 1, 2.5, 2.5);
      }
    });
  }

  async function start(withProcessing = processing) {
    setError(null);
    try {
      // openMic makes its AudioContext synchronously, inside this tap.
      const m = await openMic(frameSize, { processing: withProcessing });
      mic.current?.close();
      mic.current = m;
      frame.current = new Float32Array(frameSize);
      setRunning(true);
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    } catch (e) {
      setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      setRunning(false);
    }
  }

  function stop() {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    mic.current?.close();
    mic.current = null;
    setRunning(false);
    setRate(0);
    setLevel(-Infinity);
  }

  function reset() {
    stats.current = detectors.current.map(freshStats);
    setTick((n) => n + 1);
  }

  function changeFrameSize(size: number) {
    setFrameSize(size);
    frame.current = new Float32Array(size);
    mic.current?.setFrameSize(size);
    reset();
  }

  function changeProcessing(on: boolean) {
    setProcessing(on);
    // Constraints are fixed at getUserMedia time; reopen if we are running.
    if (mic.current) void start(on);
  }

  function getSynth(): Synth {
    synth.current ??= new Synth();
    return synth.current;
  }

  function toggleReference() {
    if (referenceOn) {
      getSynth().stopIson();
      setReferenceOn(false);
    } else {
      getSynth().unlock();
      getSynth().startIson(referenceHz);
      setReferenceOn(true);
    }
  }

  useEffect(() => {
    if (referenceOn) synth.current?.startIson(referenceHz);
  }, [referenceHz, referenceOn]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      mic.current?.close();
      synth.current?.stopIson();
    },
    [],
  );

  const m = mic.current;
  const settings = m?.settings;

  return (
    <main class="page lab">
      <a class="back" href={href('/')}>
        <ArrowLeft aria-hidden="true" />
        Home
      </a>
      <h1>Lab · tuner</h1>
      <p class="lede">
        Three pitch detectors on the same microphone frames. Sing a steady note, then slide. Which one
        holds still, which one jumps an octave?
      </p>

      <div class="controls">
        <button type="button" class="control control--primary" onClick={() => (running ? stop() : void start())}>
          {running ? <MicOff aria-hidden="true" /> : <MicIcon aria-hidden="true" />}
          {running ? 'Stop mic' : 'Start mic'}
        </button>
        <button type="button" class={`control${referenceOn ? ' control--on' : ''}`} aria-pressed={referenceOn} onClick={toggleReference}>
          {referenceOn ? <Square aria-hidden="true" /> : <Play aria-hidden="true" />}
          Reference tone
        </button>
        <label class="lab__field">
          Hz
          <input
            type="number"
            min={TRACE_MIN_HZ}
            max={TRACE_MAX_HZ}
            step="0.01"
            value={referenceHz}
            onChange={(e) => setReferenceHz(Number((e.currentTarget as HTMLInputElement).value) || DEFAULT_REFERENCE_HZ)}
          />
        </label>
      </div>

      {error && <p class="lab__error">{error}</p>}

      <canvas ref={canvas} class="lab__trace" aria-label={`Pitch over the last ${TRACE_SECONDS} seconds`} />

      <div class="lab__cards">
        {detectors.current.map((d, i) => {
          const s = stats.current[i];
          return (
            <section key={d.name} class={`lab__card${s.accepted ? '' : ' lab__card--muted'}`} style={{ borderColor: COLOURS[i] }}>
              <h2 style={{ color: COLOURS[i] }}>{d.name}</h2>
              <p class="lab__hz">
                {running && s.hz > 0 ? s.hz.toFixed(1) : '—'} <small>Hz</small>
                {s.offCents !== null && (
                  <span class="lab__cents">
                    {s.offCents >= 0 ? '+' : '−'}
                    {Math.abs(s.offCents).toFixed(0)}¢
                  </span>
                )}
              </p>
              <dl class="lab__stats">
                <dt>clarity</dt>
                <dd>{running ? s.clarity.toFixed(3) : '—'}</dd>
                <dt>jitter (1 s)</dt>
                <dd>{s.jitter !== null ? `±${s.jitter.toFixed(1)}¢` : '—'}</dd>
                <dt>octave flips</dt>
                <dd>{s.octaveFlips}</dd>
                <dt>compute</dt>
                <dd>{running ? `${s.lastMs.toFixed(1)} / ${s.maxMs.toFixed(1)} ms` : '—'}</dd>
              </dl>
            </section>
          );
        })}
      </div>

      <div class="controls lab__settings">
        <label class="lab__field">
          Frame
          <select value={frameSize} onChange={(e) => changeFrameSize(Number((e.currentTarget as HTMLSelectElement).value))}>
            {FRAME_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label class="lab__field lab__field--wide">
          Clarity ≥ {threshold.toFixed(2)}
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={threshold}
            onInput={(e) => setThreshold(Number((e.currentTarget as HTMLInputElement).value))}
          />
        </label>
        <label class="lab__field">
          <input type="checkbox" checked={processing} onChange={(e) => changeProcessing((e.currentTarget as HTMLInputElement).checked)} />
          phone voice processing
        </label>
        <button type="button" class="control" onClick={reset}>
          Reset counters
        </button>
      </div>

      <dl class="lab__stats lab__system">
        <dt>level</dt>
        <dd>{Number.isFinite(level) ? `${level.toFixed(0)} dBFS` : '—'} (gate {SILENCE_DB})</dd>
        <dt>updates</dt>
        <dd>{running ? `${rate}/s (target ${UPDATES_PER_SECOND})` : '—'}</dd>
        <dt>sample rate</dt>
        <dd>{m ? `${m.context.sampleRate} Hz (context, ${m.context.state})` : '—'}</dd>
        <dt>mic reports</dt>
        <dd>
          {settings
            ? `${settings.sampleRate ?? '?'} Hz · echo ${String(settings.echoCancellation ?? '?')} · noise ${String(settings.noiseSuppression ?? '?')} · agc ${String(settings.autoGainControl ?? '?')}`
            : '—'}
        </dd>
        <dt>frame</dt>
        <dd>{m ? `${frameSize} samples = ${((1000 * frameSize) / m.context.sampleRate).toFixed(0)} ms` : `${frameSize} samples`}</dd>
      </dl>

      <section class="lab__how">
        <h2>What to do</h2>
        <ol>
          <li>Start the mic; allow the permission. In silence every card should read — (gated).</li>
          <li>
            Reference tone: play it, hold the phone a hand away from its own speaker. Each card should read the
            Hz in the box, ±1.
          </li>
          <li>
            Sing a comfortable note on <i>ah</i> for five seconds. Watch <b>jitter</b>: ±5¢ or better is the target.
          </li>
          <li>
            Slide slowly up an octave and down. The trace should be one continuous line per colour; a dot that
            jumps to a parallel line is an octave flip, and the counter says how many.
          </li>
          <li>Try the same at frame 1024 and 4096; try a hum with the mouth closed; try a low note.</li>
        </ol>
      </section>
    </main>
  );
}
