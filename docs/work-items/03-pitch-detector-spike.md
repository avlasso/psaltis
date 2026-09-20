# 03 — Pitch-detector spike: choose the algorithm on a phone mic

## Outcome

Open decision 10 is decided by measurement, not by reading. A `/lab/tuner` route (hidden from
Home) runs two or three detectors side by side on the live mic stream — McLeod via `pitchy`,
YIN, plain autocorrelation — and shows Hz and clarity for each. The operator sings sustained
notes and slides into the phone. The winner, the losers, the buffer size and clarity threshold
settled on, and what the test was are recorded in `docs/decisions/pitch-detector.md`. A
`detectPitch(frame): { hz, clarity } | null` wrapper around the chosen detector remains, with a
unit test.

## Acceptance criteria

- On the phone over the Pages URL: the mic permission prompt appears; once granted, the lab page
  tracks a hummed glide without freezing or stalling.
- On a sustained sung note the chosen detector is stable to roughly ±5 cents at ≥10 updates/s
  on the operator's phone, and octave errors are visibly rarer than the alternatives'. The
  decision doc states what was observed, not just the verdict.
- Unit test: a synthetic 220 Hz frame → 220 ± 1 Hz; a silent frame → `null`.

## HITL / AFK

HITL: the operator must sing into the phone; the agent cannot run this test. Build the lab page
AFK, then hand over with instructions on what to sing and what to look for.

## Constraints

- Web Audio only. `getUserMedia` needs HTTPS, so the test runs on the Pages deployment, not
  over the LAN.
- Byzantine Tuner (App Store, E. Lambros) is closed source; nothing of it is reused or
  reverse-engineered. Pitch detection is commodity; the Byzantine part (item 04) is ours.
- This item outputs Hz, not steps. No ladder here; item 05 maps Hz to the ladder.
- Keep the lab route after the decision; it is the place to look when the detector misbehaves
  later.

## Blockers

- 01 (needs the HTTPS deployment to test a phone mic).
