import { ArrowRight } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Synth } from '../audio/synth';
import type { NextStep } from '../content/next-step';
import { href } from '../routes';
import { baseNote, clampBase, DEFAULT_BASE_MIDI } from '../theory/pitch';
import type { TunerTarget } from '../theory/tuning';
import { Ladder } from './ladder';
import { Needle, type NeedleReading, Tuner } from './tuner';

/**
 * *Practice this* (item 09): the ladder with the tuner on and no reference audio — no *Play*,
 * no tap-to-hear, no video. The ison is the one reference allowed, one tap away, and off by
 * default (docs/decisions/practice.md). It shows; it does not score.
 *
 * The page puts the unit's material (a hymn's text) in `children`, above the ladder.
 */

export const ISON_DEFAULT = false;

export interface PracticeProps {
  /** The scale's intervals, taken from mode data so the tuner's fold stays keyed on one array. */
  intervals: number[];
  next: NextStep;
  children?: ComponentChildren;
}

export function Practice({ intervals, next, children }: PracticeProps) {
  const [baseMidi, setBaseMidi] = useState(DEFAULT_BASE_MIDI);
  const [isonOn, setIsonOn] = useState(ISON_DEFAULT);
  const [reading, setReading] = useState<NeedleReading | null>(null);
  const synth = useRef<Synth>();
  const target: TunerTarget = { kind: 'scale', intervals };
  const base = baseNote(baseMidi);

  function getSynth(): Synth {
    synth.current ??= new Synth();
    return synth.current;
  }

  useEffect(() => {
    if (isonOn) getSynth().startIson(base.hz);
    else synth.current?.stopIson();
  }, [isonOn, base.hz]);

  useEffect(() => () => synth.current?.stopIson(), []);

  return (
    <div class="practice">
      {children}

      <div class="controls">
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

      <Tuner target={target} baseHz={base.hz} onReading={setReading} />

      <Ladder intervals={intervals} base={base} onBaseChange={(midi) => setBaseMidi(clampBase(midi))} nearStep={reading?.step ?? null}>
        <Needle reading={reading} />
      </Ladder>

      <p class="hint-text">Sing; the needle follows. Nothing here says right or wrong.</p>

      <p class="next-step">
        Next:{' '}
        <a href={href(next.path)}>
          {next.title}
          <ArrowRight aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
