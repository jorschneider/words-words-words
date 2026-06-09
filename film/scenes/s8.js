// scene s8 — The Attestation
// The final line assembles; the period hangs un-set, trembling; the rest is
// silence; the period sets in gold; the witness attests; the machine stamps;
// the one full-page reveal; dark.
import { INK, rnd, clamp01, smooth } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, lineY, colX, CAM } from '../layout.js';

export function build(film, T, ctx) {
  const c27 = T.cues.c27, c28 = T.cues.c28, c29 = T.cues.c29,
        c30 = T.cues.c30, c31 = T.cues.c31;
  const GP = ANCHORS.goldPeriod;            // (705, 1332) — THE gold
  const LINE_Y = 1330;                      // the final line of the body

  // ---------------------------------------------------------------- (1) the final line assembly
  // c27 begins the page's last line; c28 continues it, dying slower and drier,
  // ending just left of where the period will hover. Sized/spaced to land exactly.
  const SEG1 = 'Horatio, I am dead; thou livest; report me and my cause aright';
  const SEG2 = 'to tell my story';
  const X0 = 190, XEND = GP.x - 17;         // text ends ~688, just left of the period
  let sz = 14.5;
  let gap = ink.glyphW(' ', sz, 'italic') * 1.4;
  const w1 = ink.textW(SEG1, sz, 'italic'), w2 = ink.textW(SEG2, sz, 'italic');
  let spacing = (XEND - X0 - gap - w1 - w2) / (SEG1.length + SEG2.length);
  if (spacing < -0.25) {                    // too long at 14.5: shrink instead of crushing
    sz = sz * (XEND - X0 - gap) / (w1 + w2);
    spacing = 0;
  }
  if (spacing > 0.55) spacing = 0.55;       // any leftover slack becomes the pen-lift gap

  film.add(ink.writeText({ id: 's8-c27', t0: c27.start, dur: c27.dur,
    x: X0, y: LINE_Y, size: sz, style: 'italic', text: SEG1, spacing }));
  film.ev({ t: c27.start, type: 'pluck', data: { n: 27 } });

  // c28 is right-aligned so 'to tell my story' lands exactly left of the period.
  film.add(ink.writeText({ id: 's8-c28', t0: c28.start, dur: c28.dur,
    x: XEND, y: LINE_Y, size: sz, style: 'italic', text: SEG2, spacing,
    align: 'right', alpha: 0.86 }));
  film.ev({ t: c28.start, type: 'pluck', data: { n: 28 } });

  // The witness coming down the ledger: two small instances of the same figure,
  // a faint trace of passage mid-ledger, then arrived at the foot, facing the line.
  // (Second instance sits at x 116 rather than 90 to clear seal5 at (90,1318).)
  film.add(ink.figure({ id: 's8-witness-a', t0: c27.start + 0.4, dur: 1.4,
    x: 90, y: 1150, h: 34, pose: POSES['horatio-stand'], alpha: 0.4 }));
  film.add(ink.figure({ id: 's8-witness-b', t0: c28.start + 0.5, dur: 1.6,
    x: 116, y: 1342, h: 34, pose: POSES['horatio-stand'], alpha: 0.9 }));

  // ---------------------------------------------------------------- (2) THE HELD PERIOD
  // A single un-set period-dot, hovering 3u above the baseline, trembling.
  // The page is steady; the MARK is afraid.
  const tremT0 = c28.end + 0.5;
  const goldT = c29.end + 0.2;
  const tremDur = (goldT + 0.15) - tremT0;  // lives until the gold stamps over it
  film.add({
    id: 's8-held-period', t0: tremT0, dur: tremDur, static: false,
    bbox: [GP.x - 9, GP.y - 12, 18, 18],
    draw(g, p, t) {
      if (t > tremT0 + tremDur) return;
      const settle = clamp01((t - (c29.end - 0.32)) / 0.32);  // on 'silence' it descends
      const amp = 0.7 * (1 - settle);                          // jitter ±0.35, dying as it sets
      const k = Math.floor(t * 18);                            // ~9Hz
      const dx = (rnd('s8-held-period', k) - 0.5) * amp;
      const dy = (rnd('s8-held-periodY', k * 5 + 1) - 0.5) * amp;
      const y = (GP.y - 3) + 3 * smooth(settle);
      const aIn = clamp01((t - tremT0) / 0.3);
      const aOut = clamp01((tremT0 + tremDur - t) / 0.18);
      g.save();
      g.globalAlpha = 0.95 * aIn * aOut;
      g.fillStyle = INK.iron;
      g.beginPath(); g.arc(GP.x + dx, y + dy, 2.2, 0, 7); g.fill();
      g.restore();
    },
  });
  // ABSOLUTE TACET around the held period and the whisper.
  film.ev({ t: c28.end + 0.4, type: 'mute',
    data: { dur: (c29.start - c28.end) + c29.dur - 0.3 } });

  // ---------------------------------------------------------------- (3) THE SETTING
  // The whisper writes faint, a half-line tucked under the line's end, just
  // left-below the period (the line itself is full to x≈688 — see report).
  // No written full stop: the page's only period is the gold one.
  film.add(ink.writeText({ id: 's8-c29', t0: c29.start, dur: c29.dur,
    x: GP.x - 13, y: GP.y + 17, size: 13, style: 'italic',
    text: 'The rest is silence', align: 'right', alpha: 0.55 }));

  // THE GOLD PERIOD — the page's ONLY gold.
  film.add(ink.goldStamp({ id: 's8-gold-period', t0: goldT, dur: 0.9,
    x: GP.x, y: GP.y, size: 24, text: '.' }));
  film.ev({ t: c29.end + 0.2, type: 'bell' });
  film.ev({ t: c29.end + 0.3, type: 'heartbeat' });            // HB6, the last
  film.ev({ t: c29.end + 0.6, type: 'mute', data: { dur: 3.2 } });

  // ---------------------------------------------------------------- (4) the attestation
  // Horatio's colophon line, in the witness's upright hand (the hand of c01).
  const colo = REGIONS.colophon;
  const TXT30 = 'Now cracks a noble heart. Good night, sweet prince, And flights of angels sing thee to thy rest!';
  let sz30 = 15;
  const wMax = (colo.x + colo.w) - colX(colo);
  const w30 = ink.textW(TXT30, sz30, 'roman');
  if (w30 > wMax) sz30 = Math.max(13, 15 * wMax / w30);
  const y30 = lineY(colo, 0);
  film.add(ink.writeText({ id: 's8-c30', t0: c30.start, dur: c30.dur,
    x: colX(colo), y: y30, size: sz30, style: 'roman', text: TXT30 }));
  film.ev({ t: c30.start, type: 'pluck', data: { n: 30 } });

  // WING CADELS: two hairline upstrokes rising at 'flights of angels'.
  const n30 = TXT30.length;
  const cadel = (idxTip, dx0, key) => {
    const xb = colX(colo) + ink.textW(TXT30.slice(0, idxTip), sz30, 'roman') + dx0;
    const yb = y30 - sz30 * 0.62;
    const t0 = c30.start + c30.dur * ((idxTip + 1) / n30) + 0.1;
    return ink.stroke({ id: 's8-cadel-' + key, t0, dur: 0.55, w: 0.6, taper: 0.55, pts: [
      { x: xb, y: yb }, { x: xb + 1.6, y: yb - 6 },
      { x: xb + 4.2, y: yb - 12 }, { x: xb + 7.6, y: yb - 18 },
    ] });
  };
  const iF = TXT30.indexOf('flights');                  // the 'fl' ascenders
  const iL = TXT30.indexOf('angels') + 4;               // the 'l' of angels
  film.add(cadel(iF, ink.glyphW('f', sz30, 'roman') * 0.7, 'f'));
  film.add(cadel(iL, ink.glyphW('l', sz30, 'roman') * 0.45, 'l'));

  // THE PEN-KNOT: a notarial flourish at the ledger's foot — four overlapping
  // looping strokes, ~26 units wide, drawn while her line writes.
  const PK = ANCHORS.penKnot;
  const knotLoop = (k, rx, ry, rot, ph, ox, oy) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = ph + (i / 24) * Math.PI * 2.2;
      const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      pts.push({ x: PK.x + ox + ex * Math.cos(rot) - ey * Math.sin(rot),
                 y: PK.y + oy + ex * Math.sin(rot) + ey * Math.cos(rot) });
    }
    return ink.stroke({ id: 's8-knot-' + k, t0: c30.start + 0.7 + k * 1.15,
      dur: 1.05, pts, w: 1.1, taper: 0.5 });
  };
  film.add(knotLoop(0, 13, 7.5, -0.4, 0.6, 0, 0));
  film.add(knotLoop(1, 10, 8.5, 0.55, 2.7, -2, 1));
  film.add(knotLoop(2, 12, 6.0, 1.15, 4.6, 2, -1));
  film.add(knotLoop(3, 6, 4.2, 0.1, 1.4, 0, 0));

  // ---------------------------------------------------------------- (5) the machine voice + the frieze
  // Fortinbras does not write; he prints. Three letterpress stamps, staggered.
  // No pluck: stamps are not writing.
  const y31 = lineY(colo, 1);
  const phrases = ['Bear Hamlet, like a soldier,', 'to the stage.', 'Go, bid the soldiers shoot.'];
  let sx = colX(colo);
  phrases.forEach((ptxt, i) => {
    film.add(ink.setType({ id: 's8-c31-' + i, t0: c31.start + 0.3 + i * 0.8, dur: 0.2,
      x: sx, y: y31, size: 13, style: 'sc', color: INK.iron, text: ptxt,
      align: 'left', bite: 1.2 }));
    sx += ink.textW(ptxt, 13, 'sc') + 18;
  });

  // THE FUNERAL FRIEZE: four captains bearing one horizontal figure, marching
  // rightward along the bottom edge, drawn under the receding camera.
  const frieze = [
    { x: 760, t: 283.0 }, { x: 791, t: 284.2 },
    { x: 824, t: 285.4, corpse: true },
    { x: 857, t: 286.6 }, { x: 888, t: 287.8 },
  ];
  frieze.forEach((f, i) => {
    if (f.corpse) {
      film.add(ink.figure({ id: 's8-frieze-' + i, t0: f.t, dur: 0.9,
        x: f.x, y: 1384, h: 24, pose: POSES['player-sleep'], alpha: 0.8 }));
    } else {
      film.add(ink.figure({ id: 's8-frieze-' + i, t0: f.t, dur: 0.9,
        x: f.x, y: 1392, h: 22, pose: POSES['fortinbras-stand'], alpha: 0.8 }));
    }
  });

  // ---------------------------------------------------------------- (6) THE END
  // The candle goes; the page goes with it. Covers page and desk alike.
  const fadeT0 = 294.8, fadeDur = 2.3;
  film.add({
    id: 's8-fade', t0: fadeT0, dur: fadeDur, static: false,
    bbox: [-2000, -2000, 6000, 6000],
    draw(g, p) {
      const a = smooth(clamp01(p));
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a; g.fillStyle = '#171310';
      g.fillRect(-2000, -2000, 6000, 6000);
      g.restore();
    },
  });

  // ---------------------------------------------------------------- camera
  film.cam([
    CAM(T.start, 540, 1300, 300),                          // opening: the duel's wake
    CAM(c27.start, 480, 1318, 300, 'smooth'),              // the last live line
    CAM(c27.end, 480, 1318, 300),                          // hold through c27
    CAM(c28.start + 3.2, 270, 1326, 330, 'smooth'),        // left: the witness at the foot
    CAM(c28.start + 4.4, 270, 1326, 330),                  // a beat on her
    CAM(c28.end + 1.5, 688, 1344, 140, 'smooth'),          // THE DIVE across the dying line
    CAM(c29.end + 1.0, 688, 1344, 140),                    // dead still through the silence
    CAM(c29.end + 2.0, 672, 1354, 170, 'smooth'),          // tiny widen: the gold's glint
    CAM(c30.start + 1.6, 480, 1360, 300, 'smooth'),        // down-left to the colophon
    CAM(c30.start + 3.2, 480, 1360, 300),                  // hold on the witness's hand
    CAM(281.7, 705, 1332, 200, 'smooth'),                  // return to the gold
    CAM(284.8, 640, 1300, 560, 'smooth'),                  // low and widening: stamps + frieze land in frame
    CAM(294.7, 500, 707, 2560, 'smooth'),                  // THE PULL-BACK: the whole leaf
  ]);
}
