// scene s6 — The Readiness. The eye of the film: maximum white space, minimum events.
import * as ink from '../ink.js';
import { REGIONS, lineY, CAM } from '../layout.js';

export function build(film, T, ctx) {
  const R = REGIONS.band_readiness;
  const cx = 460;                      // band center — everything here is centered
  const text = id => ctx.cues.find(q => q.id === id).text;

  // ---- c20: the sparrow — line 0, centered, italic 16, no annotation
  const c20 = T.cues.c20;
  film.add(ink.writeText({
    id: 's6-c20', t0: c20.start, dur: c20.dur,
    x: cx, y: lineY(R, 0), size: 16, style: 'italic', align: 'center',
    text: text('c20'),
  }));
  film.ev({ t: c20.start, type: 'pluck', data: { n: 20 } });

  // ---- c21: the clause-chain — wrapped to lines 1–2, split at '; if it be not now,'
  const c21 = T.cues.c21;
  const full = text('c21');
  const cut = full.indexOf('if it be not now');
  const lineA = full.slice(0, cut).trimEnd();   // "...; if it be not to come, it will be now;"
  const lineB = full.slice(cut);                // "if it be not now, ... the readiness is all."
  const wA = ink.textW(lineA, 16, 'italic'), wB = ink.textW(lineB, 16, 'italic');
  const durA = c21.dur * wA / (wA + wB);
  film.add(ink.writeText({
    id: 's6-c21a', t0: c21.start, dur: durA,
    x: cx, y: lineY(R, 1), size: 16, style: 'italic', align: 'center',
    text: lineA,
  }));
  film.ev({ t: c21.start, type: 'pluck', data: { n: 21 } });
  film.add(ink.writeText({
    id: 's6-c21b', t0: c21.start + durA, dur: c21.dur - durA,
    x: cx, y: lineY(R, 2), size: 16, style: 'italic', align: 'center',
    text: lineB,
  }));
  film.ev({ t: c21.start + durA, type: 'pluck', data: { n: 22 } });

  // ---- one full blank line of vellum, then c22: 'Let be.' alone, smaller
  const c22 = T.cues.c22;
  film.add(ink.writeText({
    id: 's6-c22', t0: c22.start, dur: c22.dur,
    x: cx, y: lineY(R, 3.45), size: 13, style: 'italic', align: 'center',
    text: text('c22'),
  }));
  film.ev({ t: c22.start, type: 'pluck', data: { n: 23 } });

  // ---- the hard cut: everything stops when 'Let be.' lands. The quill lifts.
  film.ev({ t: c22.end, type: 'mute', data: { dur: 2.2 } });
  // From here to T.end: nothing writes. The film breathes.

  // ---- camera: the film's calmest move. One slow drift in, then on toward the duel.
  // Biased left as c20 begins (the line starts at page x~237) so its opening words
  // write on-screen, then a gentle glide right so '...sparrow.' lands in frame too.
  film.cam(CAM(T.start, 500, 1190, 420));
  film.cam(CAM(c20.start, 434, 1191, 410));    // left edge ~229: 'Not a whit,' writes in frame
  film.cam(CAM(c20.end, 495, 1194, 386));      // drift with the nib; line's end stays visible
  film.cam(CAM(c22.end, 480, 1200, 330));      // arrives as 'Let be.' lands
  film.cam(CAM(T.end, 520, 1230, 300));        // aimed at where the duel will begin
}
