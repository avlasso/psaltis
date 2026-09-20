# 09 — *Practice this* on the scale page and the hymn page

## Outcome

Each unit ends in a *Practice this* view: the same material with the reference audio off, the
ison optional, and the tuner visible. On Pl. 4 that is the ladder with the tuner on and no step
playback (ison toggle available). On Holy Holy Holy it is the setting's text with the tuner set
to the Pl. 4 scale at the setting's base, ison optional, the video not playing. Each practice
view ends with a *next-step* hint to the next unit on the roadmap.

## Acceptance criteria

- On the phone: from the Pl. 4 page tap *Practice this* → ladder + live needle, no reference tone
  unless the ison is toggled on.
- From Holy Holy Holy → text + needle against the Pl. 4 ladder; the video is off screen or
  paused; the ison toggle works.
- No score, verdict or count appears anywhere in a practice view.
- Each practice view ends with a next-step hint (Pl. 4 → Holy Holy Holy; Holy Holy Holy → the
  next Pl. 4 hymn if one exists, otherwise a "Mode 1 — not yet" placeholder).

## HITL / AFK

AFK; the operator tries it on the phone.

## Constraints

- It shows; it does not score. Record-and-compare is a stated later aid, not part of this.
- **The ison-default half of open decision 6 is decided here**: on or off by default in practice.
  Pick one, make it a one-tap toggle, record the choice and why.
- Reuses the ladder and `Tuner` from items 04/05 unchanged; if they need a new prop, add it
  there, not here.
- The hymn practice target is the scale — a `.byz` note sequence does not exist yet. Do not
  fake a note sequence from the text.

## Blockers

- 05, 06.
