// scene s7 — THE WAGER: the duel as typography.
// Two hands enter the band in opposing styles, cross rapier-strokes, SWAP styles
// (the exchanged rapiers), and three deaths commit to the ledger in twenty seconds.
import { INK, PAGE, rnd } from '../engine.js';
import * as ink from '../ink.js';
import { POSES } from '../figures.js';
import { REGIONS, ANCHORS, BODY, lineY, colX, CAM } from '../layout.js';

export function build(film, T, ctx) {
  const c23 = T.cues.c23, c24 = T.cues.c24, c25 = T.cues.c25, c26 = T.cues.c26;
  const S = T.start;
  let lineN = 70;
  const pluck = (t) => film.ev({ t, type: 'pluck', data: { n: lineN++ } });

  // ================================================== (1) THE ARENA (209.5–214)
  // The metronome doubles; two text indents converge on one baseline.
  film.ev({ t: S, type: 'tickrate', data: { rate: 2 } });

  // Hamlet's hand: italic, entering from the LEFT.
  film.add(ink.writeText({
    id: 's7-arena-ham', t0: S + 0.4, dur: 1.3, x: 190, y: 1272,
    size: 15, style: 'italic', jitter: 1.2, text: 'Come on, sir.',
  }));
  pluck(S + 0.4);

  // Laertes's hand: roman — the opposing style — entering from the RIGHT.
  film.add(ink.writeText({
    id: 's7-arena-laer', t0: S + 1.0, dur: 1.3, x: 740, y: 1272, align: 'right',
    size: 15, style: 'roman', jitter: 1.2, text: 'Come, my lord.',
  }));
  pluck(S + 1.0);

  // The crossed rapier strokes — an X between the columns, just clear of s6's
  // 'Let be.' (which holds the band's exact centre). After this, the styles
  // swap: Hamlet writes roman, Laertes italic, both venom-thin.
  film.add(ink.stroke({
    id: 's7-rapierA', t0: S + 1.5, dur: 0.22, w: 1.6, taper: 0.22,
    pts: [{ x: 497, y: 1281 }, { x: 524, y: 1274 }, { x: 551, y: 1268 }, { x: 575, y: 1263 }],
  }));
  film.ev({ t: S + 1.5, type: 'strike' });
  film.add(ink.stroke({
    id: 's7-rapierB', t0: S + 1.8, dur: 0.22, w: 1.6, taper: 0.22,
    pts: [{ x: 499, y: 1263 }, { x: 526, y: 1270 }, { x: 552, y: 1276 }, { x: 575, y: 1281 }],
  }));
  film.ev({ t: S + 1.8, type: 'strike' });

  // ================================================== (3) c23 — GERTRUDE
  // Her line cuts DIAGONALLY across both columns: three steps down-right.
  film.add(ink.writeText({
    id: 's7-c23a', t0: c23.start, dur: 2.2, x: 262, y: 1267,
    size: 14, style: 'italic', jitter: 1.3, text: 'No, no, the drink, the drink...',
  }));
  pluck(c23.start);
  film.add(ink.writeText({
    id: 's7-c23b', t0: c23.start + 2.5, dur: 1.7, x: 322, y: 1280,
    size: 14, style: 'italic', jitter: 1.3, text: 'O my dear Hamlet...',
  }));
  pluck(c23.start + 2.5);
  film.add(ink.writeText({
    id: 's7-c23c', t0: c23.start + 4.4, dur: c23.dur - 4.45, x: 430, y: 1293,
    size: 14, style: 'italic', jitter: 1.3, text: "the drink, the drink! I am poison'd.",
  }));
  pluck(c23.start + 4.4);

  // The tipped cup: three thin rubric strokes forming a chalice fallen on its
  // side above her line's head, mouth toward the margin.
  const cupT = c23.start + 0.4;
  film.add(ink.stroke({
    id: 's7-cup-bowl', t0: cupT, dur: 0.35, w: 1.1, color: INK.rubric, taper: 0.2,
    pts: [{ x: 235, y: 1241 }, { x: 242, y: 1240 }, { x: 247, y: 1245 },
          { x: 246.5, y: 1251 }, { x: 240, y: 1254.5 }],
  }));
  film.add(ink.stroke({
    id: 's7-cup-stem', t0: cupT + 0.3, dur: 0.25, w: 1.1, color: INK.rubric, taper: 0.2,
    pts: [{ x: 247, y: 1248 }, { x: 253, y: 1245 }],
  }));
  film.add(ink.stroke({
    id: 's7-cup-foot', t0: cupT + 0.55, dur: 0.25, w: 1.1, color: INK.rubric, taper: 0.2,
    pts: [{ x: 251, y: 1240.5 }, { x: 255, y: 1248 }],
  }));

  // The ink bead at the cup's mouth, and the hairline running LEFT to the
  // ledger — reaching seal 3 exactly as it sets.
  film.add(ink.blot({
    id: 's7-c23-bead', t0: c23.start + 1.8, dur: 0.9, x: 231, y: 1252, r: 1.6, tendrils: 0,
  }));
  const hb3 = c23.end + 0.5;
  const runT0 = c23.start + 2.2;
  film.add(ink.stroke({
    id: 's7-c23-run', t0: runT0, dur: hb3 - runT0, w: 0.7, taper: 0.08,
    pts: [{ x: 231, y: 1253 }, { x: 202, y: 1259 }, { x: 168, y: 1263 },
          { x: 128, y: 1267 }, { x: 96, y: 1270 }],
  }));

  // HEARTBEAT 3 — Gertrude. Seal 3 stamps; her figure sinks in the right gutter.
  film.ev({ t: hb3, type: 'heartbeat' });
  film.add(ink.waxSeal({ id: 's7-seal3', t0: hb3, x: ANCHORS.seal3.x, y: ANCHORS.seal3.y, r: 10 }));
  film.add(ink.figure({
    id: 's7-fig-gertrude', t0: hb3, dur: 0.9, x: 770, y: 1270, h: 36,
    pose: POSES['gertrude-fall'],
  }));

  // ================================================== (4) c24 — LAERTES
  // Post-swap: his hand is italic now, deteriorating (jitter 2.2), venom-thin.
  film.add(ink.writeText({
    id: 's7-c24a', t0: c24.start, dur: 3.4, x: 740, y: 1252, align: 'right',
    size: 13.5, style: 'italic', jitter: 2.2, alpha: 0.7,
    text: 'It is here, Hamlet: Hamlet, thou art slain...',
  }));
  pluck(c24.start);
  const c24bT = c24.start + 5.0;
  film.add(ink.writeText({
    id: 's7-c24b', t0: c24bT, dur: c24.end - c24bT, x: 640, y: 1264, align: 'right',
    size: 13.5, style: 'italic', jitter: 2.2, alpha: 0.7,
    text: "the king, the king's to blame.",
  }));
  pluck(c24bT);

  // THE ACCUSATION HAIRLINE: from his words' end, left and up, splicing into
  // the red rule — attribution, at last, in writing.
  film.add(ink.stroke({
    id: 's7-c24-accuse', t0: c24.start + 5.7, dur: 2.4, w: 0.7, taper: 0.1,
    pts: [{ x: 641, y: 1262 }, { x: 655, y: 1252 }, { x: 652, y: 1240 },
          { x: 625, y: 1231 }, { x: 520, y: 1227 }, { x: 360, y: 1227 },
          { x: 240, y: 1231 }, { x: 176, y: 1236 }, { x: ANCHORS.redRuleX, y: 1240 }],
  }));

  // ================================================== (5) c25 + THE SACRED LINE
  film.ev({ t: c25.start, type: 'tickrate', data: { rate: 4 } });

  // Hamlet, post-swap: roman now (the exchanged rapier), venom-thin.
  film.add(ink.writeText({
    id: 's7-c25', t0: c25.start, dur: c25.dur, x: 200, y: 1300,
    size: 15, style: 'roman', jitter: 1.2, alpha: 0.7,
    text: "The point envenom'd too! Then, venom, to thy work.",
  }));
  pluck(c25.start);

  // 'Hurts the King.' — the sacred Folio direction. Written, never spoken.
  // Plain iron ink; the gold belongs to s8 alone.
  const sacredT = c25.end + 0.8;
  film.add(ink.writeText({
    id: 's7-hurts', t0: sacredT, dur: 1.2,
    x: ANCHORS.hurtsTheKing.x, y: ANCHORS.hurtsTheKing.y, align: 'right',
    size: 16, style: 'italic', jitter: 0.8, text: 'Hurts the King.',
  }));
  pluck(sacredT);

  // HEARTBEAT 4 — Claudius. Seal 4; his figure dead in the right gutter.
  const hb4 = c25.end + 2.2;
  film.ev({ t: hb4, type: 'heartbeat' });
  film.add(ink.waxSeal({ id: 's7-seal4', t0: hb4, x: ANCHORS.seal4.x, y: ANCHORS.seal4.y, r: 10 }));
  film.add(ink.figure({
    id: 's7-fig-claudius', t0: hb4, dur: 0.8, x: 770, y: 1300, h: 30,
    pose: POSES['claudius-dead'],
  }));

  // ================================================== (6) c26 — FORGIVENESS
  // The crossed hands uncross: one merged, centered baseline, a neutral hand.
  film.add(ink.writeText({
    id: 's7-c26', t0: c26.start, dur: c26.dur, x: 460, y: 1316, align: 'center',
    size: 14, style: 'roman', jitter: 1.0, alpha: 0.85,
    text: 'Exchange forgiveness with me, noble Hamlet.',
  }));
  pluck(c26.start);

  // The metronome released; HEARTBEAT 5 — Laertes. Seal 5; his faded lunge.
  film.ev({ t: c26.end, type: 'tickrate', data: { rate: 1 } });
  const hb5 = c26.end + 0.5;
  film.ev({ t: hb5, type: 'heartbeat' });
  film.add(ink.waxSeal({ id: 's7-seal5', t0: hb5, x: ANCHORS.seal5.x, y: ANCHORS.seal5.y, r: 10 }));
  film.add(ink.figure({
    id: 's7-fig-laertes', t0: hb5, dur: 0.8, x: 770, y: 1330, h: 30,
    pose: POSES['laertes-lunge'], alpha: 0.5, flip: true,
  }));

  // ================================================== CAMERA
  film.cam([
    CAM(S, 520, 1230, 300),                      // opening — handed off from s6
    CAM(S + 2.3, 465, 1260, 560),                // widen: the whole arena, both hands
    CAM(S + 3.5, 465, 1260, 560),                // hold through the rapier X
    CAM(c23.start + 0.6, 340, 1265, 290, 'out'), // punch-in: the tipped cup
    CAM(c23.start + 5.8, 450, 1286, 330),        // drift down-right with her diagonal
    CAM(c23.end + 1.45, 470, 1282, 340),         // hold through heartbeat 3
    CAM(c24.start + 1.6, 595, 1266, 310),        // over to Laertes's confession
    CAM(c24.start + 5.2, 600, 1264, 300),        // hold as the accusation begins
    CAM(c24.start + 5.9, 612, 1258, 270, 'out'), // punch-in: the hairline launches
    CAM(c25.start + 0.2, 343, 1246, 380),        // follow it left to the red-rule splice
    CAM(c25.end - 0.05, 545, 1290, 360),         // drift down-right along c25's line
    CAM(c25.end + 0.75, 620, 1297, 300, 'out'),  // punch-in: the sacred line writes
    CAM(c26.end - 1.0, 540, 1300, 300),          // pull to the merged baseline
    CAM(T.end, 540, 1300, 300),                  // hold — s8 dives to the period from here
  ]);
}
