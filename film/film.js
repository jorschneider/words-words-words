// The film: eight scenes on one page, plus the page's global apparatus.
import { Film, INK, PAGE, rnd } from './engine.js';
import { TIMELINE } from './timeline.js';
import { REGIONS, ANCHORS } from './layout.js';
import { build as s1 } from './scenes/s1.js';
import { build as s2 } from './scenes/s2.js';
import { build as s3 } from './scenes/s3.js';
import { build as s4 } from './scenes/s4.js';
import { build as s5 } from './scenes/s5.js';
import { build as s6 } from './scenes/s6.js';
import { build as s7 } from './scenes/s7.js';
import { build as s8 } from './scenes/s8.js';

const SCENES = [s1, s2, s3, s4, s5, s6, s7, s8];

// Global apparatus: the telemetry gutter that lives across all scenes.
function addGlobals(film, cues) {
  const G = REGIONS.telemetry;
  const D = TIMELINE.duration;

  // pricking holes — the ruler's apparatus, also the tick track
  film.add({
    id: 'g-pricks', t0: 0.2, dur: 2, static: true,
    bbox: [G.x - 4, G.y - 4, G.w + 8, G.h + 8],
    draw(g, p) {
      g.save(); g.fillStyle = 'rgba(42,33,24,0.5)';
      const n = 40;
      for (let i = 0; i < n; i++) {
        if (i / n > p) break;
        const y = G.y + (i + 0.5) / n * G.h;
        g.beginPath(); g.arc(G.x + G.w * 0.3, y, 1.1, 0, 7); g.fill();
      }
      g.restore();
    },
  });

  // token-ruler beneath the title: 31 hairline ticks, one inks in as each cue begins
  const ticks = cues.map((c, i) => ({ x: 160 + i / (cues.length - 1) * 680, t: c.start }));
  film.add({
    id: 'g-token-ruler', t0: 6, dur: D, static: false,
    bbox: [150, 116, 700, 12],
    draw(g, p, t) {
      g.save();
      g.strokeStyle = 'rgba(42,33,24,0.85)'; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(155, 122); g.lineTo(845, 122); g.stroke();
      for (const tk of ticks) {
        g.globalAlpha = t >= tk.t ? 0.9 : 0.25;
        g.lineWidth = t >= tk.t ? 1.1 : 0.6;
        g.beginPath(); g.moveTo(tk.x, 118.5); g.lineTo(tk.x, 125.5); g.stroke();
      }
      g.restore();
    },
  });

  // context-budget bar: drains top to bottom over the film, ending ~15%
  film.add({
    id: 'g-budget', t0: 2, dur: D, static: false,
    bbox: [G.x + G.w * 0.55 - 3, G.y - 4, 8, G.h + 8],
    draw(g, p, t) {
      const remain = 1 - 0.85 * Math.min(1, t / (D * 0.97));
      const x = G.x + G.w * 0.62;
      g.save();
      g.strokeStyle = 'rgba(42,33,24,0.35)'; g.lineWidth = 0.6;
      g.strokeRect(x - 2.2, G.y, 4.4, G.h);
      g.fillStyle = 'rgba(42,33,24,0.55)';
      g.fillRect(x - 1.4, G.y + G.h * (1 - remain), 2.8, G.h * remain);
      g.restore();
    },
  });
}

export function buildFilm(cues) {
  const film = new Film();
  film.duration = TIMELINE.duration;
  const ctx = { cues };

  addGlobals(film, cues);
  SCENES.forEach((build, i) => build(film, TIMELINE.scenes[i], ctx));

  // curves for the score: the fifth stays suspended (slightly detuned) for the whole
  // film — the instruction is never resolved — and returns to a pure fifth only under
  // the coda's attestation, the film's one consonant minute.
  film.curves = {
    commandSat: (t) => (t < 275 ? 0.72 : Math.min(1, 0.72 + (t - 275) / 6 * 0.28)),
    pedalLevel: (t) => (t < 16 ? 0 : t < 179 ? 0.5 : t < 209 ? 0.3 : t < 270 ? 0.5 : 0.65),
    roomTone: (t) => (t < 1 ? 0 : t > 270.8 && t < 275 ? 0 : 0.3),
  };

  return film.seal();
}
