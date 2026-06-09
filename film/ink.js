// WORDS, WORDS, WORDS — the ink kit
// Every helper returns a mark: { id, t0, dur, draw(g,p,t), bbox, static, ephemeral }
// All randomness is seeded by mark id: the same t always renders the same frame.

import { INK, rnd, clamp01, lerp, smooth, easeOut, easeIn } from './engine.js';

// ------------------------------------------------------------ measuring

const measCv = document.createElement('canvas');
const meas = measCv.getContext('2d');
const widthCache = new Map();

export function fontStr(size, style) {
  if (style === 'sc') return `${size}px "IM Fell English SC", serif`;
  if (style === 'italic') return `italic ${size}px "IM Fell English", serif`;
  return `${size}px "IM Fell English", serif`;
}
export function glyphW(ch, size, style) {
  const key = style + '' + ch;
  let unit = widthCache.get(key);
  if (unit === undefined) {
    meas.font = fontStr(100, style);
    unit = meas.measureText(ch).width / 100;
    widthCache.set(key, unit);
  }
  return unit * size;
}
export function textW(text, size, style, spacing = 0) {
  let w = 0;
  for (const ch of text) w += glyphW(ch, size, style) + spacing;
  return w;
}

// ------------------------------------------------------------ nib strokes

// Resample a polyline into even steps with cumulative length.
function resample(pts, step = 3) {
  const out = [{ ...pts[0], s: 0 }];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(d / step));
    for (let j = 1; j <= n; j++) {
      const u = j / n;
      acc += d / n;
      out.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), s: acc });
    }
  }
  return out;
}

// Draw a variable-width ink ribbon along pts, up to fraction p of its length.
export function drawNib(g, pts, { w = 2.2, color = INK.iron, seed = 'nib', taper = 0.35, spread = 1.35, alpha = 1 } = {}, p = 1) {
  if (pts.length < 2 || p <= 0) return;
  const rs = resample(pts);
  const L = rs[rs.length - 1].s, lim = L * clamp01(p);
  const drawn = rs.filter(q => q.s <= lim);
  if (drawn.length < 2) return;
  const left = [], right = [];
  for (let i = 0; i < drawn.length; i++) {
    const q = drawn[i];
    const q0 = drawn[Math.max(0, i - 1)], q1 = drawn[Math.min(drawn.length - 1, i + 1)];
    let nx = -(q1.y - q0.y), ny = q1.x - q0.x;
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const u = q.s / L;
    let width = w * (0.78 + 0.44 * rnd(seed, Math.floor(q.s / 7)));
    width *= (1 + (spread - 1) * (Math.exp(-q.s / (w * 4)) + Math.exp(-(L - q.s) / (w * 4)))); // ink pools at ends
    if (u < taper * 0.4) width *= smooth(u / (taper * 0.4)) * 0.7 + 0.3;
    left.push({ x: q.x + nx * width / 2, y: q.y + ny * width / 2 });
    right.push({ x: q.x - nx * width / 2, y: q.y - ny * width / 2 });
  }
  g.save();
  g.globalAlpha *= alpha;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(left[0].x, left[0].y);
  for (const q of left) g.lineTo(q.x, q.y);
  for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i].x, right[i].y);
  g.closePath();
  g.fill();
  // wet front: a small blob at the leading point while drawing
  if (p < 1) {
    const tip = drawn[drawn.length - 1];
    g.beginPath(); g.arc(tip.x, tip.y, w * 0.85, 0, 7); g.fill();
  }
  g.restore();
}

function ptsBBox(pts, pad = 6) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const q of pts) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
  return [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
}

export function stroke({ id, t0, dur = 0.5, pts, w = 2.2, color = INK.iron, taper = 0.35, alpha = 1, ease = easeOut, ephemeral = false }) {
  return {
    id, t0, dur, static: !ephemeral, ephemeral,
    bbox: ptsBBox(pts, w * 2 + 4),
    draw(g, p) { drawNib(g, pts, { w, color, seed: id, taper, alpha }, ease(p)); },
  };
}

// ------------------------------------------------------------ written text

