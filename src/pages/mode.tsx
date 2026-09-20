import { ArrowLeft, Play, Square } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { type Playback, Synth, upAndDown } from '../audio/synth';
import { Ladder } from '../components/ladder';
import { type Mode, modeById } from '../theory/modes';
import { frequencyOf } from '../theory/moria';
import { baseNote, clampBase, DEFAULT_BASE_MIDI } from '../theory/pitch';
import { href } from '../routes';
import { NotFound } from './not-found';

const NOTE_SECONDS = 0.6;

/** `/scales/:id` — a mode's ladder with *play* and the ison. */
export function ModePage({ id }: { id?: string }) {
  const mode = id ? modeById(id) : undefined;
  if (!mode) return <NotFound />;

  const back = (
    <a class="back" href={href('/scales')}>
      <ArrowLeft aria-hidden="true" />
      Scales
    </a>
  );

  if (mode.partial || !mode.intervals) {
    return (
      <main class="page">
        {back}
        <h1>{mode.short}</h1>
        <p class="lede">
          {mode.nameEn} · {mode.nameGr}
        </p>
        <p>Not yet. This mode's table has not been sourced from a theory text.</p>
      </main>
    );
  }

  return <ModeLadder mode={mode} intervals={mode.intervals} back={back} />;
}

/** The working page; a separate component so its hooks never follow a conditional return. */
function ModeLadder({ mode, intervals, back }: { mode: Mode; intervals: number[]; back: ComponentChildren }) {
  const [baseMidi, setBaseMidi] = useState(DEFAULT_BASE_MIDI);
  const [isonOn, setIsonOn] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const synth = useRef<Synth>();
  const playback = useRef<Playback | null>(null);
  const base = baseNote(baseMidi);

  function getSynth(): Synth {
    synth.current ??= new Synth();
    return synth.current;
  }

  // The ison follows the base; nothing sounds until a tap has created the context.
  useEffect(() => {
    if (isonOn) getSynth().startIson(base.hz);
    else synth.current?.stopIson();
  }, [isonOn, base.hz]);

  // Leaving the page silences everything.
  useEffect(
    () => () => {
      playback.current?.stop();
      synth.current?.stopIson();
    },
    [],
  );

  function stop() {
    playback.current?.stop();
    playback.current = null;
    setPlaying(false);
  }

  function play() {
    stop();
    const steps = upAndDown(intervals.length + 1);
    const hzs = steps.map((step) => frequencyOf(step, base.hz, intervals));
    setPlaying(true);
    // The callback indexes the sequence; the ladder wants the step, which repeats on the way down.
    playback.current = getSynth().playSequence(hzs, NOTE_SECONDS, (i) => {
      setActiveStep(i === null ? null : steps[i]);
      if (i === null) setPlaying(false);
    });
  }

  function tapStep(step: number) {
    stop();
    getSynth().playStep(frequencyOf(step, base.hz, intervals));
    setActiveStep(step);
    window.setTimeout(() => setActiveStep((s) => (s === step ? null : s)), 700);
  }

  return (
    <main class="page mode-page">
      {back}
      <h1>
        {mode.short} <span class="mode__gr">{mode.nameGr}</span>
      </h1>
      <p class="lede">
        {mode.nameEn} · {mode.genus} · {intervals.join('‑')} = 72 moria
      </p>

      <div class="controls">
        <button type="button" class="control control--primary" onClick={playing ? stop : play}>
          {playing ? <Square aria-hidden="true" /> : <Play aria-hidden="true" />}
          {playing ? 'Stop' : 'Play'}
        </button>
        <button
          type="button"
          class={`control${isonOn ? ' control--on' : ''}`}
          aria-pressed={isonOn}
          onClick={() => {
            getSynth().unlock();
            setIsonOn((on) => !on);
          }}
        >
          Ison {isonOn ? 'on' : 'off'}
        </button>
      </div>

      <Ladder
        intervals={intervals}
        base={base}
        onBaseChange={(midi) => setBaseMidi(clampBase(midi))}
        activeStep={activeStep}
        onStepTap={tapStep}
      />

      <p class="hint-text">Tap a step to hear it. Moria between steps; the base moves, the moria stay.</p>

      <section class="sources" aria-label="Sources">
        <h2>Intervals from</h2>
        {mode.sources.map((s) => (
          <p key={s.link} class="source">
            <q>{s.quote}</q>
            <br />
            <span class="source__cite">
              {s.author}, <a href={s.link}>{s.work}</a>
              {s.where ? `, ${s.where}` : ''}
            </span>
          </p>
        ))}
        {mode.attractions === null && (
          <p class="hint-text">Attractions (ἕλξεις) are not recorded yet; the cited text does not give them.</p>
        )}
      </section>
    </main>
  );
}
