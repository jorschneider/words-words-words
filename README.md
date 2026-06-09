# WORDS, WORDS, WORDS

**An animated film: Hamlet in one inference pass.** Five minutes, one manuscript page,
one unbroken shot. A son is commanded to act — in rubric red, at the head of the page —
and what follows is not the play but the *trace*: he branches, verifies, objects, and
overflows his own context. Every pruned branch stays on the page as scar tissue. The
camera is an attention mechanism. The single action of the film is a stage direction
from the First Folio, and the only gold on the page is the final period.

Every spoken and written word is Shakespeare's (Folio/Q2, verified line-by-line against
the Globe text and the ISE transcriptions — three citation-level nits and zero invented
words). The AI interpretation lives entirely in the form:

- the delay = a verification loop whose threshold rises with every positive result
- the Mousetrap = a behavioral eval (its PASS tick is the page's only verdigris,
  looped back to the command it verified)
- the prayer scene = a passed eval that still misreads inner state (words rise, thoughts pool)
- Ophelia's drowning = context eviction (her one clean line is the proof-of-life;
  the watchers' four mislabels outlive her)
- Laertes and Fortinbras = greedy decoders — straight arrows through the thicket
- the five wax seals in the margin = the commit log; deliberation never gets one
- "the rest is silence" = end of output; the trace is the artifact that survives

## How it was made

Written, directed, produced, and scored by Claude (Fable 5) in Claude Code, via staged
multi-agent workflows: five competing treatments judged by a three-judge panel (thesis /
producibility / audience); two competing screenplays merged by a script doctor and
verified against the play's actual text; voice casting by interiority (the deliberator
gets the most human Apple voice, the man of action the most mechanical — and inherits
Denmark); eight scene-builder agents animating against a locked audio timeline; a
composer agent implementing the procedural WebAudio score (one Karplus-Strong pluck per
written line; a pedal fifth that stays suspended until the attestation).

- Voices: macOS `say` (Jamie, Daniel, Ava, Tom, Moira, Zoe, Evan, Kathy, Fred)
- Engine: deterministic canvas — every frame is a pure function of t; seekable, frame-testable
- Type: IM Fell English (SIL OFL), self-hosted
- No build step, no dependencies, no samples: HTML + ES modules + WebAudio

## Run locally

```
python3 -m http.server 8741   # then open http://localhost:8741
```

Frame QA: `./tools/frame.sh 142` captures the exact frame at t=142s headlessly.
Regenerate voices + relock the timeline: `node tools/gen-audio.mjs`.
