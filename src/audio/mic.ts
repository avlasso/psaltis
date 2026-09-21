/**
 * The microphone as a stream of time-domain frames. Like the synth's context, this must
 * be opened from inside a tap handler: iOS will not create a running AudioContext, and
 * may not show the permission prompt, outside a user gesture.
 */
import { makeContext, sharedContext } from './context';

export interface MicOptions {
  /**
   * Leave the phone's voice processing on. Off by default: echo cancellation, noise
   * suppression and automatic gain are tuned for speech calls and distort a sung pitch.
   */
  processing?: boolean;
  /**
   * Open on a context of the mic's own instead of the page's shared one. The lab page
   * does this so the two arrangements can be compared on the phone (`docs/decisions/tuner.md`).
   */
  ownContext?: boolean;
}

export interface Mic {
  readonly context: AudioContext;
  /** True when `context` is the mic's own rather than the page's shared one. */
  readonly ownContext: boolean;
  /** What the browser actually gave us; the lab page shows it. */
  readonly settings: MediaTrackSettings;
  /** False once the stream's track has ended (iOS does this after an interruption). */
  readonly live: boolean;
  /** Copy the most recent `out.length` samples into `out`; false while nothing flows. */
  read(out: Float32Array<ArrayBuffer>): boolean;
  /** Change the frame length without reopening the stream. */
  setFrameSize(size: number): void;
  close(): void;
}

export async function openMic(frameSize: number, options: MicOptions = {}): Promise<Mic> {
  const processing = options.processing ?? false;
  // Take the context first, inside the gesture, then ask for the stream.
  let own = options.ownContext ?? false;
  let context = own ? makeContext() : sharedContext();
  await context.resume();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: processing,
      noiseSuppression: processing,
      autoGainControl: processing,
    },
    video: false,
  });
  const track = stream.getAudioTracks()[0];
  const settings = track.getSettings();

  // iOS has been known to hand out a 44.1 kHz context and a 48 kHz mic; the source node
  // then feeds silence or garbage. If the rates disagree, the mic takes a context of its
  // own at the mic's rate. The shared one is left alone so the ison keeps droning;
  // an own context is rebuilt. resume() may need a further tap, which `read` keeps asking for.
  if (settings.sampleRate && settings.sampleRate !== context.sampleRate) {
    if (own) await context.close();
    context = makeContext(settings.sampleRate);
    own = true;
    await context.resume();
  }

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = frameSize;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);

  return {
    context,
    ownContext: own,
    settings,
    get live() {
      return track.readyState === 'live';
    },
    read(out) {
      if (context.state !== 'running') {
        void context.resume();
        return false;
      }
      analyser.getFloatTimeDomainData(out);
      return true;
    },
    setFrameSize(size) {
      analyser.fftSize = size;
    },
    close() {
      source.disconnect();
      for (const t of stream.getTracks()) t.stop();
      if (own) void context.close();
    },
  };
}
