import { Mic as MicIcon, MicOff, RefreshCw } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { detectPitch, FRAME_SIZE } from '../audio/detect-pitch';
import { type Mic, openMic } from '../audio/mic';
import { STEP_NAMES } from '../theory/modes';
import { MORIA_PER_OCTAVE, moriaToCents } from '../theory/moria';
import { fold, intervalsOf, locateMoria, moriaAbove, type Reading, type TunerTarget } from '../theory/tuning';
import { NeedleFilter } from './needle-filter';

/**
 * The tuner: one reusable component that takes a *target* and emits readings. It owns
 * the microphone and the detection loop, renders the *Tune* toggle and the readout, and
 * knows nothing about how a reading is drawn — the page puts a `Needle` on its ladder
 * (or, once `.byz` scores exist, highlights a neume). Item 05; reused by item 09.
 *
 * It shows; it does not score. Nothing here says right or wrong.
 */

const UPDATES_PER_SECOND = 30;

/** A reading as the needle wants it: smoothed, and marked stale through a gap. */
export interface NeedleReading extends Reading {
  stale: boolean;
}

export type TunerStatus = 'off' | 'starting' | 'on' | 'interrupted' | 'error';

export interface TunerProps {
  target: TunerTarget;
  baseHz: number;
  /** Called on every frame while on, and once with `null` when the tuner goes off. */
  onReading?: (reading: NeedleReading | null) => void;
  /** Cents, raw Hz, clarity, rate and the audio arrangement; `?debug` on the page. */
  debug?: boolean;
}

export function Tuner({ target, baseHz, onReading, debug = false }: TunerProps) {
  const mic = useRef<Mic | null>(null);
  const frame = useRef(new Float32Array(FRAME_SIZE));
  const raf = useRef(0);
  const lastTick = useRef(0);
  const tickTimes = useRef<number[]>([]);
  const filter = useRef<NeedleFilter | null>(null);
  const lastPitch = useRef<{ hz: number; clarity: number } | null>(null);

  const [status, setStatus] = useState<TunerStatus>('off');
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<NeedleReading | null>(null);
  const [rate, setRate] = useState(0);
  const [raw, setRaw] = useState<{ hz: number; clarity: number } | null>(null);

  // Live values the loop reads without re-subscribing.
  const targetRef = useRef(target);
  const baseRef = useRef(baseHz);
  const onReadingRef = useRef(onReading);
  const statusRef = useRef(status);
  const debugRef = useRef(debug);
  targetRef.current = target;
  baseRef.current = baseHz;
  onReadingRef.current = onReading;
  statusRef.current = status;
  debugRef.current = debug;

  // A new target (a different mode's ladder) needs a fold of its own. Keyed on the
  // intervals array, which mode data holds stable, not on the target literal a page
  // may rebuild every render.
  const intervals = intervalsOf(target);
  useEffect(() => {
    filter.current = new NeedleFilter((m) => fold(m, intervals));
  }, [intervals]);

  function emit(next: NeedleReading | null) {
    setReading(next);
    onReadingRef.current?.(next);
  }

  function loop(now: number) {
    raf.current = requestAnimationFrame(loop);
    const m = mic.current;
    const f = filter.current;
    if (!m || !f) return;
    if (now - lastTick.current < 1000 / UPDATES_PER_SECOND) return;
    lastTick.current = now;

    if (!m.read(frame.current)) {
      // The context is not running: iOS interrupted it (a call, a reload, the phone
      // going to sleep) or the track ended. Say so; the next tap resumes it.
      if (statusRef.current === 'on') setStatus('interrupted');
      return;
    }
    if (statusRef.current === 'interrupted') setStatus('on');

    const pitch = detectPitch(frame.current, m.context.sampleRate);
    const state = f.push(pitch ? fold(moriaAbove(pitch.hz, baseRef.current), intervalsOf(targetRef.current)) : null, now);
    if (pitch) lastPitch.current = pitch;

    if (state) {
      // A stale reading carries the last detected Hz and clarity.
      const last = lastPitch.current ?? { hz: 0, clarity: 0 };
      emit({ ...locateMoria(state.moria, targetRef.current, last.hz, last.clarity), stale: state.stale });
    } else {
      emit(null);
    }

    if (debugRef.current) {
      setRaw(pitch);
      tickTimes.current.push(now);
      while (tickTimes.current.length && now - tickTimes.current[0] > 1000) tickTimes.current.shift();
      setRate(tickTimes.current.length);
    }
  }

  async function start() {
    setError(null);
    setStatus('starting');
    try {
      // openMic takes its context synchronously, inside this tap.
      const m = await openMic(FRAME_SIZE);
      mic.current?.close();
      mic.current = m;
      filter.current?.reset();
      setStatus('on');
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    } catch (e) {
      setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      setStatus('error');
    }
  }

  function stop() {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    mic.current?.close();
    mic.current = null;
    filter.current?.reset();
    lastPitch.current = null;
    setStatus('off');
    setRate(0);
    setRaw(null);
    emit(null);
  }

  /** Inside a tap: resume the context, or reopen the mic if iOS ended its track. */
  function resume() {
    const m = mic.current;
    if (!m || !m.live) {
      void start();
      return;
    }
    void m.context.resume().then(() => setStatus('on'));
  }

  // Coming back to the foreground: try to resume quietly; the loop reports if it fails.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && mic.current) void mic.current.context.resume();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Leaving the page closes the mic.
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      mic.current?.close();
      onReadingRef.current?.(null);
    },
    [],
  );

  const on = status !== 'off' && status !== 'error';
  const m = mic.current;

  return (
    <div class="tuner">
      <div class="tuner__row">
        <button
          type="button"
          class={`control${on ? ' control--on' : ''}`}
          aria-pressed={on}
          onClick={on ? stop : () => void start()}
        >
          {on ? <MicOff aria-hidden="true" /> : <MicIcon aria-hidden="true" />}
          Tune {on ? 'on' : 'off'}
        </button>

        {status === 'interrupted' ? (
          <button type="button" class="control control--primary" onClick={resume}>
            <RefreshCw aria-hidden="true" />
            Tap to resume
          </button>
        ) : (
          <Readout status={status} reading={reading} />
        )}
      </div>

      {status === 'error' && <p class="tuner__error">Microphone not available: {error}</p>}
      {on && <p class="hint-text tuner__legend">+ is sharp, − is flat, in moria. Νη′ reads as Νη: the ladder shows one octave.</p>}

      {debug && on && (
        <p class="tuner__debug">
          {raw ? `${raw.hz.toFixed(1)} Hz · clarity ${raw.clarity.toFixed(3)}` : 'no pitch'}
          {reading && ` · ${moriaToCents(reading.offsetMoria) >= 0 ? '+' : '−'}${Math.abs(moriaToCents(reading.offsetMoria)).toFixed(0)}¢`}
          {` · ${rate}/s`}
          {m && ` · ${m.context.sampleRate} Hz ${m.context.state}, ${m.ownContext ? 'mic on its own context' : 'shared context'}`}
          {m && ` · mic ${m.settings.sampleRate ?? '?'} Hz`}
        </p>
      )}
    </div>
  );
}