// Text that writes itself glyph by glyph, with per-glyph scribal jitter.
export function writeText({ id, t0, dur, x, y, size = 16, style = 'italic', color = INK.iron, text, align = 'left',
  jitter = 1, spacing = 0, alpha = 1, ghosted = false, outline = false }) {
  const glyphs = [...text];
  const widths = glyphs.map(ch => glyphW(ch, size, style) + spacing);
  const total = widths.reduce((a, b) => a + b, 0);
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const f = fontStr(size, style);
  const col = ghosted ? INK.ghost : color;
  return {
    id, t0, dur, static: true,
    bbox: [x0 - 4, y - size * 1.05, total + 8, size * 1.5],
    w: total,
    draw(g, p) {
      g.save();
      g.font = f; g.textBaseline = 'alphabetic';
      let gx = x0;
      const n = glyphs.length;
      for (let i = 0; i < n; i++) {
        const a0 = i / n, a1 = (i + 0.9) / n;
        const ga = clamp01((p - a0) / Math.max(1e-6, (a1 - a0)));
        if (ga > 0) {
          const jx = (rnd(id, i * 4) - 0.5) * 0.9 * jitter;
          const jy = (rnd(id, i * 4 + 1) - 0.5) * 1.1 * jitter;
          const jr = (rnd(id, i * 4 + 2) - 0.5) * 0.045 * jitter;
          const inkVar = 0.86 + 0.14 * rnd(id, i * 4 + 3);
          g.globalAlpha = alpha * ga * inkVar;
          if (outline) { g.strokeStyle = col; g.lineWidth = Math.max(0.5, size * 0.035); }
          else g.fillStyle = col;
          const put = (ch, px, py) => outline ? g.strokeText(ch, px, py) : g.fillText(ch, px, py);
          if (jr !== 0) {
            g.save(); g.translate(gx + jx, y + jy); g.rotate(jr);
            put(glyphs[i], 0, 0); g.restore();
          } else {
            put(glyphs[i], gx + jx, y + jy);
          }
        }
        gx += widths[i];
      }
      g.restore();
    },
  };
}

// Static (already-set) type, with optional letterpress bite.
export function setType({ id, t0, dur = 0.8, x, y, size, style = 'roman', color = INK.iron, text, align = 'center', bite = 0, alpha = 1 }) {
  const w = textW(text, size, style);
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const f = fontStr(size, style);
  return {
    id, t0, dur, static: true,
    bbox: [x0 - 4, y - size * 1.05, w + 8, size * 1.5],
    w,
    draw(g, p) {
      g.save();
      g.font = f; g.textBaseline = 'alphabetic';
      g.globalAlpha = alpha * smooth(clamp01(p));
      if (bite > 0) { g.fillStyle = 'rgba(42,33,24,0.28)'; g.fillText(text, x0 + bite, y + bite); }
      g.fillStyle = color;
      g.fillText(text, x0, y);
      g.restore();
    },
  };
}

// ------------------------------------------------------------ strikethrough

export function strike({ id, t0, dur = 0.45, x, y, w, color = INK.iron, weight = 3.4, double_ = false }) {
  const pts1 = [], n = 8;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts1.push({ x: x - w * 0.03 + w * 1.06 * u, y: y + (rnd(id, i) - 0.5) * 4 - u * 1.5 });
  }
  const marks = [{ pts: pts1, w: weight }];
  if (double_) {
    const pts2 = pts1.map((q, i) => ({ x: q.x + 3, y: q.y + 5 + (rnd(id + 'b', i) - 0.5) * 3 }));
    marks.push({ pts: pts2, w: weight * 0.8 });
  }
  return {
    id, t0, dur, static: true,
    bbox: [x - 10, y - 12, w + 20, 26],
    draw(g, p) {
      const pp = easeIn(clamp01(p));
      drawNib(g, marks[0].pts, { w: marks[0].w, color, seed: id, taper: 0.15 }, Math.min(1, pp * (double_ ? 2 : 1)));
      if (double_ && pp > 0.5) drawNib(g, marks[1].pts, { w: marks[1].w, color, seed: id + 'b', taper: 0.15 }, (pp - 0.5) * 2);
    },
  };
}

// ------------------------------------------------------------ arbor branches

