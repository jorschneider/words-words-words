// scene s3 — THE FORK. Deliberation as speculative decoding.
// Polonius misfiles the first gloss; the couplet commissions the eval (and its
// empty test harness rules itself far below); 'To be' erupts into a stemma that
// fans right and down like a feather; conscience subpuncts every branch — dead
// but legible. Thought is visible, reversible, and free.
import { INK, rnd } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, BODY, lineY, colX, CAM } from '../layout.js';

export function build(film, T, ctx) {
  const F = REGIONS.band_fork;
  const c06 = T.cues.c06, c07 = T.cues.c07, c08 = T.cues.c08, c09 = T.cues.c09;
  const txt = (id) => ctx.cues.find((q) => q.id === id).text;

  // ============================================================ (1) c06 —
  // Polonius's marginal gloss, tiny roman, three short lines, in margin_left
  // at the fork's latitude — and the mis-aimed manicule pointing at nothing.
  const glossLines = ['Though this be', 'madness, yet there', "is method in't."];
  const GX = 46, GY0 = 377, GLH = 14;
  const glossW = Math.max(...glossLines.map((s) => ink.textW(s, 11, 'roman')));

  // the stooped scholar penning his gloss (faces the text block he misreads)
  film.add(ink.figure({
    id: 's3-polonius', t0: T.start + 2.2, dur: 1.1,
    x: 70, y: 362, h: 40, pose: POSES['polonius-stand'], flip: true,
  }));
  // a neat gloss box, ruled before he writes
  film.add(ink.stroke({
    id: 's3-gloss-box', t0: c06.start - 0.35, dur: 0.55,
    pts: [{ x: GX - 5, y: GY0 - 12 }, { x: GX + glossW + 5, y: GY0 - 12 },
          { x: GX + glossW + 5, y: GY0 + GLH * 2 + 5 }, { x: GX - 5, y: GY0 + GLH * 2 + 5 },
          { x: GX - 5, y: GY0 - 12 }],
    w: 0.7, taper: 0.05, alpha: 0.8,
  }));
  glossLines.forEach((s, i) => {
    const lt0 = c06.start + i * (c06.dur / 3) * 0.98;
    film.add(ink.writeText({
      id: 's3-gloss-' + i, t0: lt0, dur: (c06.dur / 3) * 0.9,
      x: GX, y: GY0 + i * GLH, size: 11, style: 'roman', text: s,
    }));
    film.ev({ t: lt0, type: 'pluck', data: { n: 20 + i } });
  });
  // the manicule: aimed confidently up-left at nothing at all.
  const manT = c06.end - 0.45;
  film.add(ink.manicule({ id: 's3-manicule', t0: manT, dur: 0.9, x: 95, y: 440, size: 22, angle: -0.5 }));
  film.ev({ t: manT, type: 'manicule' });

  // ============================================================ (2) c07 —
  // the couplet on band_fork lines 0-1.
  const coupLines = txt('c07').split(' / ');
  const chars = coupLines.map((s) => s.length), charTot = chars[0] + chars[1];
  let acc = c07.start;
  coupLines.forEach((s, i) => {
    const d = c07.dur * (chars[i] / charTot);
    film.add(ink.writeText({
      id: 's3-c07-' + i, t0: acc, dur: d * 0.97,
      x: colX(F), y: lineY(F, i), size: BODY.size, style: 'italic', text: s,
    }));
    film.ev({ t: acc, type: 'pluck', data: { n: 23 + i } });
    acc += d;
  });

  // -- cross-region duty: the Mousetrap inset's double-ruled border + corner
  // rosettes, scaffolded far below while the rhyme closes. Border only.
  const ib = REGIONS.inset_mousetrap;
  const rectPts = (x, y, w, h) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }];
  const bt0 = c07.start + c07.dur * 0.62;
  film.add(ink.stroke({ id: 's3-inset-outer', t0: bt0, dur: 1.15, pts: rectPts(ib.x, ib.y, ib.w, ib.h), w: 1.2, taper: 0.05 }));
  film.add(ink.stroke({ id: 's3-inset-inner', t0: bt0 + 0.7, dur: 0.95, pts: rectPts(ib.x + 4, ib.y + 4, ib.w - 8, ib.h - 8), w: 0.8, taper: 0.05 }));
  const corners = [[ib.x + 2, ib.y + 2], [ib.x + ib.w - 2, ib.y + 2], [ib.x + ib.w - 2, ib.y + ib.h - 2], [ib.x + 2, ib.y + ib.h - 2]];
  corners.forEach(([cx, cy], ci) => {
    [[5, 0], [0, 5], [-5, 0], [0, -5]].forEach(([dx, dy], pi) => {
      film.add(ink.stroke({
        id: `s3-rosette-${ci}-${pi}`, t0: bt0 + 1.65 + ci * 0.14 + pi * 0.045, dur: 0.28,
        pts: [{ x: cx, y: cy }, { x: cx + dx * 0.6 + dy * 0.12, y: cy + dy * 0.6 + dx * 0.12 }, { x: cx + dx, y: cy + dy }],
        w: 1.1, taper: 0.6,
      }));
    });
  });

  // ============================================================ (3) c08 —
  // 'To be, or not to be' on line 2; at 'question' the stemma erupts.
  const qText = txt('c08');
  film.add(ink.writeText({
    id: 's3-c08', t0: c08.start, dur: c08.dur * 0.98,
    x: colX(F), y: lineY(F, 2), size: BODY.size, style: 'italic', text: qText,
  }));
  film.ev({ t: c08.start, type: 'pluck', data: { n: 25 } });

  const tq = c08.start + c08.dur * (qText.indexOf('question') / qText.length);

  // three branches sharing one curvature family, fanning right and down
  const b1 = ink.branch({ id: 's3-br1', t0: tq, dur: 2.0, x: 340, y: 425, angle: 0.35, len: 130, curl: 0.5, segs: 3, w: 2.2, childSpread: 0.65 });
  const b2 = ink.branch({ id: 's3-br2', t0: tq + 0.88, dur: 2.55, x: 480, y: 445, angle: 0.18, len: 175, curl: 0.45, segs: 3, w: 2.0, childSpread: 0.6 });
  const b3 = ink.branch({ id: 's3-br3', t0: tq + 1.75, dur: 2.3, x: 390, y: 470, angle: 0.52, len: 120, curl: 0.55, segs: 3, w: 2.0, childSpread: 0.65 });
  const e1 = tq + 2.0, e2 = tq + 0.88 + 2.55, e3 = tq + 1.75 + 2.3;
  film.add([b1.mark, b2.mark, b3.mark]);
  film.ev({ t: tq, type: 'branch', data: { id: 's3-br1', dur: 2.0 } });
  film.ev({ t: tq + 0.88, type: 'branch', data: { id: 's3-br2', dur: 2.55 } });
  film.ev({ t: tq + 1.75, type: 'branch', data: { id: 's3-br3', dur: 2.3 } });

  const byX = (a) => a.slice().sort((p, q) => p.x - q.x);
  const t1 = byX(b1.tips);
  const t2 = byX(b2.tips);
  const edgeTip = t2[t2.length - 1];     // rightmost tip races for the page edge
  const t2rest = t2.slice(0, -1);
  const t3 = b3.tips.slice().sort((p, q) => p.y - q.y);
  const footTip = t3[t3.length - 1];     // lowest tip: root of the survivor
  const t3rest = t3.slice(0, -1);

  // faint candidate continuations at the branch tips, light wash
  const labels = [];
  const addLabel = (tip, text, lt0, fx, fy) => {
    if (!tip) return;
    const w = ink.textW(text, 11, 'italic');
    let lx = fx !== undefined ? fx : tip.x + 5;
    let ly = fy !== undefined ? fy : tip.y + 11;
    if (fx === undefined && lx + w > 900) { lx = tip.x - w - 5; }
    const m = ink.writeText({
      id: 's3-lab-' + labels.length, t0: lt0, dur: 0.85,
      x: lx, y: ly, size: 11, style: 'italic', alpha: 0.45, text,
    });
    film.add(m);
    labels.push({ x: lx, y: ly, w, text, t0: lt0 });
  };
  addLabel(t1[0], 'to sleep', e1 + 0.3);
  addLabel(t1[1], 'to dream', e1 + 0.65);
  addLabel(t2rest[0], 'the bare bodkin', e2 + 0.3);
  addLabel(t3rest[0], 'bear those ills we have', e3 + 0.3);
  if (t3rest[1]) addLabel(t3rest[1], 'puzzles the will', e3 + 0.65);
  const spare = [...t2rest.slice(1), ...(t1.length > 2 ? [t1[2]] : []), ...t3rest.slice(2)];
  addLabel(spare[0] || footTip, 'lose the name of action', e3 + 1.0);

  // THE EDGE RULE: the undiscovered-country branch races toward x≈930 —
  // its label cannot fit; the ink simply stops mid-word at the page's edge.
  const extDur = 1.05, extT0 = e2 + 0.05;
  film.add(ink.stroke({
    id: 's3-br-edge', t0: extT0, dur: extDur,
    pts: [{ x: edgeTip.x, y: edgeTip.y },
          { x: edgeTip.x + (925 - edgeTip.x) * 0.34, y: edgeTip.y + 7 },
          { x: edgeTip.x + (925 - edgeTip.x) * 0.7, y: edgeTip.y + 13 },
          { x: 925, y: edgeTip.y + 17 }],
    w: 1.15, taper: 0.5,
  }));
  film.ev({ t: extT0, type: 'branch', data: { id: 's3-br-edge', dur: extDur } });
  const cutText = 'the undiscover';
  const cutW = ink.textW(cutText, 11, 'italic');
  const cutX = Math.max(924, 996 - cutW);
  addLabel(edgeTip, cutText, extT0 + extDur + 0.1, cutX, edgeTip.y + 21);

  // ============================================================ (4) c09 —
  // conscience: subpunct dots under every candidate, branch by branch; the
  // last branch is dotted exactly on 'action'. One heavy strike for the bodkin.
  const ordered = labels.slice().sort((a, b) => a.t0 - b.t0);
  const lose = ordered.splice(ordered.findIndex((l) => l.text.startsWith('lose')), 1)[0];
  const step = (c09.dur - 2.0) / Math.max(1, ordered.length - 1);
  let bodkinDotT = c09.start;
  ordered.forEach((l, i) => {
    const st = c09.start + 0.1 + i * step;
    film.add(ink.subpunct({ id: 's3-sub-' + i, t0: st, dur: 0.7, x: l.x - 1, y: l.y + 4.5, w: l.w + 2 }));
    if (l.text === 'the bare bodkin') bodkinDotT = st;
  });
  film.add(ink.subpunct({ id: 's3-sub-lose', t0: c09.end - 0.95, dur: 0.85, x: lose.x - 1, y: lose.y + 4.5, w: lose.w + 2 }));

  const bodkin = labels.find((l) => l.text === 'the bare bodkin');
  const strikeT = Math.min(bodkinDotT + 0.95, c09.end - 1.2);
  film.add(ink.strike({ id: 's3-strike-bodkin', t0: strikeT, dur: 0.5, x: bodkin.x - 4, y: bodkin.y - 3.5, w: bodkin.w + 9, weight: 4.4 }));
  film.ev({ t: strikeT, type: 'strike' });
  film.ev({ t: c09.end, type: 'strike' });

  // one hairline survives, running out of the diagram's foot toward the
  // waiting inset frame below — the thought that will become the Mousetrap.
  film.add(ink.stroke({
    id: 's3-survivor', t0: c09.end + 0.2, dur: 1.5,
    pts: [{ x: footTip.x, y: footTip.y },
          { x: footTip.x + (470 - footTip.x) * 0.45, y: footTip.y + (597 - footTip.y) * 0.4 },
          { x: 478, y: 572 },
          { x: 470, y: 597 }],
    w: 1.05, taper: 0.35,
  }));

  // ============================================================ camera —
  // down-left to the misfiled gloss (the joke framed, never followed); back to
  // the column; the thicket framed off-center left; a steady track right as one
  // branch races to the page edge; punch out to the whole dead fan; glide down
  // toward the inset for s4.
  film.cam([
    CAM(T.start, 500, 330, 380),
    CAM(c06.start + 1.7, 290, 400, 540),           // gloss + manicule in frame
    CAM(c06.end + 1.2, 290, 400, 540),             // the beat on the mis-aimed finger
    CAM(c07.start + 2.2, 420, 390, 470, 'linear'), // pointedly back to the column
    CAM(c08.start, 430, 415, 480),
    CAM(tq, 438, 424, 470),
    CAM(tq + 4.35, 685, 448, 620, 'linear'),       // tracking the edge-racer
    CAM(tq + 6.1, 685, 448, 620),                  // hold: ink stops mid-word
    CAM(c09.start + 3.5, 520, 440, 560),           // the whole dead fan
    CAM(c09.end - 0.95, 520, 440, 560),
    CAM(T.end, 520, 560, 520),                     // gliding toward the inset
  ]);
}