/** Step name and signed whole moria; `0` within half a morion; dimmed while stale. */
function Readout({ status, reading }: { status: TunerStatus; reading: NeedleReading | null }) {
  if (status === 'off' || status === 'error') return <span class="tuner__readout tuner__readout--idle" aria-live="off" />;
  if (status === 'starting') return <span class="tuner__readout tuner__readout--idle">Opening the mic…</span>;
  if (!reading) return <span class="tuner__readout tuner__readout--idle">Listening — hum a note</span>;
  const off = Math.round(reading.offsetMoria);
  const sign = off > 0 ? '+' : off < 0 ? '−' : '';
  return (
    <span class={`tuner__readout${reading.stale ? ' tuner__readout--stale' : ''}`} data-step={reading.step}>
      <span class="tuner__step">{STEP_NAMES[reading.step]}</span>
      <span class="tuner__offset">
        {sign}
        {Math.abs(off)}
      </span>
    </span>
  );
}

/**
 * The needle: a marker across the ladder's rail at the reading's folded moria, placed by
 * the same rule as the rungs (`m / 72` of the rail's height), so it can sit a little
 * below the base when the voice is flat of Νη. Drop it into `Ladder`'s children.
 */
export function Needle({ reading }: { reading: NeedleReading | null }) {
  if (!reading) return null;
  return (
    <span
      class={`ladder__needle${reading.stale ? ' ladder__needle--stale' : ''}`}
      style={{ bottom: `${(reading.moria / MORIA_PER_OCTAVE) * 100}%` }}
      aria-hidden="true"
    />
  );
}