// A botanical deliberation branch. Returns { mark, tips } — tips are where labels go.
export function branch({ id, t0, dur, x, y, angle = -Math.PI / 2, len = 120, curl = 0.5, segs = 3, w = 2.4, color = INK.iron, childSpread = 0.85 }) {
  const paths = [], tips = [];
  function grow(px, py, ang, L, depth, key, u0, u1) {
    const pts = [{ x: px, y: py }];
    let cx = px, cy = py, ca = ang;
    const steps = 7;
    const bend = (rnd(key, 0) - 0.5) * curl * 2;
    for (let i = 1; i <= steps; i++) {
      ca += bend / steps + (rnd(key, i) - 0.5) * 0.12;
      cx += Math.cos(ca) * (L / steps); cy += Math.sin(ca) * (L / steps);
      pts.push({ x: cx, y: cy });
    }
    paths.push({ pts, w: w * Math.pow(0.72, depth), u0, u1, key });
    if (depth < segs - 1) {
      const nKids = depth === 0 ? 2 : 1 + (rnd(key, 99) > 0.5 ? 1 : 0);
      for (let k = 0; k < nKids; k++) {
        const at = 0.55 + 0.45 * rnd(key, 50 + k);
        const idx = Math.min(pts.length - 1, Math.floor(at * pts.length));
        const branchAng = ca + (k % 2 === 0 ? 1 : -1) * childSpread * (0.5 + rnd(key, 60 + k) * 0.7);
        const span = (u1 - u0);
        grow(pts[idx].x, pts[idx].y, branchAng, L * (0.55 + 0.2 * rnd(key, 70 + k)), depth + 1,
          key + ':' + k, u0 + span * (0.35 + 0.2 * k), u0 + span * (0.75 + 0.25 * Math.min(1, k)));
      }
    } else {
      tips.push({ x: cx, y: cy, angle: ca });
    }
  }
  grow(x, y, angle, len, 0, id, 0, 1);
  const all = paths.flatMap(p => p.pts);
  const mark = {
    id, t0, dur, static: true,
    bbox: ptsBBox(all, 10),
    draw(g, p) {
      for (const path of paths) {
        const lp = clamp01((p - path.u0) / Math.max(1e-6, path.u1 - path.u0));
        if (lp > 0) drawNib(g, path.pts, { w: path.w, color, seed: path.key, taper: 0.5 }, easeOut(lp));
      }
    },
  };
  return { mark, tips };
}

// ------------------------------------------------------------ manicule ☞

export function manicule({ id, t0, dur = 0.9, x, y, size = 22, angle = 0, color = INK.rubric }) {
  const s = size / 24;
  const P = (px, py) => {
    const rx = px * s, ry = py * s;
    return { x: x + rx * Math.cos(angle) - ry * Math.sin(angle), y: y + rx * Math.sin(angle) + ry * Math.cos(angle) };
  };
  const strokes = [
    [P(-22, -2), P(-10, -4), P(-2, -4)],                       // cuff top
    [P(-22, 8), P(-12, 9), P(-3, 8)],                          // cuff bottom
    [P(-22, -2), P(-22, 8)],                                   // cuff end
    [P(-2, -4), P(2, -6), P(22, -5), P(23, -3), P(4, -1)],     // index finger
    [P(-2, -4), P(-3, 8), P(2, 9), P(6, 5), P(4, -1)],         // curled fingers / palm
    [P(0, 1), P(5, 2)], [P(0, 4), P(5, 5)],                    // knuckle hints
  ];
  return {
    id, t0, dur, static: true,
    bbox: [x - size * 1.1, y - size * 0.5, size * 2.2, size],
    draw(g, p) {
      const n = strokes.length;
      strokes.forEach((pts, i) => {
        const lp = clamp01((p * n - i));
        if (lp > 0) drawNib(g, pts, { w: 1.6 * s, color, seed: id + i, taper: 0.3 }, lp);
      });
    },
  };
}

// ------------------------------------------------------------ the blot

