import { ChevronDown, ChevronUp } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { cumulativeMoria, MORIA_PER_OCTAVE } from '../theory/moria';
import { STEP_NAMES } from '../theory/modes';
import { type BaseNote, BASE_MAX_MIDI, BASE_MIN_MIDI } from '../theory/pitch';

/**
 * Where each step sits on the ladder, as a fraction of its height from the bottom
 * (0 = base, 1 = octave). The rungs are spaced by moria, so the 8-moria Βου–Γα gap is
 * visibly narrower than the 12-moria Νη–Πα gap. The tuner (item 05) draws its needle
 * with the same function, so a pitch of *m* moria above the base lands at `m / 72`.
 */
export function stepPositions(intervals: readonly number[]): number[] {
  return cumulativeMoria(intervals).map((m) => m / MORIA_PER_OCTAVE);
}

export interface LadderProps {
  intervals: readonly number[];
  base: BaseNote;
  onBaseChange: (midi: number) => void;
  /** Index of the step currently sounding, if any. */
  activeStep?: number | null;
  onStepTap?: (index: number) => void;
  /** Overlays drawn on the rail (the tuner needle, later). Positioned by `stepPositions`. */
  children?: ComponentChildren;
}

export function Ladder({ intervals, base, onBaseChange, activeStep = null, onStepTap, children }: LadderProps) {
  const positions = stepPositions(intervals);
  const octaveHint = base.hint.replace(/\d+$/, (d) => String(Number(d) + 1));

  return (
    <div class="ladder">
      <div class="ladder__base" role="group" aria-label="Base note">
        <button
          type="button"
          aria-label="Base note down"
          disabled={base.midi <= BASE_MIN_MIDI}
          onClick={() => onBaseChange(base.midi - 1)}
        >
          <ChevronDown aria-hidden="true" />
        </button>
        <span class="ladder__base-label">
          Νη <span class="ladder__hint">{base.hint}</span>
          <span class="ladder__hz">{base.hz.toFixed(1)} Hz</span>
        </span>
        <button
          type="button"
          aria-label="Base note up"
          disabled={base.midi >= BASE_MAX_MIDI}
          onClick={() => onBaseChange(base.midi + 1)}
        >
          <ChevronUp aria-hidden="true" />
        </button>
      </div>

      <div class="ladder__rail">
        {intervals.map((moria, i) => {
          const mid = (positions[i] + positions[i + 1]) / 2;
          return (
            <span key={`m${i}`} class="ladder__moria" style={{ bottom: `${mid * 100}%` }}>
              {moria}
            </span>
          );
        })}
        {positions.map((pos, i) => {
          const isBase = i === 0;
          const isOctave = i === intervals.length;
          return (
            <button
              type="button"
              key={`s${i}`}
              id={`step-${i}`}
              data-step={i}
              class={`ladder__step${activeStep === i ? ' ladder__step--active' : ''}`}
              style={{ bottom: `${pos * 100}%` }}
              onClick={() => onStepTap?.(i)}
            >
              <span class="ladder__rung" aria-hidden="true" />
              <span class="ladder__name">{STEP_NAMES[i]}</span>
              {isBase && <span class="ladder__hint">{base.hint}</span>}
              {isOctave && <span class="ladder__hint">{octaveHint}</span>}
            </button>
          );
        })}
        {children}
      </div>
    </div>
  );
}
