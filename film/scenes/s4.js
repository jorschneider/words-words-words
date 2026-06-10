// scene s4 — The Eval and the Misread
// (A) the Mousetrap runs inside the inset and PASSES; (B) verdigris verification
// closes the loop back to the command; (C) the prayer-scene double misread —
// words rise, thoughts pool; (D) the arras, the pierce, the film's first heartbeat.
import { INK, rnd, easeIn } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, BODY, lineY, colX, CAM } from '../layout.js';

// The inset's interior runs at 8 fps — the simulation is cheaper than reality.
function stepped(mark) {
  const orig = mark.draw.bind(mark);
  const { t0, dur } = mark;
  mark.draw = (g, p, t) => {
    const tq = Math.floor(t * 8) / 8;
    orig(g, Math.max(0, Math.min(1, (tq - t0) / dur)), tq);
  };
  return mark;
}

export function build(film, T, ctx) {
  const IN = REGIONS.inset_mousetrap;                       // x400 y600 w220 h150
  const EV = REGIONS.band_eval, PR = REGIONS.band_prayer, CL = REGIONS.band_closet;
  const { c10, c11, c12, c13, c14, c15, c16 } = T.cues;

  let nLine = 40;
  const line = (id, t0, dur, x, y, text, opts = {}) => {
    film.add(ink.writeText({ id, t0, dur, x, y, size: BODY.size, style: 'italic', text, ...opts }));
    film.ev({ t: t0, type: 'pluck', data: { n: nLine++ } });
  };

  // ================================================== (A) THE MOUSETRAP
  // The dumb show paints itself in the pause before c10 (82.6 → 91.1).

  // the sleeping player-king, center-right of the inset
  film.add(stepped(ink.figure({
    id: 's4-sleep', t0: T.start + 0.8, dur: 1.8,
    x: 548, y: 710, h: 30, pose: POSES['player-sleep'],
  })));

  // the tiny rubric command-line inside the inset's top border — the mise en abyme
  film.add(stepped(ink.writeText({
    id: 's4-inset-cmd', t0: T.start + 2.0, dur: 1.0,
    x: 510, y: 611, size: 6, style: 'sc', color: INK.rubric,
    text: 'Revenge', align: 'center', jitter: 0.5,
  })));

  // the poisoner enters and bends over him (≈86–88s); his tableau's own sleeper
  // is laid over the king's body — doubled ink, a play atop a play
  film.add(stepped(ink.figure({
    id: 's4-pour', t0: 86.3, dur: 1.9,
    x: 538.4, y: 710.3, h: 34, pose: POSES['player-pour'],
  })));

  // the Mousetrap music-box, only while the fiction runs
  film.ev({ t: 86.0, type: 'inset', data: { dur: 10 } });

  // the poison drips at 8 fps until the lights are called for
  const dripT0 = 88.4, dripEnd = 96.5;
  film.add({
    id: 's4-drip', t0: dripT0, dur: dripEnd - dripT0, static: false, ephemeral: true,
    bbox: [536, 694, 11, 12],
    draw(g, p, t) {
      const ts = Math.floor(t * 8) / 8;
      if (ts < dripT0) return;
      const u = ((ts - dripT0) % 0.75) / 0.75;
      g.save();
      g.fillStyle = INK.iron;
      g.globalAlpha = 0.85 * (1 - Math.max(0, u - 0.75) * 4);
      g.beginPath();
      g.arc(541.3, 698.4 + u * 5.2, 0.9, 0, 7);
      g.fill();
      g.restore();
    },
  });

  // c10 — Gertrude, from inside the test's own audience. Her line sits plainly
  // beneath the miniature.
  line('s4-c10', c10.start, c10.dur, 310, 764, 'The lady doth protest too much, methinks.');

  // c11 — "Give me some light: away!" — the inset FLOODS
  film.add({
    id: 's4-flood', t0: 96.55, dur: 0.8, static: true,
    bbox: [IN.x, IN.y, IN.w, IN.h],
    draw(g, p) {
      g.save();
      g.globalAlpha *= Math.min(1, p);
      g.fillStyle = 'rgba(158,43,37,0.16)';
      g.fillRect(IN.x, IN.y, IN.w, IN.h);
      g.restore();
    },
  });
  // the test chamber sealed: borders overdrawn 3x heavier
  const bx0 = IN.x, by0 = IN.y, bx1 = IN.x + IN.w, by1 = IN.y + IN.h;
  [
    [{ x: bx0 - 3, y: by0 }, { x: bx1 + 2, y: by0 }],
    [{ x: bx1, y: by0 - 3 }, { x: bx1, y: by1 + 2 }],
    [{ x: bx1 + 3, y: by1 }, { x: bx0 - 2, y: by1 }],
    [{ x: bx0, y: by1 + 3 }, { x: bx0, y: by0 - 2 }],
  ].forEach((pts, i) => film.add(ink.stroke({
    id: 's4-border' + i, t0: 97.15 + i * 0.09, dur: 0.35, pts, w: 3, taper: 0.12,
  })));
  // Claudius bursts from the inset's left edge, fleeing LEFT
  film.add(ink.figure({
    id: 's4-flee', t0: 97.2, dur: 0.7,
    x: 372, y: 748, h: 40, pose: POSES['claudius-flee'], flip: true,
  }));

  // ================================================== (B) THE VERIFICATION
  // the verdigris PASS tick at the inset's NE corner
  film.add([
    ink.stroke({ id: 's4-tick-a', t0: 98.3, dur: 0.22, w: 2, color: INK.verdigris, taper: 0.2, pts: [{ x: 605, y: 607 }, { x: 610, y: 613 }] }),
    ink.stroke({ id: 's4-tick-b', t0: 98.55, dur: 0.28, w: 2, color: INK.verdigris, taper: 0.2, pts: [{ x: 610, y: 613 }, { x: 619, y: 599 }] }),
  ]);

  // c12 — the verification line, wrapped beside the inset
  line('s4-c12a', c12.start, 1.65, colX(EV), lineY(EV, 0), "O good Horatio, I'll take");
  line('s4-c12b', c12.start + 1.65, 1.32, colX(EV), lineY(EV, 1), "the ghost's word for");
  line('s4-c12c', c12.start + 2.97, 1.12, colX(EV), lineY(EV, 2), 'a thousand pound.');

  // the filament: the loop closes from the tick back up to the command's full stop
  film.add(ink.stroke({
    id: 's4-filament', t0: c12.start, dur: 3.5, w: 0.8, color: INK.verdigris, taper: 0.08,
    pts: [
      { x: 619, y: 600 }, { x: 660, y: 602 }, { x: 712, y: 600 }, { x: 762, y: 603 },
      { x: 800, y: 588 }, { x: 815, y: 540 }, { x: 816, y: 430 }, { x: 814, y: 320 },
      { x: 815, y: 220 }, { x: ANCHORS.rubricStop.x, y: ANCHORS.rubricStop.y },
    ],
  }));

  // the TRUE manicule — and the one margin figure looking at the right line
  film.add(ink.manicule({ id: 's4-manicule', t0: c12.start + 0.5, dur: 0.9, x: 95, y: 640, size: 20 }));
  film.ev({ t: c12.start + 0.5, type: 'manicule' });
  film.add(ink.figure({
    id: 's4-horatio', t0: c12.start + 1.4, dur: 1.2,
    x: 95, y: 688, h: 30, pose: POSES['horatio-stand'],
  }));

  // ================================================== (C) THE DOUBLE MISREAD
  // c13 — Hamlet over the kneeling king
  line('s4-c13a', c13.start, 2.81, colX(PR), lineY(PR, 0), 'Now might I do it pat, now he is praying;');
  line('s4-c13b', c13.start + 2.81, 3.01, colX(PR), lineY(PR, 1), "And now I'll do't. And so he goes to heaven;");
  line('s4-c13c', c13.start + 5.82, 3.02, colX(PR), lineY(PR, 2), "And so am I revenged. That would be scann'd.");

  film.add(ink.figure({
    id: 's4-kneel', t0: c13.start + 0.5, dur: 2.5,
    x: ANCHORS.kneelClaudius.x, y: ANCHORS.kneelClaudius.y, h: 48, pose: POSES['claudius-kneel'],
  }));

  // the blade extends from the text toward the nape — faint, 60% of the way,
  // frozen — ink cannot retract; the action is pruned with a strike immediately
  film.add(ink.stroke({
    id: 's4-blade', t0: c13.start + 3.3, dur: 1.5, w: 2.2, alpha: 0.25, taper: 0.3,
    pts: [{ x: 525, y: 845 }, { x: 605, y: 836 }, { x: 684, y: 826 }],
  }));
  const pruneT = c13.start + 4.95;
  film.add(ink.strike({ id: 's4-blade-strike', t0: pruneT, dur: 0.45, x: 545, y: 839, w: 150, weight: 2.4 }));
  film.ev({ t: pruneT, type: 'strike' });

  // c14 — the couplet on the baseline...
  const l14a = "My words fly up, my thoughts remain below:";
  const l14b = 'Words without thoughts never to heaven go.';
  const d14a = 2.61;
  line('s4-c14a', c14.start, d14a, colX(PR), lineY(PR, 3), l14a);
  line('s4-c14b', c14.start + d14a, 2.61, colX(PR), lineY(PR, 4), l14b);

  // ...hollow word-copies rise into the inter-line gap as the spoken words pass
  // (12 units up — 22 would tangle them in line 2's descenders at lh 26)
  [['My ', 'words'], ['My words ', 'fly'], ['My words fly ', 'up']].forEach(([pre, word], i) => {
    const at = c14.start + ((pre + word).length / l14a.length) * d14a;
    film.add(ink.writeText({
      id: 's4-rise-' + word, t0: at, dur: 0.7,
      x: colX(PR) + ink.textW(pre, BODY.size, 'italic'),
      y: lineY(PR, 3) - 12,
      size: BODY.size, style: 'italic', text: word, outline: true, alpha: 0.5,
    }));
  });

  // ...and the thought-blots pool below the kneeling figure, and stop dead
  [
    { t: 122.2, x: 791, y: 908, r: 8 },
    { t: 123.5, x: 801, y: 918, r: 9 },
    { t: 124.7, x: 794, y: 927, r: 7 },
  ].forEach((b, i) => film.add(ink.blot({
    id: 's4-thought' + i, t0: b.t, dur: 1.6, x: b.x, y: b.y, r: b.r, tendrils: 2,
  })));

  // ================================================== (D) THE ARRAS
  // the shape behind the page slides in behind the curtain (added first: under)
  film.add(ink.versoShadow({
    id: 's4-verso', t0: c14.end, dur: c15.end - c14.end,
    path: [{ u: 0, x: 660, y: 990 }, { u: 1, x: 640, y: 985 }], r: 30, alpha: 0.5,
  }));

  // the drapery: wavy vertical strokes over band_closet's right third
  for (let i = 0; i < 6; i++) {
    const xb = 565 + i * 34.5;
    const pts = [];
    for (let j = 0; j <= 7; j++) {
      const y = 945 + (j / 7) * 75;
      pts.push({ x: xb + Math.sin(y * 0.085 + i * 1.7) * 3.5, y });
    }
    film.add(ink.stroke({
      id: 's4-arras' + i, t0: 127.2 + i * 0.3, dur: 0.8, pts, w: 2, alpha: 0.7, taper: 0.2,
    }));
  }

  // c15 — Polonius, cut off mid-word: ink and voice die together, the word
  // never finished
  line('s4-c15', c15.start, c15.dur, 560, 975, 'O, I am sl', { size: 12 });

  // THE PIERCE — at the cut, exactly: one violent stroke corner to corner
  film.add(ink.stroke({
    id: 's4-pierce', t0: c15.end, dur: 0.25, w: 3.5, taper: 0.1, ease: easeIn,
    pts: [{ x: 555, y: 950 }, { x: 745, y: 1020 }],
  }));

  // FIRST HEARTBEAT — the world changed
  film.ev({ t: c15.end + 0.4, type: 'heartbeat' });
  film.add(ink.waxSeal({ id: 's4-seal1', t0: c15.end + 0.6, x: ANCHORS.seal1.x, y: ANCHORS.seal1.y, r: 11 }));

  // c16 — Hamlet, beneath the pierced curtain
  line('s4-c16a', c16.start, 3.74, colX(CL), lineY(CL, 1), 'Thou wretched, rash, intruding fool, farewell!');
  line('s4-c16b', c16.start + 3.74, 2.2, colX(CL), lineY(CL, 2), 'I took thee for thy better.');

  // ================================================== CAMERA
  film.cam([
    CAM(T.start, 520, 560, 520),               // opening, from s3
    CAM(88.0, 510, 665, 420),                  // settle on the miniature
    CAM(96.6, 510, 665, 420),                  // hold through c10–c11
    CAM(97.6, 520, 690, 560, 'out'),           // "away!" — punch out fast
    CAM(101.3, 380, 680, 620),                 // drift left: manicule enters frame
    CAM(105.2, 380, 680, 620),                 // hold the verification tableau
    CAM(109.4, 503, 850, 620),                 // track down to the prayer band
    CAM(128.3, 503, 850, 620),                 // hold the completed double register
    CAM(131.0, 466, 985, 560),                 // descend to the closet, arras right
    CAM(139.3, 466, 985, 560),                 // hold: pierce, heartbeat, seal, c16
    CAM(T.end, 560, 990, 400),                 // smallest move: toward the curtain — s5
  ]);
}
