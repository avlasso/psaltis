# Pitch detector: McLeod (pitchy), 2048-sample frames, −60 dBFS gate, clarity ≥ 0.9

Decided 2026-09-20. Closes the destination's open decision 10 and work item 03.

## Decision

`src/audio/detect-pitch.ts` wraps **McLeod's pitch method as implemented by `pitchy` 4.1.0**
(MIT, ~3 kB). Constants, all in that file:

| Constant | Value | Meaning |
|---|---|---|
| `FRAME_SIZE` | 2048 samples | 43 ms at the phone's 48 kHz |
| `SILENCE_DB` | −60 dBFS (RMS) | quieter frames are silence; no detector runs |
| `CLARITY_THRESHOLD` | 0.9 | less clear estimates are discarded |

The wrapper is per-frame and stateless: `detectPitch(frame, sampleRate) → { hz, clarity } | null`.
No smoothing; the tuner component (item 05) decides what to draw between frames.

The losers stay in `src/audio/detectors/` because `/lab/tuner` keeps running all three; only the
wrapper names the winner.

## What was tested

Two halves, because neither alone could decide.

### On the phone (operator, iPhone, Safari, Pages URL)

`/lab/tuner` fed the same analyser frames to McLeod (`pitchy`), an in-house YIN and an in-house
ACF2+ autocorrelation at ~30 updates/s, and showed Hz, clarity, one-second jitter in cents,
octave flips and compute time per detector over a six-second trace. Phone voice processing
(echo cancellation, noise suppression, AGC) was off.

Observed:

- The mic permission prompt appeared; the page tracked hummed glides without stalling.
- On sustained sung notes all three read **5–10 ¢ jitter**, and the three traces lay on top of
  each other so closely the operator could not tell the colours apart. The voice test therefore
  did not separate the candidates.
- Two slow round trips up an octave and back: the trace followed the glide; YIN and ACF counted
  no flips; McLeod counted one. (That counter, at the time, counted any octave-sized jump between
  consecutive frames; it now requires the jump to return within 500 ms, so a sung leap no longer
  counts. The single McLeod blip stands as observed.)
- The original −50 dBFS gate cut off quiet singing with AGC off; the operator asked for more
  sensitivity. −60 dBFS holds a soft note; a slider on the lab page finds the floor for any room.
- The operator did not need to move the clarity slider from 0.9.

Not captured: the phone's actual updates/s and per-detector compute ms (the operator did not
note them). The page did not stall visibly, which with three detectors running is the bound
that matters; the wrapper runs one.

### Synthetic bench (`BENCH=1 npx vitest run src/audio/detectors/bench.test.ts`)

Voice-like tones (8 harmonics, 1/h amplitudes), 2048-sample frames at 48 kHz, uniform noise at
the stated SNR, 20 frames per pitch. *bias* and *jitter* are mean and standard deviation of the
error in cents over frames without an octave error; *octave* counts errors ≥ 600 ¢.

Seven pitches 98–523 Hz:

| SNR | detector | bias ¢ | jitter ¢ | octave |
|---|---|---|---|---|
| 40 dB | McLeod | 0.0 | 0.02 | 0/140 |
| 40 dB | YIN | 0.0 | 0.02 | 0/140 |
| 40 dB | Autocorrelation | 1.2 | 1.16 | 0/140 |
| 20 dB | McLeod | 0.0 | 0.13 | 0/140 |
| 20 dB | YIN | 0.0 | 0.21 | 0/140 |
| 20 dB | Autocorrelation | 1.2 | 1.16 | 0/140 |
| 10 dB | McLeod | −0.1 | 1.27 | 0/140 |
| 10 dB | YIN | 0.5 | 2.17 | 0/140 |
| 10 dB | Autocorrelation | 1.2 | 1.58 | 0/140 |

