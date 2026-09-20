/**
 * The microphone as a stream of time-domain frames. Like the synth's context, this must
 * be opened from inside a tap handler: iOS will not create a running AudioContext, and
 * may not show the permission prompt, outside a user gesture.
 */

export interface MicOptions {
  /**
   * Leave the phone's voice processing on. Off by default: echo cancellation, noise
   * suppression and automatic gain are tuned for speech calls and distort a sung pitch.
   */
  processing?: boolean;
}

export interface Mic {
  readonly context: AudioContext;
  /** What the browser actually gave us; the lab page shows it. */
  readonly settings: MediaTrackSettings;
  /** Copy the most recent `out.length` samples into `out`; false while nothing flows. */
  read(out: Float32Array<ArrayBuffer>): boolean;
  /** Change the frame length without reopening the stream. */
  setFrameSize(size: number): void;
  close(): void;
}

function makeContext(sampleRate?: number): AudioContext {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return sampleRate ? new Ctor({ sampleRate }) : new Ctor();
}

export async function openMic(frameSize: number, options: MicOptions = {}): Promise<Mic> {
  const processing = options.processing ?? false;
  // Create the context first, inside the gesture, then ask for the stream.
  let context = makeContext();
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
  // then feeds silence or garbage. If the rates disagree, rebuild the context at the
  // mic's rate; resume() may need a further tap, which `read` keeps asking for.
  if (settings.sampleRate && settings.sampleRate !== context.sampleRate) {
    await context.close();
    context = makeContext(settings.sampleRate);
    await context.resume();
  }

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = frameSize;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);

  return {
    context,
    settings,
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
      void context.close();
    },
  };
}
