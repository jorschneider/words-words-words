# Scene Production API — WORDS, WORDS, WORDS

You are building one scene module of an animated film. The film is ONE manuscript page
(1000 x 1414 page units) being written over ~4:57, in one unbroken shot. Marks accumulate
and NEVER disappear (except by explicit scrape/overdraw). Every frame is a pure function
of time t — no Math.random(), no Date.now(); use `rnd(seedString, n)` from engine.js.

## Your module

`film/scenes/sN.js`:
```js
import { INK, PAGE, rnd } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, BODY, lineY, colX, CAM } from '../layout.js';

export function build(film, T, ctx) {
  // T = your scene's locked timeline: { id, name, start, end, cues: { c07: {start, dur, end}, ... } }
  // ctx = { cues } — full cue list with text/character if needed
  film.add(mark);              // one mark or an array
  film.cam(CAM(t, cx, cy, z, ease?));   // camera keyframes (z = viewport WIDTH in page units, 16:9)
  film.ev({ t, type, data });  // score events per SCORE-API.md
}
```

## Hard rules

1. **Time窗口**: your marks' t0 live in [T.start, T.end] (persistent ink you create stays
   on the page forever — that's the point). Do not create marks before T.start.
2. **Camera**: add a keyframe AT T.start (your opening shot) and one at/near T.end (your
   closing position, which should match where the next scene opens — see your brief).
   Eases: 'smooth' (default), 'out' (fast arrivals / punch-ins), 'linear', 'cut'.
   Max pan speed ~60 units/s (90 in the duel). Mid-film viewport width z stays in 260–620;
   NEVER show the whole page before the final pull-back (s8 only).
3. **Palette discipline** (absolute):
   - INK.iron — all body ink. INK.parchment — the page.
   - INK.rubric — ONLY: the command, the red rule, manicules, subpunct dots, wax seals,
     Claudius's crown accents, the EVICT notch.
   - INK.verdigris — ONLY in s4: the PASS tick and its return filament. Nowhere else.
   - GOLD — ONLY the single gold period in s8 (ink.goldStamp). If your scene is not s8,
     you may not use gold, ever.
   - INK.ghost — scraped/palimpsest remains. INK.verso — the verso shadow.
4. **Mark ids**: prefix with your scene id ('s4-blot'). Collisions break the bake cache.
5. **Words**: you may only put words on the page that your brief specifies (cue text,
   pinned labels, sacred strings). No invented text, no modern words.
6. **bbox**: every helper computes it. If you hand-roll a mark object, provide a correct
   bbox [x,y,w,h] in page units or culling will hide it.

## The ink kit (film/ink.js)

- `writeText({id,t0,dur,x,y,size,style:'italic'|'roman'|'sc',color,text,align,jitter,outline,alpha})`
  — text writes itself glyph by glyph. `outline:true` = hollow unfilled letters (the Ghost).
  Returns mark with `.w` (measured width). Body lines: size 17, style 'italic'.
