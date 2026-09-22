# Which setting of Holy Holy Holy (open decision 3)

Work item 06, staged 2026-09-22. The format (open decision 8) and the GOA root (open decision 1)
are recorded in [`catalogue/README.md`](../../catalogue/README.md); this is the operator's pick.

## What GOA has

icxc/GOA lists eleven scores for Ἅγιος, ἅγιος, ἅγιος (`icxc.scores` in the hymn file). Only
one is Greek in Byzantine notation, and it is not Pl. 4: R. Barrett's *Mode 4 "Kliton"*
Liturgika (Ἦχος Δʹ Δι). The Pl. 4 scores are all English, western notation: S. Dedes's *simple*
and *HC* settings, and AGES's copy of the latter (not served by GOA). So the Greek Pl. 4 setting
has **no score on GOA** and the page says so; the English Dedes *simple* setting has one and is
staged as a second setting so the score link is exercised.

## The Greek Pl. 4 setting: the proposal

Konstantinos Pringos's Λειτουργικά in Pl. 4 — the Patriarchal set, the everyday Sunday
Liturgika in Greek parishes, and what a beginner will hear most. Staged as `settings[0]`
(`gr-pl4`) with three recordings for the operator to hear on the phone and choose from:

| id | singer | what it is | why / caveat |
|---|---|---|---|
| `lKMKyT8ItOc` | Thrasyvoulos Stanitsas | Pringos's Pl. 4 Liturgika, complete, 7:13. St Demetrios, Ampelokipoi, 21 Dec 1969; text from Nikolaidis's *Ἀνθολογία Λειτουργικῶν* (1967) | The reference performance — Pringos's own Lampadarios and successor. Old live recording; needs `start`/`end` seconds for the Holy Holy Holy. |
| `v5-6-viKfpg` | Hieromonk Romanos (Anastasiadis) | Pringos's Pl. 4 Liturgika, complete, 7:45. Prophet Elias monastery, Roustika, Crete | Clean modern recording, solo voice, the whole set with the priest's exclamations — a learner hears where the hymn sits. Needs `start`/`end`. |
| `Lansp2heYCs` | Dimitrios Matziris | Holy Holy Holy alone, Pl. 4, 2022, 1:19 | Only the hymn; no start time needed. The composition is not stated in the title — check by ear that it is Pringos's, else relabel or drop. |

Not staged: Basil-Liturgy settings (long, papadic — not a beginner hymn); the Pl. 4 sets of
Stanitsas, Karamanis, Theophanes Vatopedinos and others (real alternatives if Pringos is not
wanted; say so and they are a search away).

## To do on the phone

1. Library → Holy Holy Holy. Play each recording. For the two complete sets, note the seconds
   where Ἅγιος begins and ends.
2. Keep one (or two) recordings; delete the rest from `catalogue/hymns/eu.lichrysbasil.euLI.Key1311.json`;
   add `start` and `end`. If the Matziris recording is not Pringos's melody, drop it or change
   `label` to what it is.
3. If the setting itself should be someone else's Liturgika, say whose; the `label` and `about`
   change with it.
4. Tap *Open the PDF on GOA* under the English setting; it should open in the browser.

## Verdict

Pending the operator.
