/**
 * The page's one AudioContext, shared by the synth and the microphone. iOS flips its
 * audio session to play-and-record when the mic opens, and a context created before that
 * can come back at the wrong hardware rate — the ison detunes or crackles. One context
 * for both sides is the bet that avoids it; `mic.ts` falls back to a second context of
 * its own only when the mic's rate disagrees, so the ison is never torn down mid-drone.
 * Which arrangement behaves better on the phone is the A/B in `docs/decisions/tuner.md`.
 *
 * Like everything Web Audio on iOS, the first call must happen inside a tap handler.
 */

let shared: AudioContext | null = null;

export function makeContext(sampleRate?: number): AudioContext {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return sampleRate ? new Ctor({ sampleRate }) : new Ctor();
}

/** The shared context, created on first use and nudged back to `running` on every call. */
export function sharedContext(): AudioContext {
  if (!shared || shared.state === 'closed') shared = makeContext();
  if (shared.state !== 'running') void shared.resume();
  return shared;
}