- `setType({...,bite})` — already-printed type fading in (title leaf, stamped capitals); bite=1.2 for letterpress.
- `impressText({...})` — blind emboss, no ink (the Ghost's collapse, the eviction scar).
- `stroke({id,t0,dur,pts,w,color,taper,ephemeral})` — variable-width nib ribbon.
- `rule({id,t0,dur,x,y,w,color,weight})` — a ruled line.
- `branch({id,t0,dur,x,y,angle,len,curl,segs,w,color})` — returns `{mark, tips:[{x,y,angle}]}`; arbor diagram.
- `strike({id,t0,dur,x,y,w,weight,double_})` — hand-violent strikethrough.
- `subpunct({id,t0,dur,x,y,w})` — red deletion dots under a span (dead but legible).
- `manicule({id,t0,dur,x,y,size,angle,color})` — pointing hand, rubric.
- `blot({id,t0,dur,x,y,r,tendrils})` — blooming ink blot.
- `figure({id,t0,dur,x,y,h,pose:POSES['claudius-kneel'],color,flip,alpha,weight})` — marginal figure,
  h≈40–60. Poses: hamlet-stand/strike/quill, claudius-stand/kneel/flee/dead, gertrude-stand/look/fall,
  ophelia-stand, polonius-stand, laertes-lunge, player-pour, player-sleep, horatio-stand, fortinbras-stand.
- `scrape({id,t0,dur,x,y,w,h,strength})` — palimpsest eraser (parchment streaks over a region).
- `letterFall({id,t0,dur,glyphs:[...],x,y,w,landY,size,color})` — letters flake off and pool (the brook).
- `waxSeal({id,t0,dur,x,y,r})` — round red commit seal (ledger only).
- `goldStamp({id,t0,dur,x,y,size,text})` — s8 ONLY.
- `attentionFlick({id,t0,dur,x,y,tx,ty})` — ephemeral flickering sight-line (use sparingly, toward ANCHORS.rubricStop).
- `versoShadow({id,t0,dur,path:[{u,x,y}...],r,alpha})` — the shape behind the page (s4 closet only).
- `arrow({id,t0,dur,x,y0,y1,w,head})` — straight greedy-decode arrow.
- `textW(text,size,style)`, `glyphW(ch,size,style)`, `fontStr(size,style)` — measuring.

## Score events (see film/SCORE-API.md for sounds)

Emit `film.ev(...)`:
- `{t, type:'pluck', data:{n}}` — ONE per written body line, t = the line's t0. n = running line index (use any stable integer; hash dispersion handles pitch).
- `{t, type:'branch', data:{id,dur}}`, `{t,type:'strike'}`, `{t,type:'manicule'}`
- `{t, type:'inset', data:{dur}}` — Mousetrap music-box (s4).
- `{t, type:'heartbeat'}` — ONLY at your assigned irreversible acts (your brief says which).
- `{t, type:'ophelia', data:{dur, granulateAt}}` (s5), `{t,type:'bell'}` (s8 gold only),
- `{t, type:'mute', data:{dur}}` — total silence windows (use exactly where your brief says).
- `{t, type:'tickrate', data:{rate}}` — metronome multiplier (s7 escalation; restore after).

## Recipes

Body line that is spoken while written (the standard cue treatment):
```js
const c = T.cues['c07'];
const m = ink.writeText({ id: 's3-c07', t0: c.start, dur: c.dur, x: colX(REGIONS.band_fork),
  y: lineY(REGIONS.band_fork, 0), size: BODY.size, style: 'italic', text: ctx.cues.find(q=>q.id==='c07').text });
film.add(m); film.ev({ t: c.start, type: 'pluck', data: { n: 7 } });
```
The rubric red rule already exists from s2 at x = ANCHORS.redRuleX. The command sits in
REGIONS.rubric with its stop at ANCHORS.rubricStop.

NOTE on captures during development: other scenes may not exist yet, so earlier ink
(title, rubric, rule) can be missing from your test frames. Verify YOUR marks, YOUR camera,
YOUR timing — not the neighbors'.

## Iteration harness (mandatory — never ship unviewed work)

A server runs on port 8741. Capture a frame at time t:
```
cd /Users/jorsc/words-words-words && ./tools/frame.sh <t> /tmp/sN_<t>.png
```
Then Read the png. Check: composition at your opening/closing camera positions, text
legibility at your zoom levels, mark timing (capture mid-write moments), nothing outside
your bands that shouldn't be. Iterate at least twice. If the page console errors, the frame
renders parchment-blank — check with:
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --dump-dom --virtual-time-budget=8000 "http://localhost:8741/index.html?t=<t>" 2>/dev/null | grep -o '<title>[^<]*'
```
(`READY` = ok, `BOOT-ERROR` = your module threw; the error text is in a <pre> in the dom.)