export function blot({ id, t0, dur = 1.6, x, y, r = 26, color = INK.iron, tendrils = 3 }) {
  const harms = [];
  for (let k = 0; k < 5; k++) harms.push({ k: k + 2, a: 0.08 + 0.1 * rnd(id, k), ph: rnd(id, k + 10) * 7 });
  const tend = [];
  for (let i = 0; i < tendrils; i++) {
    const a = rnd(id, 30 + i) * Math.PI * 2;
    const L = r * (1.2 + rnd(id, 40 + i) * 1.3);
    const pts = [];
    for (let j = 0; j <= 6; j++) {
      const u = j / 6;
      pts.push({
        x: x + Math.cos(a + u * 0.5 * (rnd(id, 50 + i) - 0.5)) * (r * 0.6 + L * u),
        y: y + Math.sin(a + u * 0.5 * (rnd(id, 55 + i) - 0.5)) * (r * 0.6 + L * u) + u * u * 6,
      });
    }
    tend.push({ pts, w: 3.5 * (1 - i * 0.2), delay: 0.4 + i * 0.18 });
  }
  return {
    id, t0, dur, static: true,
    bbox: [x - r * 3, y - r * 3, r * 6, r * 6],
    draw(g, p, t) {
      const pr = easeOut(clamp01(p));
      const R = r * (0.25 + 0.75 * pr);
      g.save();
      g.fillStyle = color;
      g.globalAlpha = 0.94;
      g.beginPath();
      const N = 44;
      for (let i = 0; i <= N; i++) {
        const th = i / N * Math.PI * 2;
        let rr = R;
        for (const h of harms) rr *= 1 + h.a * Math.sin(h.k * th + h.ph);
        const px = x + Math.cos(th) * rr, py = y + Math.sin(th) * rr * 1.06;
        i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.closePath(); g.fill();
      // bleed halo — soft, like ink wicking into fiber
      const halo = g.createRadialGradient(x, y, R * 0.8, x, y, R * 1.7);
      halo.addColorStop(0, 'rgba(42,33,24,0.18)');
      halo.addColorStop(1, 'rgba(42,33,24,0)');
      g.globalAlpha = pr;
      g.fillStyle = halo;
      g.beginPath(); g.arc(x, y, R * 1.7, 0, 7); g.fill();
      g.restore();
      for (const td of tend) {
        const lp = clamp01((p - td.delay) / (1 - td.delay));
        if (lp > 0) drawNib(g, td.pts, { w: td.w, color, seed: id + 'td', taper: 0.7 }, easeOut(lp));
      }
    },
  };
}

// ------------------------------------------------------------ marginal figures
// UPA limited animation: 2-3 stroke characters defined as poses in a unit box.
// Pose data lives in figures.js; this renders one pose, drawn on over dur.

export function figure({ id, t0, dur = 0.8, x, y, h = 46, pose, color = INK.iron, flip = false, alpha = 1, weight = 1 }) {
  // pose: { strokes: [{pts:[[x,y]...], w}], accents: [{pts, w, color}] }
  const s = h;
  const tx = (px) => x + (flip ? (1 - px) - 0.5 : px - 0.5) * s * 0.72;
  const ty = (py) => y + (py - 1) * s;
  const allPts = [];
  const conv = (st) => st.pts.map(([px, py]) => ({ x: tx(px), y: ty(py) }));
  const strokes = pose.strokes.map(st => ({ pts: conv(st), w: (st.w || 2.2) * weight * (h / 46) }));
  const accents = (pose.accents || []).map(st => ({ pts: conv(st), w: (st.w || 2) * weight * (h / 46), color: st.color }));
  strokes.forEach(st => allPts.push(...st.pts)); accents.forEach(st => allPts.push(...st.pts));
  return {
    id, t0, dur, static: true,
    bbox: ptsBBox(allPts, 8),
    draw(g, p) {
      const n = strokes.length + accents.length;
      let i = 0;
      for (const st of strokes) {
        const lp = clamp01(p * n - i); i++;
        if (lp > 0) drawNib(g, st.pts, { w: st.w, color, seed: id + i, taper: 0.4, alpha }, easeOut(lp));
      }
      for (const st of accents) {
        const lp = clamp01(p * n - i); i++;
        if (lp > 0) drawNib(g, st.pts, { w: st.w, color: st.color || INK.rubric, seed: id + i, taper: 0.4, alpha }, easeOut(lp));
      }
    },
  };
}

// ------------------------------------------------------------ scrape (palimpsest eviction)

export function scrape({ id, t0, dur = 3, x, y, w, h, strength = 0.78 }) {
  const rows = Math.max(3, Math.round(h / 7));
  return {
    id, t0, dur, static: true,
    bbox: [x - 6, y - 6, w + 12, h + 12],
    draw(g, p) {
      const pr = clamp01(p);
      g.save();
      g.strokeStyle = INK.parchment;
      g.lineCap = 'round';
      for (let i = 0; i < rows; i++) {
        const rp = clamp01(pr * rows * 0.7 - i * 0.55);
        if (rp <= 0) continue;
        const yy = y + (i + 0.5) / rows * h + (rnd(id, i) - 0.5) * 3;
        g.globalAlpha = strength * rp;
        g.lineWidth = h / rows * (0.95 + 0.35 * rnd(id, i + 50));
        g.beginPath();
        g.moveTo(x - 4 + rnd(id, i + 100) * 6, yy);
        g.lineTo(x + w * rp + (rnd(id, i + 150) - 0.5) * 8, yy + (rnd(id, i + 200) - 0.5) * 2.5);
        g.stroke();
      }
      g.restore();
    },
  };
}

// ------------------------------------------------------------ letter-flake particles

// Glyphs flake off a region, fall, sway, and pool at landY. They persist (the brook).
export function letterFall({ id, t0, dur = 6, glyphs, x, y, w, landY, size = 11, color = INK.ghost, drift = 30 }) {
  const parts = glyphs.map((ch, i) => {
    const bx = x + rnd(id, i * 7) * w;
    const delay = rnd(id, i * 7 + 1) * dur * 0.45;
    const fall = 2.2 + rnd(id, i * 7 + 2) * 2.4;
    return {
      ch, bx, by: y + rnd(id, i * 7 + 3) * 14, delay, fall,
      sway: 8 + rnd(id, i * 7 + 4) * drift,
      phase: rnd(id, i * 7 + 5) * 7,
      rot: (rnd(id, i * 7 + 6) - 0.5) * 1.4,
      lx: x + (0.08 + 0.84 * rnd(id, i * 7 + 8)) * w,
    };
  });
  return {
    id, t0, dur: dur + 6, static: false,
    bbox: [x - drift - 10, y - 10, w + drift * 2 + 20, landY - y + 30],
    draw(g, p, t) {
      const te = t - t0;
      g.save();
      g.font = fontStr(size, 'italic');
      for (const q of parts) {
        const u = (te - q.delay) / q.fall;
        if (u <= 0) continue;
        let px, py, rot, a;
        if (u >= 1) { px = q.lx; py = landY + (rnd(id, q.phase * 100) - 0.5) * 6; rot = q.rot; a = 0.85; }
        else {
          const uu = easeIn(clamp01(u));
          py = lerp(q.by, landY, uu);
          px = lerp(q.bx, q.lx, u) + Math.sin(q.phase + u * 5) * q.sway * (1 - u * 0.5);
          rot = q.rot * u + Math.sin(q.phase + u * 4) * 0.25;
          a = 0.9;
        }
        g.save(); g.translate(px, py); g.rotate(rot);
        g.globalAlpha = a; g.fillStyle = color;
        g.fillText(q.ch, 0, 0); g.restore();
      }
      g.restore();
    },
  };
}

// ------------------------------------------------------------ gold

// The single action token: gold-leaf stamped type with letterpress bite and a slow glint.
export function goldStamp({ id, t0, dur = 1.2, x, y, size = 26, text, style = 'roman', align = 'center' }) {
  const w = textW(text, size, style);
  const x0 = align === 'center' ? x - w / 2 : x;
  const cw = Math.ceil(w + 24), ch = Math.ceil(size * 1.8);
  const off = document.createElement('canvas');
  const SS = 3; off.width = cw * SS; off.height = ch * SS;
  const og = off.getContext('2d');
  return {
    id, t0, dur, static: false,   // glints forever: never baked
    bbox: [x0 - 12, y - size * 1.2, cw, ch],
    draw(g, p, t) {
      const pr = clamp01(p);
      og.setTransform(SS, 0, 0, SS, 0, 0);
      og.clearRect(0, 0, cw, ch);
      og.font = fontStr(size, style);
      og.textBaseline = 'alphabetic';
      // bite
      og.fillStyle = 'rgba(42,33,24,0.5)';
      og.fillText(text, 12 + 1.2, size * 1.15 + 1.2);
      og.fillStyle = INK.gold;
      og.fillText(text, 12, size * 1.15);
      // glint band sweeps every 6s
      const gph = ((t * 0.16 + 0.3) % 1);
      const gx = -cw * 0.4 + gph * cw * 1.8;
      og.globalCompositeOperation = 'source-atop';
      og.save();
      og.translate(gx, 0); og.rotate(-0.5);
      const grd = og.createLinearGradient(0, 0, 26, 0);
      grd.addColorStop(0, 'rgba(232,201,92,0)');
      grd.addColorStop(0.5, 'rgba(244,222,140,0.9)');
      grd.addColorStop(1, 'rgba(232,201,92,0)');
      og.fillStyle = grd;
      og.fillRect(0, -ch, 26, ch * 3);
      og.restore();
      og.globalCompositeOperation = 'source-over';
      g.save();
      // stamp impact: slight overshoot scale
      const sc = pr < 1 ? 1 + (1 - easeOut(pr)) * 0.25 : 1;
      g.globalAlpha = pr < 0.15 ? pr / 0.15 : 1;
      g.translate(x0 - 12 + cw / 2, y - size * 1.15 + ch / 2);
      g.scale(sc, sc);
      g.drawImage(off, -cw / 2, -ch / 2, cw, ch);
      g.restore();
    },
  };
}

// ------------------------------------------------------------ attention

// A flickering sight-line from a point up to the command header. Ephemeral.
export function attentionFlick({ id, t0, dur = 1.4, x, y, tx, ty, color = INK.rubric, w = 0.9 }) {
  return {
    id, t0, dur, static: false, ephemeral: true,
    bbox: [Math.min(x, tx) - 6, Math.min(y, ty) - 6, Math.abs(tx - x) + 12, Math.abs(ty - y) + 12],
    draw(g, p, t) {
      const env = Math.sin(clamp01(p) * Math.PI);
      const flick = 0.35 + 0.65 * Math.abs(Math.sin(t * 31 + rnd(id, 1) * 9));
      g.save();
      g.globalAlpha = 0.5 * env * flick;
      g.strokeStyle = color; g.lineWidth = w;
      g.setLineDash([3, 5]);
      g.beginPath(); g.moveTo(x, y);
      const mx = lerp(x, tx, 0.5) + (rnd(id, 2) - 0.5) * 30;
      g.quadraticCurveTo(mx, lerp(y, ty, 0.45), tx, ty);
      g.stroke();
      g.restore();
    },
  };
}

// ------------------------------------------------------------ verso shadow

// The shape behind the backlit page. path: [{u, x, y}] positions over life.
export function versoShadow({ id, t0, dur = 6, path, r = 42, alpha = 0.4 }) {
  const at = (u) => {
    if (u <= path[0].u) return path[0];
    for (let i = 1; i < path.length; i++) {
      if (u <= path[i].u) {
        const a = path[i - 1], b = path[i];
        const v = (u - a.u) / Math.max(1e-6, b.u - a.u);
        return { x: lerp(a.x, b.x, smooth(v)), y: lerp(a.y, b.y, smooth(v)) };
      }
    }
    return path[path.length - 1];
  };
  const xs = path.map(q => q.x), ys = path.map(q => q.y);
  return {
    id, t0, dur, static: false, ephemeral: true,
    bbox: [Math.min(...xs) - r * 2, Math.min(...ys) - r * 2.6, Math.max(...xs) - Math.min(...xs) + r * 4, Math.max(...ys) - Math.min(...ys) + r * 5],
    draw(g, p, t) {
      const q = at(clamp01(p));
      const env = Math.min(1, Math.min(p, 1 - p) * 6);
      const breathe = 1 + Math.sin(t * 1.7) * 0.04;
      g.save();
      const grd = g.createRadialGradient(q.x, q.y, r * 0.2, q.x, q.y, r * 1.9 * breathe);
      grd.addColorStop(0, 'rgba(138,123,97,' + (alpha * env) + ')');
      grd.addColorStop(1, 'rgba(138,123,97,0)');
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(q.x, q.y, r * 1.9, r * 2.5, 0, 0, 7); g.fill();
      g.restore();
    },
  };
}

// ------------------------------------------------------------ impress, seals, subpunct

// Blind-impress text: embossed, no ink — visible only as raking light.
export function impressText({ id, t0, dur = 1.5, x, y, size = 16, style = 'italic', text, align = 'left' }) {
  const w = textW(text, size, style);
  const x0 = align === 'center' ? x - w / 2 : x;
  const f = fontStr(size, style);
  return {
    id, t0, dur, static: true,
    bbox: [x0 - 4, y - size * 1.05, w + 8, size * 1.5],
    draw(g, p) {
      const a = smooth(clamp01(p));
      g.save();
      g.font = f; g.textBaseline = 'alphabetic';
      g.fillStyle = 'rgba(255,252,240,0.55)'; g.globalAlpha = a;
      g.fillText(text, x0 + 0.7, y + 0.7);
      g.fillStyle = 'rgba(42,33,24,0.13)';
      g.fillText(text, x0, y);
      g.restore();
    },
  };
}

// A round red wax seal in the commit ledger. One per irreversible act.
export function waxSeal({ id, t0, dur = 0.7, x, y, r = 11 }) {
  return {
    id, t0, dur, static: true,
    bbox: [x - r - 4, y - r - 4, r * 2 + 8, r * 2 + 8],
    draw(g, p) {
      const pr = easeOut(clamp01(p));
      const R = r * (0.4 + 0.6 * pr);
      g.save();
      g.fillStyle = INK.rubric;
      g.beginPath();
      const N = 26;
      for (let i = 0; i <= N; i++) {
        const th = i / N * Math.PI * 2;
        const rr = R * (1 + 0.07 * Math.sin(3 * th + rnd(id, 1) * 7) + 0.05 * Math.sin(5 * th + rnd(id, 2) * 7));
        i === 0 ? g.moveTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr) : g.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr);
      }
      g.closePath(); g.fill();
      // impressed ring + highlight
      g.globalAlpha = 0.5; g.strokeStyle = '#6E1D19'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(x, y, R * 0.62, 0, 7); g.stroke();
      g.globalAlpha = 0.55; g.fillStyle = '#C25048';
      g.beginPath(); g.arc(x - R * 0.3, y - R * 0.35, R * 0.18, 0, 7); g.fill();
      g.restore();
    },
  };
}

