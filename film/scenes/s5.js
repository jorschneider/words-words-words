// scene s5 — THE EVICTION
// Ophelia's one clear line; the court's botching; the granulation and the scar.
import { INK } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, lineY, colX, CAM } from '../layout.js';

// A small label written slightly askew — the court pinning its word to her text.
function pinnedLabel({ id, t0, dur, x, y, rot, text }) {
  const inner = ink.writeText({
    id: id + '-t', t0: 0, dur: 1, x: 0, y: 0,
    size: 10.5, style: 'roman', color: INK.iron, text, jitter: 0.5, alpha: 1,
  });
  return {
    id, t0, dur, static: true,
    bbox: [x - 12, y - 32, inner.w + 28, 50],
    draw(g, p, t) {
      g.save(); g.translate(x, y); g.rotate(rot);
      inner.draw(g, p, t);
      g.restore();
    },
  };
}

export function build(film, T, ctx) {
  const B = REGIONS.band_ophelia;
  const { c17, c18, c19 } = T.cues;
  const text = id => ctx.cues.find(c => c.id === id).text;

  // ------------------------------------------------------------ camera
  film.cam([
    CAM(T.start, 450, 1075, 300),                 // settle on the blank band
    CAM(T.start + 3.7, 345, 1072, 300),           // drift to where her line will begin
    CAM(c17.start, 345, 1072, 300),               // hold through the tacet
    CAM(c17.end + 0.5, 504, 1077, 300),           // pan with the nib as she writes
    CAM(c17.end + 3.7, 655, 1083, 470),           // widen: gloss + grotesques frame right
    CAM(c18.end - 0.6, 668, 1088, 485),           // slow creep across the report
    CAM(c19.start + 0.8, 452, 1094, 520),         // back to her band for the last line
    CAM(c19.start + 2.8, 452, 1094, 520),         // hold as the granulation begins
    CAM(T.end - 0.8, 600, 1180, 520),             // drift down-right after the letters
    CAM(T.end, 560, 1180, 520),                   // closing position
  ]);

  // ------------------------------------------------------------ (1) pre-tacet
  film.ev({ t: c17.start - 2, type: 'mute', data: { dur: 2 } });

  // ------------------------------------------------------------ (2) c17 — the clean line
  film.add(ink.figure({
    id: 's5-ophelia', t0: c17.start - 1.6, dur: 1.2,
    x: 763, y: 1076, h: 42, pose: POSES['ophelia-stand'], color: INK.iron, alpha: 0.8,
  }));
  film.add(ink.writeText({
    id: 's5-c17', t0: c17.start, dur: c17.dur,
    x: colX(B), y: lineY(B, 0), size: 16, style: 'italic',
    color: INK.iron, jitter: 0.25, text: text('c17'),
  }));
  film.ev({ t: c17.start, type: 'pluck', data: { n: 17 } });

  // ------------------------------------------------------------ (3) c18 — the watchers
  // Tall gloss in margin_right at the scar's latitude, one pluck for the whole report.
  const gloss = [
    'Her speech is nothing,',
    'yet the unshaped use',
    'of it doth move the',
    'hearers to collection;',
    'they aim at it, and',
    'botch the words up fit',
    'to their own thoughts.',
  ];
  const totalCh = gloss.reduce((a, s) => a + s.length, 0);
  let tg = c18.start;
  gloss.forEach((line, i) => {
    const slice = c18.dur * (line.length / totalCh);
    film.add(ink.writeText({
      id: 's5-gloss-' + i, t0: tg, dur: slice * 0.92,
      x: 775, y: 1055 + i * 15.5, size: 12, style: 'roman',
      color: INK.iron, jitter: 0.8, alpha: 0.9, text: line,
    }));
    tg += slice;
  });
  film.ev({ t: c18.start, type: 'pluck', data: { n: 18 } });

  // The grotesques: three court figures lean in at the band's right edge ("they aim at it")
  film.add(ink.figure({
    id: 's5-grot-1', t0: c18.start + 5.2, dur: 0.9,
    x: 710, y: 1098, h: 30, pose: POSES['polonius-stand'], color: INK.iron, alpha: 0.7,
  }));
  film.add(ink.figure({
    id: 's5-grot-2', t0: c18.start + 5.9, dur: 0.9,
    x: 733, y: 1100, h: 30, pose: POSES['claudius-stand'], color: INK.iron, alpha: 0.7,
  }));
  film.add(ink.figure({
    id: 's5-grot-3', t0: c18.start + 6.6, dur: 0.9,
    x: 752, y: 1098, h: 32, pose: POSES['gertrude-look'], color: INK.iron, flip: true, alpha: 0.7,
  }));

  // Four pinned labels in fresher, darker ink — none matching what she wrote
  const labels = [
    { text: 'nothing', x: 596, y: 1044, rot: -0.08, pin: [[608, 1048], [604, 1056]] },
    { text: 'madness', x: 650, y: 1047, rot: 0.11, pin: [[664, 1051], [660, 1059]] },
    { text: 'a document in madness', x: 556, y: 1128, rot: -0.05, pin: [[570, 1118], [574, 1110]] },
    { text: 'conceit upon her father', x: 600, y: 1149, rot: 0.07, pin: [[640, 1139], [644, 1131]] },
  ];
  labels.forEach((L, i) => {
    const t0 = c18.start + 7.3 + i * 0.78;
    film.add(ink.stroke({
      id: 's5-pin-' + i, t0: t0 - 0.25, dur: 0.25,
      pts: [{ x: L.pin[0][0], y: L.pin[0][1] }, { x: L.pin[1][0], y: L.pin[1][1] }],
      w: 1.2, color: INK.iron, alpha: 0.9, taper: 0.3,
    }));
    film.add(pinnedLabel({ id: 's5-label-' + i, t0, dur: 0.7, x: L.x, y: L.y, rot: L.rot, text: L.text }));
  });

  // ------------------------------------------------------------ (4) c19 — the granulation
  film.add(ink.writeText({
    id: 's5-c19', t0: c19.start, dur: c19.dur,
    x: colX(B), y: lineY(B, 1), size: 16, style: 'italic',
    color: INK.iron, jitter: 0.25, text: text('c19'),
  }));
  film.ev({ t: c19.start, type: 'pluck', data: { n: 19 } });
  film.ev({ t: c19.start, type: 'ophelia', data: { dur: c19.dur + 3.5, granulateAt: 2.6 } });

  const gT = c19.start + 2.6; // the granulation
  film.add(ink.letterFall({
    id: 's5-fall', t0: gT, dur: 6,
    glyphs: [...'good night sweet ladies good night'].filter(ch => ch !== ' '),
    x: 200, y: 1085, w: 480, landY: 1395, size: 11, color: INK.ghost,
  }));
  film.add(ink.scrape({
    id: 's5-scrape', t0: gT, dur: 6,
    x: 190, y: 1060, w: 500, h: 50, strength: 0.7,
  }));
  // after the scrape completes: the blind impress — the scar
  film.add(ink.impressText({
    id: 's5-scar', t0: gT + 6.1, dur: 2,
    x: colX(B), y: lineY(B, 0), size: 16, style: 'italic', text: text('c17'),
  }));

  // The grain-trail: her exit, crossing the gutter to the page edge
  const lastGrainT = c19.end + 3;
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const gx = 748 + u * (990 - 748);
    const gy = 1085 + Math.sin(i * 1.15) * 3.2 + u * 4;
    film.add(ink.stroke({
      id: 's5-grain-' + i, t0: gT + 0.7 + u * (lastGrainT - gT - 0.7), dur: 0.3,
      pts: [{ x: gx - 4.2, y: gy + 1.2 }, { x: gx + 4.2, y: gy - 1.2 }],
      w: 1.8, color: INK.ghost, alpha: 0.5, taper: 0.3,
    }));
  }

  // EVICT notch (rubric) at the last grain, then the heartbeat + second seal
  film.add(ink.stroke({
    id: 's5-evict-notch', t0: lastGrainT, dur: 0.35,
    pts: [{ x: ANCHORS.evictNotch.x - 7, y: ANCHORS.evictNotch.y + 2 },
          { x: ANCHORS.evictNotch.x + 7, y: ANCHORS.evictNotch.y - 2 }],
    w: 2.4, color: INK.rubric, taper: 0.2,
  }));
  film.ev({ t: c19.end + 3.2, type: 'heartbeat' });
  film.add(ink.waxSeal({
    id: 's5-seal2', t0: c19.end + 3.2, dur: 0.7,
    x: ANCHORS.seal2.x, y: ANCHORS.seal2.y, r: 11,
  }));

  // ------------------------------------------------------------ (5) the silence
  film.ev({ t: c19.end + 3.4, type: 'mute', data: { dur: 179 - (c19.end + 3.4) } });
}
