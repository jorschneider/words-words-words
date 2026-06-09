// Procedural score — WORDS, WORDS, WORDS. See SCORE-API.md.
// makeScore(actx, out, film) -> { start(t), stop() }
//
// Everything is scheduled UP FRONT at start(t) with absolute AudioContext
// times, so the module is deterministic from film time and works unchanged
// in an OfflineAudioContext (no setInterval lookahead needed). Continuous
// layers (pedal, room tone) resume mid-state by sampling film.curves from t
// onward into setValueCurveAtTime automation. A master gate inside the
// module makes mute windows TOTAL across every layer. All synthesis is
// oscillators + deterministic noise buffers; no samples.

import { hash32, rnd, clamp01 } from './engine.js';

const D2 = 73.416;                        // pedal root
const D3 = D2 * 2;
const DORIAN = [0, 2, 3, 5, 7, 9, 10];    // semitones above D
const PURE = 1.5;                         // upper-voice ratio at commandSat=1
const TRITONE = Math.SQRT2;               // ...at commandSat=0

function dor(idx) {                       // D-dorian scale index (0 = D3) -> Hz
  const o = Math.floor(idx / 7), d = ((idx % 7) + 7) % 7;
  return D3 * Math.pow(2, (o * 12 + DORIAN[d]) / 12);
}
function mulberry32(a) {                  // fast deterministic PRNG for buffers
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// mix levels, pre score-bus: pedal/room barely conscious, plucks quiet on top
const LVL = {
  pedal: 0.10, room: 0.05, tick: 0.012, pluck: 0.45,
  branch: 0.035, strike: 0.10, manicule: 0.07, inset: 0.022,
  heart: 0.5, ophNote: 0.05, ophGrain: 0.4, bell: 0.17, triad: 0.035,
};

export function makeScore(actx, out, film) {
  const sr = actx.sampleRate;
  const curves = (film && film.curves) || {};
  const commandSat = curves.commandSat || (() => 1);
  const pedalLevel = curves.pedalLevel || (() => 0.5);
  const roomTone = curves.roomTone || (() => 0.3);
  const events = ((film && Array.isArray(film.scoreEvents)) ? film.scoreEvents : [])
    .filter(e => e && typeof e.t === 'number')
    .slice().sort((a, b) => a.t - b.t);
  const duration = (film && film.duration) ||
    (events.length ? events[events.length - 1].t + 10 : 60);

  // ------------------------------------------ deterministic shared buffers
  let noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    const len = Math.floor(sr * 4);
    noiseBuf = actx.createBuffer(1, len, sr);
    const d = noiseBuf.getChannelData(0), rng = mulberry32(0xC0FFEE);
    for (let i = 0; i < len; i++) d[i] = rng() * 2 - 1;
    return noiseBuf;
  }
  let tickBuf = null;
  function tickClick() {
    if (tickBuf) return tickBuf;
    const len = Math.floor(sr * 0.008);
    tickBuf = actx.createBuffer(1, len, sr);
    const d = tickBuf.getChannelData(0), rng = mulberry32(0x7E57);
    for (let i = 0; i < len; i++) d[i] = (rng() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    return tickBuf;
  }
  // Karplus-Strong: lowpassed noise burst -> averaging feedback loop, baked
  // into a buffer per scale index. Quiet plucked gut strings, not beeps.
  const pluckCache = new Map();
  function pluckBuf(idx) {
    if (pluckCache.has(idx)) return pluckCache.get(idx);
    const f = dor(idx);
    const N = Math.max(2, Math.round(sr / f));
    const secs = Math.min(2.4, 0.4 + 320 / f);
    const len = Math.floor(sr * secs);
    const buf = actx.createBuffer(1, len, sr);
    const y = buf.getChannelData(0);
    const rng = mulberry32(0xA11CE + idx * 7919);
    let lp = 0;
    for (let i = 0; i < N && i < len; i++) {       // softened excitation
      const w = rng() * 2 - 1; lp += 0.45 * (w - lp); y[i] = lp;
    }
    for (let i = N; i < len; i++) y[i] = 0.996 * 0.5 * (y[i - N] + y[i - N + 1]);
    let pk = 0;
    for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(y[i]));
    const g = pk > 0 ? 0.5 / pk : 0;
    for (let i = 0; i < len; i++) y[i] *= g;
    const fIn = Math.floor(sr * 0.002), fOut = Math.floor(sr * 0.06);
    for (let i = 0; i < fIn; i++) y[i] *= i / fIn;
    for (let i = 0; i < fOut && i < len; i++) y[len - 1 - i] *= i / fOut;
    pluckCache.set(idx, buf);
    return buf;
  }

  // quill-tick metronome times: pure function of the tickrate event timeline
  function tickTimes() {
    const segs = [];
    let cur = 1, a = 0;
    for (const e of events) {
      if (e.type !== 'tickrate') continue;
      const d = e.data || {};
      const r = d.rate == null ? 1 : Math.max(0, +d.rate || 0);
      const t = Math.max(0, e.t);
      if (t > a) segs.push({ a, b: t, r: cur });
      cur = r; a = Math.max(a, t);
    }
    if (duration > a) segs.push({ a, b: duration, r: cur });
    const ts = [];
    let ph = 0;
    for (const s of segs) {
      if (s.r <= 1e-4) continue;                   // frozen quill: no phase advance
      let k = Math.floor(ph + 1e-9) + 1;
      for (;;) {
        const tau = s.a + (k - ph) / (0.8 * s.r);
        if (tau >= s.b) break;
        ts.push(tau); k++;
      }
      ph += 0.8 * s.r * (s.b - s.a);
    }
    return ts;
  }

  // ------------------------------------------------------------- lifecycle
  let live = null;

  function stop() {
    if (!live) return;
    for (const s of live.sources) {
      try { s.stop(0); } catch (e) { }
      try { s.disconnect(); } catch (e) { }
    }
    for (const n of live.nodes) { try { n.disconnect(); } catch (e) { } }
    live = null;
  }

  function start(startT) {
    stop();
    startT = Math.max(0, +startT || 0);
    const L = { sources: [], nodes: [] };
    live = L;
    const t0 = actx.currentTime + 0.05;
    const F = ft => t0 + (ft - startT);            // film time -> audio time
    const node = n => (L.nodes.push(n), n);
    const srcN = s => (L.sources.push(s), s);
    const gainAt = v => { const g = node(actx.createGain()); g.gain.value = v; return g; };
    const bq = (type, freq, Q) => {
      const f = node(actx.createBiquadFilter());
      f.type = type; f.frequency.value = freq; if (Q != null) f.Q.value = Q;
      return f;
    };

    // master: every layer -> mix -> gate -> out. The gate is the mute.
    const mix = gainAt(1);
    const gate = gainAt(1);
    mix.connect(gate); gate.connect(out);

    // ---- mute windows (hard total silence), resuming mid-state correctly
    gate.gain.setValueAtTime(1, t0);
    for (const e of events) {
      if (e.type !== 'mute') continue;
      const tm = e.t, md = Math.max(0, +((e.data || {}).dur) || 0);
      if (tm + md + 0.3 <= startT) continue;
      if (tm >= startT) {
        gate.gain.setValueAtTime(1, F(tm));
        gate.gain.linearRampToValueAtTime(0, F(tm) + 0.03);
        gate.gain.setValueAtTime(0, F(tm + md));
        gate.gain.linearRampToValueAtTime(1, F(tm + md) + 0.3);
      } else if (startT < tm + md) {               // resume inside the hold
        gate.gain.setValueAtTime(0, t0);
        gate.gain.setValueAtTime(0, F(tm + md));
        gate.gain.linearRampToValueAtTime(1, F(tm + md) + 0.3);
      } else {                                      // resume mid-recovery
        gate.gain.setValueAtTime((startT - tm - md) / 0.3, t0);
        gate.gain.linearRampToValueAtTime(1, F(tm + md + 0.3));
      }
    }

    // ---- continuous curves sampled from startT to the end of the film
    const span = duration - startT;
    let times = null;
    if (span > 0.2) {
      const n = Math.max(2, Math.min(20000, Math.ceil(span * 25) + 1));
      times = new Float32Array(n);
      for (let i = 0; i < n; i++) times[i] = startT + span * i / (n - 1);
    }
    const sample = fn => {
      const a = new Float32Array(times.length);
      for (let i = 0; i < times.length; i++) a[i] = fn(times[i]);
      return a;
    };

    // ---- the command-pedal: portative organ, D2 root + slaved upper voice.
    // Upper-voice ratio rides commandSat: 1.5 (pure fifth) -> sqrt2 (tritone).
    const ratioAt = ft => TRITONE + (PURE - TRITONE) * clamp01(commandSat(ft));
    const pedal = gainAt(0);
    const pedalLP = bq('lowpass', 1100);
    pedal.connect(pedalLP); pedalLP.connect(mix);
    const pedalEnv = ft =>
      LVL.pedal * clamp01(pedalLevel(ft)) * (1 + 0.06 * Math.sin(ft * 2 * Math.PI * 0.11));
    if (times) pedal.gain.setValueCurveAtTime(sample(pedalEnv), t0, span);
    else pedal.gain.value = pedalEnv(startT);
    const PARTIALS = [                              // [voice, harmonic, amp]
      [0, 1, 1], [0, 2, .45], [0, 3, .28], [0, 4, .14], [0, 5, .08],
      [1, 1, .8], [1, 2, .36], [1, 3, .2], [1, 4, .1],
    ];
    for (const [v, k, a] of PARTIALS) {
      const o = srcN(actx.createOscillator()); o.type = 'sine';
      if (v === 0) o.frequency.value = D2 * k;
      else if (times) o.frequency.setValueCurveAtTime(sample(ft => D2 * k * ratioAt(ft)), t0, span);
      else o.frequency.value = D2 * k * ratioAt(startT);
      const g = gainAt(a);
      o.connect(g); g.connect(pedal);
      o.start(t0); o.stop(F(duration) + 0.5);
    }

    // ---- room tone: near-subliminal filtered-noise floor
    const room = gainAt(0);
    const roomLP = bq('lowpass', 300);
    const rs = srcN(actx.createBufferSource());
    rs.buffer = noise(); rs.loop = true;
    rs.connect(roomLP); roomLP.connect(room); room.connect(mix);
    if (times) room.gain.setValueCurveAtTime(sample(ft => LVL.room * clamp01(roomTone(ft))), t0, span);
    else room.gain.value = LVL.room * clamp01(roomTone(startT));
    rs.start(t0, startT % 4);
    rs.stop(F(duration) + 0.5);

    // ---- quill ticks: very quiet dry clicks under everything
    const tickG = gainAt(LVL.tick);
    const tickBP = bq('bandpass', 3400, 1.2);
    tickBP.connect(tickG); tickG.connect(mix);
    for (const tau of tickTimes()) {
      if (tau < startT) continue;
      const s = srcN(actx.createBufferSource());
      s.buffer = tickClick(); s.connect(tickBP); s.start(F(tau));
    }

    // ---- shared event busses
    const pluckLP = bq('lowpass', 2600); pluckLP.connect(mix);
    const branchLP = bq('lowpass', 1900); branchLP.connect(mix);
    const insetLP = bq('lowpass', 2100); insetLP.connect(mix);
    const heartLP = bq('lowpass', 130); heartLP.connect(mix);

    // envelope helper: linear attack to peak, exponential decay, hard zero
    function env(at, attack, peakV, decayEnd) {
      const g = gainAt(0);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peakV, at + attack);
      g.gain.exponentialRampToValueAtTime(0.0004, decayEnd);
      g.gain.setValueAtTime(0, decayEnd);
      return g;
    }

    // ---- one-shot voices ------------------------------------------------
    function pluck(t, n) {
      const idx = hash32('pluck:' + n) % 15;        // D dorian, D3..D5
      const s = srcN(actx.createBufferSource());
      s.buffer = pluckBuf(idx);
      const g = gainAt(LVL.pluck * (0.85 + 0.3 * rnd('pluckv', n)));
      s.connect(g); g.connect(pluckLP);
      s.start(F(t));
    }

    const branchGates = [];                         // sounding figures a strike can damp
    function branch(t, d) {
      const id = String(d.id == null ? t : d.id);
      const dur = Math.max(0.8, +d.dur || 2);
      const bg = gainAt(1);
      bg.connect(branchLP);
      branchGates.push({ t, end: t + dur + 0.6, gate: bg });
      const h = hash32('branch:' + id);
      const step = 0.16 + 0.06 * rnd('branchstep', h & 1023);
      let deg = 7 + (h % 5);                        // begins around D4
      const halt = t + dur * 0.72;                  // halts unresolved; the rest is air
      for (let i = 0, nt = t; nt < halt; i++, nt += step) {
        if (deg % 7 === 0) deg += 1;                // never lands on D: no resolution
        const o = srcN(actx.createOscillator());
        o.type = 'triangle'; o.frequency.value = dor(deg);
        const at = F(nt);
        const g = env(at, 0.015, LVL.branch, at + 0.45);
        o.connect(g); g.connect(bg);
        o.start(at); o.stop(at + 0.5);
        deg += (i % 3 === 2) ? 2 : 1;               // rising, never settling
      }
    }

    function strike(t) {
      const at = F(t);
      const s = srcN(actx.createBufferSource()); s.buffer = noise();
      const bp = bq('bandpass', 950, 5);
      const g = env(at, 0.004, LVL.strike, at + 0.09);
      s.connect(bp); bp.connect(g); g.connect(mix);
      s.start(at, 0.7 + 2 * rnd('strikeoff', Math.round(t * 97)), 0.12);
      for (const b of branchGates) {                // abrupt damp of sounding figures
        if (b.t <= t && t < b.end) {
          b.gate.gain.setValueAtTime(1, at);
          b.gate.gain.linearRampToValueAtTime(0, at + 0.03);
        }
      }
    }

    function manicule(t) {
      const at = F(t);
      const s = srcN(actx.createBufferSource()); s.buffer = noise();
      const bp = bq('bandpass', 2700, 9);
      const g = env(at, 0.002, LVL.manicule, at + 0.045);
      s.connect(bp); bp.connect(g); g.connect(mix);
      s.start(at, 1.1 + 2 * rnd('manoff', Math.round(t * 89)), 0.06);
    }

    function inset(t, d) {
      const dur = Math.max(0.5, +d.dur || 2);
      // toy music-box: quantized square arpeggio; one note is slightly wrong
      const PAT = [[14, 0], [18, 0], [16, 0], [18, 0], [14, 0], [18, 0], [16, 45], [19, 0]];
      for (let i = 0, nt = t; nt < t + dur - 0.05; i++, nt += 0.21) {
        const [deg, cents] = PAT[i % PAT.length];
        const o = srcN(actx.createOscillator());
        o.type = 'square';
        o.frequency.value = dor(deg) * Math.pow(2, cents / 1200);
        const at = F(nt);
        const g = env(at, 0.002, LVL.inset, at + 0.16);
        o.connect(g); g.connect(insetLP);
        o.start(at); o.stop(at + 0.2);
      }
    }

    function heartbeat(t) {                         // da-DUM, once, low
      for (const [off, v] of [[0, 0.55], [0.24, 1]]) {
        const at = F(t + off);
        const o = srcN(actx.createOscillator()); o.type = 'sine';
        o.frequency.setValueAtTime(62, at);
        o.frequency.exponentialRampToValueAtTime(40, at + 0.12);
        const g = env(at, 0.008, LVL.heart * v, at + 0.22);
        o.connect(g); g.connect(heartLP);
        o.start(at); o.stop(at + 0.3);
      }
    }

    function ophelia(t, d) {
      const dur = Math.max(1, +d.dur || 6);
      const granAt = Math.min(dur, Math.max(0, d.granulateAt == null ? dur : +d.granulateAt));
      // music-box dorian tune: pure sines, long decay
      const TUNE = [21, 18, 19, 16, 18, 14, 16, 12, 14, 11];
      const noteEnd = t + Math.min(granAt + 0.2, dur) - 0.05;
      for (let i = 0, nt = t; nt < noteEnd; i++, nt += 0.42) {
        const o = srcN(actx.createOscillator());
        o.type = 'sine'; o.frequency.value = dor(TUNE[i % TUNE.length]);
        const at = F(nt);
        const g = env(at, 0.008, LVL.ophNote, at + 1.8);
        o.connect(g); g.connect(mix);
        o.start(at); o.stop(at + 1.9);
      }
      // ...then she granulates: pitched-noise grains falling in register
      const tail = dur - granAt;
      if (tail <= 0.05) return;
      const count = Math.floor(tail * 22);
      for (let i = 0; i < count; i++) {
        const u = i / Math.max(1, count - 1);
        let gt = t + granAt + u * tail * 0.96 + (rnd('ophj', i) - 0.5) * 0.1;
        gt = Math.max(t + granAt, gt);
        const f = 820 * Math.pow(150 / 820, u) * (1 + (rnd('ophf', i) - 0.5) * 0.18);
        const s = srcN(actx.createBufferSource()); s.buffer = noise();
        const bp = bq('bandpass', f, 16);
        const spanG = 0.05 + 0.12 * rnd('ophs', i);
        const at = F(gt);
        const g = gainAt(0);
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(LVL.ophGrain * (1 - 0.55 * u), at + spanG * 0.25);
        g.gain.linearRampToValueAtTime(0, at + spanG);
        s.connect(bp); bp.connect(g); g.connect(mix);
        s.start(at, rnd('opho', i) * 3.5, spanG + 0.02);
      }
    }

    function bell(t) {                              // the gold token; let it ring
      const at = F(t), fc = 587.33;                 // D5
      const car = srcN(actx.createOscillator()); car.type = 'sine'; car.frequency.value = fc;
      const mod = srcN(actx.createOscillator()); mod.type = 'sine'; mod.frequency.value = fc * 1.4;
      const mg = gainAt(0);
      mg.gain.setValueAtTime(fc * 2.4, at);
      mg.gain.exponentialRampToValueAtTime(1, at + 3.2);
      mod.connect(mg); mg.connect(car.frequency);
      const g = env(at, 0.005, LVL.bell, at + 9);
      car.connect(g); g.connect(mix);
      car.start(at); car.stop(at + 9.2);
      mod.start(at); mod.stop(at + 9.2);
      // the film's only D-major triad, swelling softly under the bell
      for (const [f, a] of [[293.66, 1], [369.99, 0.8], [440, 0.9]]) {
        const o = srcN(actx.createOscillator()); o.type = 'sine'; o.frequency.value = f;
        const tg = gainAt(0);
        tg.gain.setValueAtTime(0, at);
        tg.gain.linearRampToValueAtTime(LVL.triad * a, at + 0.5);
        tg.gain.exponentialRampToValueAtTime(0.0003, at + 8);
        tg.gain.setValueAtTime(0, at + 8);
        o.connect(tg); tg.connect(mix);
        o.start(at); o.stop(at + 8.2);
      }
    }

    // ---- schedule every one-shot at or after startT (earlier ones skip)
    for (const e of events) {
      if (e.type === 'mute' || e.type === 'tickrate') continue;  // handled above
      if (e.t < startT) continue;
      const d = e.data || {};
      switch (e.type) {
        case 'pluck': pluck(e.t, d.n | 0); break;
        case 'branch': branch(e.t, d); break;
        case 'strike': strike(e.t); break;
        case 'manicule': manicule(e.t); break;
        case 'inset': inset(e.t, d); break;
        case 'heartbeat': heartbeat(e.t); break;
        case 'ophelia': ophelia(e.t, d); break;
        case 'bell': bell(e.t); break;
      }
    }
  }

  return { start, stop };
}
