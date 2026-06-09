// scene s1 — The Watch
// Cold open: the title cartouche writes itself; the camera drops to the
// battlements (band_ghost line 0) where Horatio challenges the trace;
// three watchmen materialize in the left margin and a hollow letterform
// passes between the letterforms and drifts down, uncommitted.

import { INK, rnd, clamp01, smooth } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, BODY, lineY, colX, CAM } from '../layout.js';

export function build(film, T, ctx) {
  const c01 = T.cues['c01'];

  // ------------------------------------------------------------ title cartouche
  // 'The Tragicall Historie of' / HAMLET / 'Prince of Denmarke' — writes 1s -> 8s
  const TX = 500; // centerline of REGIONS.title

  film.add(ink.writeText({
    id: 's1-title-1', t0: 1.0, dur: 1.6,
    x: TX, y: 54, size: 17, style: 'sc', align: 'center',
    text: 'The Tragicall Historie of', jitter: 0.8,
  }));

  const hamletSize = 42, hamletSpacing = 6;
  film.add(ink.writeText({
    id: 's1-title-hamlet', t0: 2.9, dur: 1.7,
    x: TX, y: 92, size: hamletSize, style: 'sc', align: 'center',
    text: 'HAMLET', spacing: hamletSpacing, jitter: 0.7,
  }));

  // two small rubric pen-flourishes flanking HAMLET — a smooth scribal swash:
  // an S-curve that gathers into a small curl at the inner end.
  const hw = ink.textW('HAMLET', hamletSize, 'sc', hamletSpacing);
  const fy = 82; // optical middle of the HAMLET caps
  const flourishPts = (cx, dir) => {
    const pts = [];
    const P = (lx, y) => pts.push({ x: cx + dir * lx, y });
    // tilde body: amplitude-enveloped sine, outer tail to inner end
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      const env = Math.sin(u * Math.PI) * 0.62 + 0.38;
      P(u * 34 - 22, fy - Math.sin(u * Math.PI * 1.65 + 0.35) * 6.5 * env);
    }
    // inner curl: rises and wraps over itself, continuous from the tip
    const lx0 = 12, ly0 = pts[pts.length - 1].y, r0 = 4.6;
    for (let i = 1; i <= 10; i++) {
      const u = i / 10;
      const th = Math.PI + u * Math.PI * 1.5;
      const r = r0 * (1 - u * 0.45);
      P(lx0 + r0 + Math.cos(th) * r, ly0 + Math.sin(th) * r);
    }
    return pts;
  };
  film.add(ink.stroke({
    id: 's1-flourish-l', t0: 4.7, dur: 0.45,
    pts: flourishPts(TX - hw / 2 - 34, 1), w: 1.7, color: INK.rubric, taper: 0.45,
  }));
  film.add(ink.stroke({
    id: 's1-flourish-r', t0: 5.1, dur: 0.45,
    pts: flourishPts(TX + hw / 2 + 34, -1), w: 1.7, color: INK.rubric, taper: 0.45,
  }));

  film.add(ink.writeText({
    id: 's1-title-3', t0: 5.6, dur: 1.4,
    x: TX, y: 110, size: 17, style: 'sc', align: 'center',
    text: 'Prince of Denmarke', jitter: 0.8,
  }));

  // ------------------------------------------------------------ c01: Horatio's challenge
  // Upright secretary hand, synced to the voice; halts mid-line on 'speak' —
  // the full cue writes with the voice but ends with no final punctuation.
  const q01 = ctx.cues.find(q => q.id === 'c01');
  const challengeText = q01.text.replace(/[!.?]+$/, '');
  film.add(ink.writeText({
    id: 's1-c01', t0: c01.start, dur: c01.dur,
    x: colX(REGIONS.band_ghost), y: lineY(REGIONS.band_ghost, 0),
    size: BODY.size, style: 'roman', text: challengeText, spacing: -0.4,
  }));
  film.ev({ t: c01.start, type: 'pluck', data: { n: 1 } });

  // ------------------------------------------------------------ the watch (after c01 +1.5s)
  // Three tiny watch figures at the top of the left margin, facing the text.
  const tWatch = c01.end + 1.5; // ~15.74
  const ML = REGIONS.margin_left;
  const watch = [
    { x: ML.x + 44, y: 186 },
    { x: ML.x + 60, y: 224 },
    { x: ML.x + 48, y: 262 },
  ];
  watch.forEach((p, i) => {
    film.add(ink.figure({
      id: 's1-watch-' + i, t0: tWatch + i * 0.14, dur: 0.6,
      x: p.x, y: p.y, h: 34, pose: POSES['horatio-stand'], alpha: 0.85, weight: 0.6,
    }));
  });

  // ------------------------------------------------------------ the ghost-pass
  // A hollow letterform that was never committed: a faint outline 'h' appears
  // between the letterforms of the unfinished line...
  film.add(ink.writeText({
    id: 's1-ghost-h', t0: tWatch, dur: 0.7,
    x: 600, y: 255, size: 22, outline: true, color: INK.ghost, text: 'h',
  }));
  // ...then an ephemeral copy slides downward 40 units and fades to nothing.
  const gf = ink.fontStr(22, 'italic');
  const gd0 = tWatch + 0.45;
  film.add({
    id: 's1-ghost-drift', t0: gd0, dur: 3, static: false, ephemeral: true,
    bbox: [584, 232, 40, 96],
    draw(g, p, t) {
      const u = clamp01(p);
      const dy = smooth(u) * 40;
      const sway = Math.sin(u * 5.2 + 0.7) * 2.5 * (1 - u);
      const a = 0.8 * (1 - smooth(u));
      if (a <= 0.01) return;
      g.save();
      g.font = gf;
      g.textBaseline = 'alphabetic';
      g.strokeStyle = INK.ghost;
      g.lineWidth = Math.max(0.5, 22 * 0.035);
      g.globalAlpha = a;
      g.strokeText('h', 600 + sway, 255 + dy);
      g.restore();
    },
  });

  // ------------------------------------------------------------ camera
  // Open on the title; hold while it writes; drop down the page to settle on
  // the first ruled line of band_ghost as Horatio speaks. During the cue the
  // camera drifts almost imperceptibly right with the nib (the line is wider
  // than the scripted frame — the halt on 'speak' must be seen), then recoils
  // to the scripted (470,265,300) as the watch materializes, and holds for s2.
  film.cam(CAM(T.start, 500, 74, 420));
  film.cam(CAM(5.55, 500, 74, 420));
  film.cam(CAM(c01.start, 470, 265, 300, 'smooth'));
  film.cam(CAM(c01.end, 528, 265, 390, 'linear'));
  film.cam(CAM(tWatch, 490, 265, 330, 'smooth'));
  film.cam(CAM(T.end, 110, 224, 200)); // DEBUG margin


}
