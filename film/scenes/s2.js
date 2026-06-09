// scene s2 — The Rubric
// The Ghost dictates in hollow letters; the sacred command inscribes in vermilion;
// the red rule drops the length of the page; Hamlet binds himself to it.
import { INK, rnd } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, BODY, lineY, colX, CAM } from '../layout.js';

export function build(film, T, ctx) {
  const BG = REGIONS.band_ghost;
  const cue = id => ctx.cues.find(q => q.id === id);

  // ---------------------------------------------------------- c02: the Ghost dictates
  const c02 = T.cues['c02'];
  const [g1, g2] = cue('c02').text.split(' / ');
  const d1 = c02.dur * g1.length / (g1.length + g2.length);
  const d2 = c02.dur - d1;
  // his words huddle rightward, toward where he stands in the gutter
  film.add(ink.writeText({
    id: 's2-c02a', t0: c02.start, dur: d1, x: 740, y: lineY(BG, 1), align: 'right',
    size: BODY.size, style: 'italic', color: INK.iron, outline: true, alpha: 0.8, text: g1,
  }));
  film.add(ink.writeText({
    id: 's2-c02b', t0: c02.start + d1, dur: d2, x: 740, y: lineY(BG, 2), align: 'right',
    size: BODY.size, style: 'italic', color: INK.iron, outline: true, alpha: 0.8, text: g2,
  }));
  film.ev({ t: c02.start, type: 'pluck', data: { n: 2 } });
  film.ev({ t: c02.start + d1, type: 'pluck', data: { n: 3 } });

  // the hollow figure: a man-shaped ligature of empty outlines at the top of margin_right.
  // Two thin offset copies of the same pose = a double-walled outline with nothing inside.
  const figX = ANCHORS.ghostImpress.x, figFootY = ANCHORS.ghostImpress.y + 28;
  film.add(ink.figure({
    id: 's2-ghost-fig', t0: c02.start + 0.4, dur: 1.6, x: figX, y: figFootY, h: 60,
    pose: POSES['horatio-stand'], color: INK.iron, weight: 0.5, alpha: 0.45,
  }));
  film.add(ink.figure({
    id: 's2-ghost-fig2', t0: c02.start + 0.6, dur: 1.6, x: figX + 2.2, y: figFootY + 1.6, h: 60,
    pose: POSES['horatio-stand'], color: INK.iron, weight: 0.5, alpha: 0.26,
  }));

  // ---------------------------------------------------------- c03: THE RUBRIC
  const c03 = T.cues['c03'];
  const rubricTxt = cue('c03').text;   // sacred Q2 verbatim
  const rubX = colX(REGIONS.rubric), rubY = 160;
  // letterfit so the full stop lands on ANCHORS.rubricStop (812,160) — the root node
  const natW = ink.textW(rubricTxt, 23, 'roman');
  const spacing = Math.max(-0.3, Math.min(3, (ANCHORS.rubricStop.x + 4 - rubX - natW) / rubricTxt.length));
  film.add(ink.writeText({
    id: 's2-rubric', t0: c03.start, dur: c03.dur, x: rubX, y: rubY,
    size: 23, style: 'roman', color: INK.rubric, jitter: 0.7, spacing, text: rubricTxt,
  }));
  // dry red-chalk tick for the command — no pluck for the rubric
  film.ev({ t: c03.start, type: 'manicule' });

  // on the final period: the RED RULE — the instruction's scope, drawn downward,
  // leaving frame (intended). It persists the whole film.
  const rulePts = [];
  for (let i = 0; i <= 14; i++) {
    rulePts.push({ x: ANCHORS.redRuleX + (rnd('s2-redrule-p', i) - 0.5) * 1.4, y: 175 + (1380 - 175) * i / 14 });
  }
  film.add(ink.stroke({
    id: 's2-redrule', t0: c03.end, dur: 2.5, pts: rulePts, w: 1.2, color: INK.rubric, taper: 0.06,
  }));

  // ---------------------------------------------------------- c04: adieu, adieu, adieu
  const c04 = T.cues['c04'];
  const aTxt = cue('c04').text;   // "Adieu, adieu, adieu. Remember me."
  film.add(ink.writeText({
    id: 's2-c04', t0: c04.start, dur: c04.dur, x: 740, y: lineY(BG, 3), align: 'right',
    size: BODY.size, style: 'italic', color: INK.iron, text: aTxt,
  }));
  film.ev({ t: c04.start, type: 'pluck', data: { n: 4 } });

  // the figure thins: each 'adieu' overdraws one part of his shape in parchment —
  // legs, then trunk and hands, then the head — stroke-deletion, not erasure
  const adieuAt = f => c04.start + c04.dur * f / aTxt.length;
  const pose = POSES['horatio-stand'];
  const poseP = st => st.pts.map(([px, py]) => ({ x: figX + 1.1 + (px - 0.5) * 60 * 0.72, y: figFootY + 0.8 + (py - 1) * 60 }));
  const erase = [[2, 3], [1, 4], [0]];                 // stroke indices: legs / trunk+hands / head
  const eraseAt = [adieuAt(6), adieuAt(13), adieuAt(20)];
  erase.forEach((grp, gi) => grp.forEach((si, j) => {
    film.add(ink.stroke({
      id: `s2-unghost-${gi}-${j}`, t0: eraseAt[gi] - 0.1, dur: 0.45,
      pts: poseP(pose.strokes[si]), w: 6, color: INK.parchment, alpha: 0.82, taper: 0.05,
    }));
  }));

  // on 'Remember me' the last outline collapses into a blind impress — embossed, no ink
  film.add(ink.impressText({
    id: 's2-impress', t0: adieuAt(21), dur: 1.1, x: ANCHORS.ghostImpress.x, y: ANCHORS.ghostImpress.y + 4,
    size: 15, style: 'italic', align: 'center', text: 'Remember me',
  }));

  // ---------------------------------------------------------- c05: Hamlet binds himself
  const c05 = T.cues['c05'];
  const parts = cue('c05').text.split(' / ');
  const h1 = parts[0] + ' ' + parts[1];          // "Remember thee! Ay, thou poor ghost, ..."
  const h2 = parts[2];                            // "In this distracted globe."
  const e1 = c05.dur * h1.length / (h1.length + h2.length);
  const e2 = c05.dur - e1;
  const h1x = colX(BG) + 26, h2x = 410;
  film.add(ink.writeText({
    id: 's2-c05a', t0: c05.start, dur: e1, x: h1x, y: lineY(BG, 4),
    size: BODY.size, style: 'italic', color: INK.iron, text: h1,
  }));
  film.add(ink.writeText({
    id: 's2-c05b', t0: c05.start + e1, dur: e2, x: h2x, y: lineY(BG, 5),
    size: BODY.size, style: 'italic', color: INK.iron, text: h2,
  }));
  film.ev({ t: c05.start, type: 'pluck', data: { n: 5 } });
  film.ev({ t: c05.start + e1, type: 'pluck', data: { n: 6 } });

  // the pen circles 'globe' the instant it lands — the page annotating itself
  const preW = ink.textW('In this distracted ', BODY.size, 'italic');
  const gw = ink.textW('globe', BODY.size, 'italic');
  const gcx = h2x + preW + gw / 2, gcy = lineY(BG, 5) - 5.5;
  const tGlobe = c05.start + e1 + e2 * (h2.indexOf('globe.') + 5) / h2.length;
  const ellPts = [];
  for (let i = 0; i <= 14; i++) {
    const a = -2.3 + (i / 14) * Math.PI * 2 * 1.05;
    ellPts.push({
      x: gcx + Math.cos(a) * (34 + (rnd('s2-globe-e', i) - 0.5) * 2.6),
      y: gcy + Math.sin(a) * (14 + (rnd('s2-globe-e', i + 40) - 0.5) * 2),
    });
  }
  film.add(ink.stroke({ id: 's2-globecircle', t0: tGlobe + 0.05, dur: 0.55, pts: ellPts, w: 1.3, color: INK.iron, taper: 0.12 }));

  // ---------------------------------------------------------- camera
  // open where s1 left us; pan right and tighten onto the Ghost for c02;
  // up to the rubric (whole sacred line in frame, period at the anchor) for c03;
  // back down-right for the adieus and the impress; left for Hamlet's reply;
  // end easing toward s3's fork territory.
  film.cam(CAM(T.start, 470, 265, 300));
  film.cam(CAM(19.8, 470, 265, 300));
  film.cam(CAM(23.0, 650, 262, 320));
  film.cam(CAM(26.45, 650, 262, 320));
  film.cam(CAM(29.9, 460, 162, 560));   // tilt up: the command begins
  film.cam(CAM(31.75, 545, 160, 560));  // drift with the nib; the period sets at the anchor
  film.cam(CAM(34.85, 655, 295, 380));  // back down to the gutter for the adieus
  film.cam(CAM(37.5, 655, 295, 380));
  film.cam(CAM(40.8, 445, 320, 460));   // left to Hamlet's reply
  film.cam(CAM(47.2, 445, 320, 460));
  film.cam(CAM(T.end - 0.02, 500, 330, 380));
}
