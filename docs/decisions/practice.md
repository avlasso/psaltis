# Practice this: the ison default, and where practice lives (item 09)

Decided 2026-09-22 with the operator.

## Ison off by default

In a practice view the reference audio is off and the ison is the one reference allowed. It
starts **off**. The scale page's ison starts off too, so practice does not surprise; a learner
who wants a drone is one tap away, and `ISON_DEFAULT` in `src/components/practice.tsx` is the
whole change if that turns out wrong. Nothing else about open decision 6 moves: the default
Νη stays 261.63 Hz (item 04).

## A route, not a page state

Practice is its own route — `/scales/<mode>/practice`, `/library/<hymn>/<setting>/practice` —
rather than a toggle on the unit page. The back button leaves practice; the video is not on
the page at all, so "off screen or paused" is simply absent; and the unit page keeps its
*Play* and tap-to-hear untouched.

## The hymn's base

Item 09 says "the tuner set to the Pl. 4 scale at the setting's base". A setting has no base
in the content format and no source gives one; the practice view uses the mode's default base
with the ladder's stepper, as the scale page does. A per-setting base is a content claim to
make when a source supports it, not a field to add now.

## The next step

`src/content/next-step.ts`: after a scale, its first hymn in the Library, else the next mode;
after a hymn, the next hymn in the same mode, else the next mode. A mode not yet built is
still linked, titled "Mode N — not yet". With one hymn in the Library, Holy Holy Holy's hint
is "Mode 1 — not yet"; it becomes the second Pl. 4 hymn the moment one is added, with no code.
