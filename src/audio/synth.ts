/**
 * Plain Web Audio: oscillators and gain envelopes, nothing sampled or hosted. One `Synth`
 * per page; it makes its AudioContext lazily, inside the first user gesture, because iOS
 * refuses to start audio otherwise.
 */

/** Step indices for playing a scale up and back down without repeating the top. */
export function upAndDown(stepCount: number): number[] {
  const up = Array.from({ length: stepCount }, (_, i) => i);
  return [...up, ...up.slice(0, -1).reverse()];
}

/**
 * A silent WAV. iOS keeps Web Audio under the ring/silent switch until the page has played
 * media; playing this once on the first tap moves the page to the media category, after
 * which the oscillators sound with the switch on silent, like any other media.
 */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAAAAAAAAAAAAAA==';

const ATTACK = 0.02;
const RELEASE = 0.12;
const STEP_GAIN = 0.35;
const ISON_GAIN = 0.16;

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
}

export interface Playback {
  /** Silence everything scheduled by this playback and cancel its callbacks. */
  stop(): void;
}

export class Synth {
  private ctx: AudioContext | null = null;
  private ison: Voice | null = null;
  private media: HTMLAudioElement | null = null;

  private context(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.wakeMedia();
    }
    if (this.ctx.state !== 'running') void this.ctx.resume();
    return this.ctx;
  }

  private wakeMedia(): void {
    if (this.media) return;
    const a = new Audio(SILENT_WAV);
    a.setAttribute('playsinline', '');
    a.preload = 'auto';
    this.media = a;
    a.play().catch(() => {
      // Autoplay policy refused it: we were not in a gesture. The next tap tries again.
      this.media = null;
    });
  }

  /**
   * Create and resume the context now, from inside a tap handler. iOS refuses audio
   * started outside a user gesture; a state change that later starts the ison from an
   * effect is outside it, so the button calls this first.
   */
  unlock(): void {
    this.context();
  }

  private voice(hz: number, type: OscillatorType): Voice {
    const ctx = this.context();
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = hz;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    return { osc, gain };
  }

  /**
   * Play each frequency for `noteSeconds` in turn. `onStep` is told which index is
   * sounding (and `null` at the end) so the ladder can highlight it.
   */
  playSequence(hzs: number[], noteSeconds: number, onStep?: (index: number | null) => void): Playback {
    const ctx = this.context();
    const t0 = ctx.currentTime + 0.05;
    const voices: Voice[] = [];
    const timers: number[] = [];

    hzs.forEach((hz, i) => {
      const start = t0 + i * noteSeconds;
      const end = start + noteSeconds;
      const v = this.voice(hz, 'triangle');
      v.gain.gain.setValueAtTime(0, start);
      v.gain.gain.linearRampToValueAtTime(STEP_GAIN, start + ATTACK);
      v.gain.gain.setValueAtTime(STEP_GAIN, end - RELEASE);
      v.gain.gain.linearRampToValueAtTime(0, end);
      v.osc.start(start);
      v.osc.stop(end + 0.01);
      voices.push(v);
      if (onStep) timers.push(window.setTimeout(() => onStep(i), (start - ctx.currentTime) * 1000));
    });
    if (onStep) {
      timers.push(window.setTimeout(() => onStep(null), (t0 + hzs.length * noteSeconds - ctx.currentTime) * 1000));
    }

    return {
      stop: () => {
        timers.forEach((t) => window.clearTimeout(t));
        const now = ctx.currentTime;
        for (const v of voices) {
          v.gain.gain.cancelScheduledValues(now);
          v.gain.gain.setValueAtTime(v.gain.gain.value, now);
          v.gain.gain.linearRampToValueAtTime(0, now + 0.05);
          try {
            v.osc.stop(now + 0.06);
          } catch {
            // already stopped
          }
        }
        onStep?.(null);
      },
    };
  }

  /** One step on its own, for tapping a rung. */
  playStep(hz: number, seconds = 0.8): Playback {
    return this.playSequence([hz], seconds);
  }

  /** Start (or retune) the drone. Idempotent; a running ison glides to the new pitch. */
  startIson(hz: number): void {
    const ctx = this.context();
    if (this.ison) {
      this.ison.osc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.02);
      return;
    }
    const v = this.voice(hz, 'triangle');
    v.gain.gain.setValueAtTime(0, ctx.currentTime);
    v.gain.gain.linearRampToValueAtTime(ISON_GAIN, ctx.currentTime + 0.3);
    v.osc.start();
    this.ison = v;
  }

  stopIson(): void {
    if (!this.ison || !this.ctx) return;
    const { osc, gain } = this.ison;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.stop(now + 0.35);
    this.ison = null;
  }

  get isonOn(): boolean {
    return this.ison !== null;
  }
}
