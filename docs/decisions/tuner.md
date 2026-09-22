# Tuner: needle, fold, readout, and how mic and ison share audio

Decided 2026-09-20 in the grilling for work item 05. The item fixed the shape (one reusable
`Tuner` taking a target, emitting `{ hz, step, offsetMoria, clarity }`, a reserved `NoteSequence`);
this records what it left open and why each went the way it did.

## Where things live

| Piece | File | Does |
|---|---|---|
| `locate`, `fold`, `nearestStep`, `TunerTarget`, `NoteSequence` | `src/theory/tuning.ts` | the arithmetic; no audio, unit-tested with synthetic Hz |
| `NeedleFilter` | `src/components/needle-filter.ts` | what the needle does between frames |
| `Tuner`, `Needle` | `src/components/tuner.tsx` | owns the mic and the loop; the *Tune* toggle, readout, tap-to-resume; the needle the page drops into `Ladder` |
| shared `AudioContext` | `src/audio/context.ts` | one context for synth and mic |

`Tuner` does not render the ladder. The page owns the ladder (base stepper, tap-to-play) and
places `<Needle reading>` in its `children` slot, passing `reading.step` as `nearStep`. A hymn's
note-sequence target will draw its reading differently (a highlighted neume), and the tuner
should not know either way.

## Needle between frames

`detectPitch` is stateless at ~30 frames/s; a sung note jitters ±0.5 morion and every breath
returns `null`. Drawn raw, the needle shivers and blinks.

- **Exponential average**, time constant 100 ms (three frames), on the folded position, taken
  the short way round the octave so a frame across the seam cannot drag the needle over the
  ladder.
- **Reset after a gap**: the first frame after 400 ms of nothing is taken as it is, so the
  needle never glides in from its old place.
- **Stale hold**: on `null` the needle stays put and greys; after 400 ms it hides and the readout
  says *Listening*. It never snaps to a rung.
- The 60 ms CSS transition on `bottom` is cosmetic; the numbers are the filter's.

Rejected: a 5-frame median (kills a one-frame octave blip, adds ~80 ms lag — folding already
makes an exact-octave blip invisible).

## Octave folding

The ladder shows one octave, Νη at 0 to Νη′ at 72 moria. A pitch anywhere is reduced mod 72, so
a voice an octave below the ladder lands on the right rung. The fold window must be exactly 72
wide, so the only choice is where its seam sits:

- **Chosen: seam midway between the last step and the octave** — [−4, 68) on the diatonic
  ladder, `foldLow = −(last interval)/2` in general. A slightly flat Νη sits just below its rung,
  labelled Νη −2. Νη′ is never a landing target: sing it and the needle reads Νη at the base.
  Sliding up past Ζω +4 jumps to the bottom.
- Rejected: seam at the base ([0, 72)). A flat Νη — the commonest thing a beginner sings against
  the ison — would appear at the *top* as Νη′ −2, then jump to the bottom as they correct.
- Deferred: a sticky octave that follows a continuous slide past Ζω up to Νη′ and re-folds after
  a gap. It would let a sharp Νη′ show above the top rung, at the cost of "the same note reads
  at a different rung depending on whether you paused". The rail already has an unmarked margin
  past each end rung (6 moria; `.ladder__rail::before/::after`) so this is a change to `fold`
  and the filter only. Revisit if the top rung is missed.

Documented behaviour, as the legend under the readout says: *Νη′ reads as Νη: the ladder shows
one octave.*

## Readout: "off by N moria"

- A fixed line beside the *Tune* button, large: step name and signed whole moria, `Πα +2`.
  `+` is sharp (above the rung), `−` flat, `0` within half a morion. Rounded from the smoothed
  value; the needle keeps the fraction.
- The nearest rung is underlined (`ladder__step--near`), distinct from *play*'s accent, so both
  can show while the ison drones.
- Nothing changes colour with distance: no in-tune band, no verdict. It shows; it does not
  score.
- Cents, raw Hz, clarity, frames/s and the audio arrangement appear only with `?debug` on the
  page URL.

Rejected for now: a tag riding beside the needle (two moving numbers is noise) and one-decimal
moria (reads as precision a voice does not have).

## Mic and ison on iOS: one context or two

The hazard with two contexts: opening the mic flips the iOS audio session to play-and-record,
and a context created before that can come back at the wrong hardware rate — the ison detunes
or crackles. The hazard with one: `mic.ts` used to close and rebuild its context when the
mic's rate disagreed, which would kill the ison mid-drone.

- **Default: one shared context** (`sharedContext()`), taken by `Synth` and `openMic` alike,
  created inside the first tap.
- **Fallback on rate mismatch**: the mic takes a second context of its own at the mic's rate and
  leaves the shared one alone. The ison keeps droning; the debug line says *mic on its own
  context*.
- **The A/B is built in**: the mode page is the one-context arm (ison + *Tune*); `/lab/tuner`
  passes `ownContext: true` and is the two-context arm (reference tone + mic). Compare on the
  phone; switching the default is one line in `openMic`.

### The phone's verdict (2026-09-22)

The one-context arm holds: on the mode page the ison stayed clean when the mic opened. The
tuner itself was judged effective by a chanter better than the operator, singing against the
ladder. The shared context stays the default. Not recorded: whether the mismatch fallback was
ever taken (the `?debug` line was not read), and whether the earpiece routing differed from the
two-context lab arm — neither mattered in use, so neither is chased.

## Tap-to-resume

A reloaded page, a call, or the phone sleeping leaves the context `interrupted` (iOS) or
`suspended`. The loop notices frames not flowing and replaces the readout with *Tap to resume*,
which calls `resume()` inside that tap — or reopens the mic if iOS ended its track. Coming back
to the foreground tries a quiet `resume()` first. Never a blank needle with no way out.

## Not touched

- The earpiece routing and volume drop while the mic is open; the ison gain is as it was.
- The ring/silent switch muting the synth (`synth.ts`; accepted).
- `detectPitch` and its constants (`docs/decisions/pitch-detector.md`). If the needle flips
  octaves on real notes or soft notes go dark, reopen item 03 there, not here.