// Subpunct deletion dots — medieval "delete but keep legible": red dots under a span.
export function subpunct({ id, t0, dur = 1, x, y, w, n = null, color = INK.rubric }) {
  const count = n || Math.max(3, Math.round(w / 9));
  return {
    id, t0, dur, static: true,
    bbox: [x - 4, y - 4, w + 8, 10],
    draw(g, p) {
      g.save(); g.fillStyle = color;
      for (let i = 0; i < count; i++) {
        const u = (i + 0.5) / count;
        const dp = clamp01(p * count - i);
        if (dp <= 0) continue;
        g.globalAlpha = 0.85 * dp;
        g.beginPath();
        g.arc(x + u * w + (rnd(id, i) - 0.5) * 2, y + (rnd(id, i + 40) - 0.5) * 1.6, 1.5, 0, 7);
        g.fill();
      }
      g.restore();
    },
  };
}

// ------------------------------------------------------------ simple shapes

export function rule({ id, t0, dur = 0.7, x, y, w, color = INK.iron, weight = 1.4 }) {
  return stroke({ id, t0, dur, pts: [{ x, y }, { x: x + w, y: y + (rnd(id, 1) - 0.5) * 2 }], w: weight, color, taper: 0.25 });
}

// An arrow that shoots straight down the page (the greedy decoders).
export function arrow({ id, t0, dur = 1.1, x, y0, y1, color = INK.iron, w = 2.6, head = 10, recurveAt = null }) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    pts.push({ x: x + (rnd(id, i) - 0.5) * 2.5, y: lerp(y0, y1, u) });
  }
  return {
    id, t0, dur, static: true,
    bbox: [x - head - 8, y0 - 8, head * 2 + 16, y1 - y0 + 16],
    draw(g, p) {
      const pr = easeIn(clamp01(p));
      drawNib(g, pts, { w, color, seed: id, taper: 0.1 }, pr);
      if (pr >= 0.99) {
        const ty = y1;
        drawNib(g, [{ x: x - head * 0.6, y: ty - head }, { x, y: ty }, { x: x + head * 0.6, y: ty - head }], { w: w * 0.9, color, seed: id + 'h', taper: 0.2 }, 1);
      }
    },
  };
}