Thin fundamental (h1 scaled down, as a phone mic's high-pass does), 98–294 Hz, 20 dB SNR:

| h1 scale | detector | bias ¢ | jitter ¢ | octave |
|---|---|---|---|---|
| 0.5 | McLeod | 0.0 | 0.09 | 0/100 |
| 0.5 | YIN | 0.0 | 0.13 | 0/100 |
| 0.5 | Autocorrelation | 0.8 | 1.01 | 0/100 |
| 0.1 | McLeod | 0.0 | 0.07 | 0/100 |
| 0.1 | YIN | 0.0 | 0.11 | 0/100 |
| 0.1 | Autocorrelation | 0.6 | 0.86 | 0/100 |

Glide 130 → 260 → 130 Hz over 4 s, a frame every 33 ms, 20 dB SNR:

| detector | bias ¢ | jitter ¢ | octave |
|---|---|---|---|
| McLeod | 0.1 | 0.58 | 0/119 |
| YIN | 0.0 | 4.76 | 0/119 |
| Autocorrelation | 1.4 | 1.20 | 0/119 |

Compute time per frame (Node/V8 on the dev machine; relative, not the phone):

| frame | McLeod | YIN | Autocorrelation |
|---|---|---|---|
| 1024 | 0.13 ms | 0.32 ms | 0.46 ms |
| 2048 | 0.24 ms | 0.89 ms | 1.44 ms |
| 4096 | 0.51 ms | 1.79 ms | 3.26 ms |

## Why McLeod

- Most accurate in every synthetic scenario; the only one under 1 ¢ jitter on the glide.
- 4–6× cheaper than the in-house alternatives (FFT-based NSDF versus O(N·lag) loops), which
  leaves the most room on the phone for the ladder and the ison.
- On the phone it was indistinguishable from the others, so nothing observed argues against it.
- One dependency, MIT, three kilobytes, maintained.

Against it: the one octave flip on the phone glide, which neither alternative showed. One event in
roughly 240 accepted frames, counted by a counter that could not tell a flip from a leap. Item 05
will show whether it matters on the ladder; the lab's counter now measures it properly.

## Why not the others

- **YIN** (in-house): accurate on steady tones but wobbles on a glide (4.8 ¢) — its first-dip
  rule is unhappy with a non-stationary frame. Nearly 4× the cost. Would have saved the
  dependency; not worth the wobble.
- **Autocorrelation** (in-house ACF2+): a constant +1 ¢ bias and ~1 ¢ jitter from parabolic
  interpolation on an un-normalised correlation; 6× the cost. The baseline did its job by losing.

## Frame, gate, clarity

- **2048.** 1024 halves the latency but the lowest reliable pitch rises to ~94 Hz and jitter
  roughly doubles at low SNR; 4096 gains nothing measurable on a steady note and smears a glide.
  The lab keeps all three selectable.
- **−60 dBFS.** Set by the operator's report that −50 dropped quiet singing with AGC off. Rooms
  differ; the lab's slider is where to check a new one.
- **0.9.** pitchy's documented range is 0.8–1; the operator did not need to lower it. If item 05
  finds soft or breathy notes dropping out, the lab shows what clarity they reach.

## Acceptance against item 03

- Mic prompt, glide tracking without stalling on the phone: **met**.
- ±5 ¢ at ≥ 10 updates/s on a sustained note: the observed 5–10 ¢ is the voice (synthetic
  detector jitter is 0.1 ¢ at 20 dB SNR); the page ran three detectors at a 30/s target without
  visible stalling. **Met as far as the voice allows; the phone's exact rate was not written down.**
- Octave errors visibly rarer than the alternatives': **not shown** — the alternatives showed
  none either, and McLeod showed one. Decided on accuracy and cost instead; documented above.
- Unit tests (220 Hz → 220 ± 1; silence → `null`): **met**, `src/audio/detect-pitch.test.ts`.

## Reopen if

Item 05's needle flips octaves on real notes, or soft notes go dark at 0.9. Both are measured on
`/lab/tuner` before anything is changed; the bench is rerun if a detector is changed.
