// WORDS, WORDS, WORDS — film engine
// One page, one unbroken shot. Every frame is a pure function of t.
// The page is 1000 x 1414 units. Camera = attention.

export const PAGE = { W: 1000, H: 1414 };

export const INK = {
  parchment: '#EAE0C8',
  iron: '#2A2118',        // iron-gall brown-black: all body ink
  rubric: '#9E2B25',      // the command, manicules, Claudius's crown
  gold: '#C9A227',
  glint: '#E8C95C',
  ghost: '#C7BBA0',       // scraped palimpsest remains
  verso: '#8A7B61',       // the shape behind the backlit page
  verdigris: '#4E7A5E',   // verification only: the PASS tick and its return filament
};

// ---------------------------------------------------------------- utilities

export function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// deterministic [0,1) from (seed, n)
export function rnd(seed, n) {
  let x = (hash32(seed + ':' + n) ^ 0x9E3779B9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
export const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = u => u * u * (3 - 2 * u);
export const easeOut = u => 1 - (1 - u) * (1 - u);
export const easeIn = u => u * u;
export const easeInOut = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

// ---------------------------------------------------------------- camera

// keyframes: [{t, cx, cy, z, ease}] — z = visible page-units across the viewport width.
// Between keyframes k0,k1 value at t interpolates with k1.ease ('smooth'|'linear'|'in'|'out'|'cut').
const EASES = { smooth: easeInOut, linear: u => u, in: easeIn, out: easeOut, cut: () => 0 };

export function makeCamera(keys) {
  keys = keys.slice().sort((a, b) => a.t - b.t);
  return function camAt(t) {
    if (t <= keys[0].t) return keys[0];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i].t) {
        const k0 = keys[i - 1], k1 = keys[i];
        const u = (EASES[k1.ease || 'smooth'])(clamp01((t - k0.t) / Math.max(1e-6, k1.t - k0.t)));
        return { cx: lerp(k0.cx, k1.cx, u), cy: lerp(k0.cy, k1.cy, u), z: Math.exp(lerp(Math.log(k0.z), Math.log(k1.z), u)) };
      }
    }
    return keys[keys.length - 1];
  };
}

// ---------------------------------------------------------------- marks
// mark = { id, t0, dur, draw(g, p, t), bbox:[x,y,w,h], static:true, ephemeral:false }
// static marks accumulate as ink and are bakeable once complete.
// ephemeral marks (attention flickers, verso shadow passes) stop drawing after t0+dur.
// dynamic marks (static:false, not ephemeral) draw forever but are never baked (gold glint).

const BAKE_SCALE = 2;            // bake px per page unit
const BAKE_MARGIN = 0.5;         // seconds after completion before a mark bakes

export class Film {
  constructor() { this.marks = []; this.cameraKeys = []; this.scoreEvents = []; this.curves = {}; this.duration = 0; }
  add(m) { if (Array.isArray(m)) { for (const x of m) this.add(x); return; } this.marks.push(m); }
  cam(k) { if (Array.isArray(k)) this.cameraKeys.push(...k); else this.cameraKeys.push(k); }
  ev(e) { if (Array.isArray(e)) this.scoreEvents.push(...e); else this.scoreEvents.push(e); }
  seal() {
    this.marks.sort((a, b) => a.t0 - b.t0);
    this.scoreEvents.sort((a, b) => a.t - b.t);
    if (!this.cameraKeys.length) this.cameraKeys.push({ t: 0, cx: 500, cy: 707, z: 2560 });
    this.camAt = makeCamera(this.cameraKeys);
    return this;
  }
}

// ---------------------------------------------------------------- renderer

export class Renderer {
  constructor(canvas, film) {
    this.canvas = canvas; this.film = film;
    this.ctx = canvas.getContext('2d');
    this.bake = document.createElement('canvas');
    this.bake.width = PAGE.W * BAKE_SCALE; this.bake.height = PAGE.H * BAKE_SCALE;
    this.bctx = this.bake.getContext('2d');
    this.bakedIds = new Set();
    this.bakeT = 0;            // bake contains all static marks complete before this time
    this.lastT = -1;
    this._resetBake();
  }
  _resetBake() {
    const b = this.bctx;
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.clearRect(0, 0, this.bake.width, this.bake.height);
    this.bakedIds.clear(); this.bakeT = 0;
  }
  _bakeUpTo(t) {
    const b = this.bctx;
    b.setTransform(BAKE_SCALE, 0, 0, BAKE_SCALE, 0, 0);
    for (const m of this.film.marks) {
      if (m.t0 > t - BAKE_MARGIN) break;
      if (!m.static || m.ephemeral || this.bakedIds.has(m.id)) continue;
      if (m.t0 + m.dur < t - BAKE_MARGIN) { m.draw(b, 1, t); this.bakedIds.add(m.id); }
    }
    this.bakeT = t;
  }
  // viewport rect in page units for culling
  _view(cam, w, h) {
    const vw = cam.z, vh = cam.z * h / w;
    return [cam.cx - vw / 2, cam.cy - vh / 2, vw, vh];
  }
  _visible(m, v) {
    if (!m.bbox) return true;
    const [x, y, w, h] = m.bbox;
    return x < v[0] + v[2] && x + w > v[0] && y < v[1] + v[3] && y + h > v[1];
  }
  render(t) {
    const cv = this.canvas, g = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const cssW = cv.clientWidth, cssH = cv.clientHeight;
    if (cv.width !== Math.round(cssW * dpr) || cv.height !== Math.round(cssH * dpr)) {
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    }
    if (t < this.lastT - 0.02) this._resetBake();      // backward seek: rebake
    this.lastT = t;

    const cam = this.film.camAt(t);
    const scale = cv.width / cam.z;
    const view = this._view(cam, cv.width, cv.height);
    const closeUp = scale > BAKE_SCALE * 1.1;          // bake too coarse: draw live

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#E0D5B8'; g.fillRect(0, 0, cv.width, cv.height);   // the desk, a shade deeper
    g.setTransform(scale, 0, 0, scale, cv.width / 2 - cam.cx * scale, cv.height / 2 - cam.cy * scale);

    // the leaf itself
    g.fillStyle = INK.parchment; g.fillRect(0, 0, PAGE.W, PAGE.H);
    g.strokeStyle = 'rgba(42,33,24,0.25)'; g.lineWidth = 1.2;
    g.strokeRect(0, 0, PAGE.W, PAGE.H);

    if (!closeUp) {
      this._bakeUpTo(t);
      g.drawImage(this.bake, 0, 0, this.bake.width, this.bake.height, 0, 0, PAGE.W, PAGE.H);
      for (const m of this.film.marks) {
        if (m.t0 > t) break;
        if (this.bakedIds.has(m.id)) continue;
        if (m.ephemeral && t > m.t0 + m.dur) continue;
        if (!this._visible(m, view)) continue;
        m.draw(g, clamp01((t - m.t0) / Math.max(1e-6, m.dur)), t);
      }
    } else {
      for (const m of this.film.marks) {
        if (m.t0 > t) break;
        if (m.ephemeral && t > m.t0 + m.dur) continue;
        if (!this._visible(m, view)) continue;
        m.draw(g, clamp01((t - m.t0) / Math.max(1e-6, m.dur)), t);
      }
    }
  }
}

// ---------------------------------------------------------------- audio

export class Voices {
  // cues: [{id, character, file, start, dur, processing, text}]
  constructor(actx, cues, master) {
    this.actx = actx; this.cues = cues; this.master = master;
    this.buffers = new Map(); this.playing = [];
  }
  async load(base) {
    await Promise.all(this.cues.map(async c => {
      const r = await fetch(base + c.file);
      const ab = await r.arrayBuffer();
      this.buffers.set(c.id, await this.actx.decodeAudioData(ab));
    }));
  }
  _chain(processing, when, dur) {
    const a = this.actx;
    const out = a.createGain(); out.connect(this.master);
    if (processing === 'ghost1' || processing === 'ghost2') {
      const deep = processing === 'ghost2';
      const ring = a.createGain(); ring.gain.value = 0;
      const osc = a.createOscillator(); osc.frequency.value = deep ? 24 : 30;
      const oscGain = a.createGain(); oscGain.gain.value = 0.5;
      osc.connect(oscGain); oscGain.connect(ring.gain);
      const dry = a.createGain(); dry.gain.value = deep ? 0.35 : 0.5;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = deep ? 700 : 1200;
      const dl = a.createDelay(); dl.delayTime.value = deep ? 0.016 : 0.012;
      const fb = a.createGain(); fb.gain.value = deep ? 0.45 : 0.3;
      dl.connect(fb); fb.connect(dl);
      const inn = a.createGain();
      inn.connect(ring); inn.connect(dry);
      ring.connect(lp); dry.connect(lp); lp.connect(dl); lp.connect(out); dl.connect(out);
      osc.start(when); osc.stop(when + dur + 1);
      out.gain.value = 1.25;
      return inn;
    }
    if (processing === 'whisper') {
      const hs = a.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 4000; hs.gain.value = -4;
      const gn = a.createGain(); gn.gain.value = 0.6;
      hs.connect(gn); gn.connect(out);
      return hs;
    }
    return out;
  }
  // schedule everything that should sound, given film time t and playback starting now
  scheduleFrom(t) {
    this.stopAll();
    const a = this.actx, now = a.currentTime + 0.05;
    for (const c of this.cues) {
      const end = c.start + c.dur;
      if (end <= t) continue;
      const buf = this.buffers.get(c.id);
      if (!buf) continue;
      const src = a.createBufferSource(); src.buffer = buf;
      const offset = Math.max(0, t - c.start);
      const when = now + Math.max(0, c.start - t);
      const head = this._chain(c.processing, when, c.dur - offset);
      if (c.processing === 'granulate-tail') {
        this._granulate(src, buf, c, when, offset, head);
      } else {
        src.connect(head);
        src.start(when, offset);
        this.playing.push(src);
      }
    }
  }
  _granulate(src, buf, c, when, offset, head) {
    // direct part plays until granStart fraction; grains scatter the tail
    const a = this.actx;
    const granAt = (c.granStart ?? 0.45) * c.dur;          // film-seconds into cue
    const directEnd = Math.max(0, granAt - offset);
    if (directEnd > 0.02) { src.connect(head); src.start(when, offset, directEnd); this.playing.push(src); }
    const tail = c.dur - granAt;
    if (tail <= 0) return;
    const grains = Math.floor(tail * 28);
    for (let i = 0; i < grains; i++) {
      const u = i / grains;
      const gt = when + directEnd + u * tail * 1.15;
      if (gt < a.currentTime) continue;
      const gs = a.createBufferSource(); gs.buffer = buf;
      const span = 0.05 + 0.12 * rnd(c.id, i * 3);
      const pos = granAt + u * tail * (0.4 + 0.6 * rnd(c.id, i * 3 + 1));
      gs.playbackRate.value = 1 + (rnd(c.id, i * 3 + 2) - 0.5) * (0.1 + u * 0.9);
      const gg = a.createGain();
      const amp = 0.7 * (1 - u * 0.6);
      gg.gain.setValueAtTime(0, gt);
      gg.gain.linearRampToValueAtTime(amp, gt + span * 0.3);
      gg.gain.linearRampToValueAtTime(0, gt + span);
      gs.connect(gg); gg.connect(head);
      gs.start(gt, Math.min(pos, c.dur - 0.05), span);
      this.playing.push(gs);
    }
  }
  stopAll() {
    for (const s of this.playing) { try { s.stop(); } catch (e) { } }
    this.playing = [];
  }
}

// ---------------------------------------------------------------- player

export class Player {
  constructor({ canvas, film, cues, scoreFactory, captionEl, audioBase = 'audio/' }) {
    this.canvas = canvas; this.film = film; this.cues = cues;
    this.captionEl = captionEl; this.audioBase = audioBase;
    this.renderer = new Renderer(canvas, film);
    this.scoreFactory = scoreFactory;
    this.t = 0; this.playing = false; this._ctxT0 = 0; this._t0 = 0;
    this.duration = film.duration;
    this.onTick = null; this.onEnd = null;
    this.muted = false; this.captions = true;
    this.audioReady = false;
  }
  async initAudio() {
    if (this.audioReady) return;
    const A = window.AudioContext || window.webkitAudioContext;
    this.actx = new A();
    this.master = this.actx.createGain(); this.master.gain.value = 1;
    this.comp = this.actx.createDynamicsCompressor();
    this.comp.threshold.value = -18; this.comp.ratio.value = 4;
    this.master.connect(this.comp); this.comp.connect(this.actx.destination);
    this.voiceBus = this.actx.createGain(); this.voiceBus.gain.value = 1; this.voiceBus.connect(this.master);
    this.scoreBus = this.actx.createGain(); this.scoreBus.gain.value = 0.5; this.scoreBus.connect(this.master);
    this.voices = new Voices(this.actx, this.cues, this.voiceBus);
    await this.voices.load(this.audioBase);
    if (this.scoreFactory) this.score = this.scoreFactory(this.actx, this.scoreBus, this.film);
    this.audioReady = true;
  }
  now() { return this.playing ? this._t0 + (this.actx.currentTime - this._ctxT0) : this.t; }
  async play() {
    if (this.playing) return;
    await this.initAudio();
    await this.actx.resume();
    if (this.t >= this.duration - 0.05) this.t = 0;
    this._t0 = this.t; this._ctxT0 = this.actx.currentTime;
    this.playing = true;
    this.voices.scheduleFrom(this.t);
    if (this.score) this.score.start(this.t);
    this._loop();
  }
  pause() {
    if (!this.playing) return;
    this.t = this.now(); this.playing = false;
    this.voices.stopAll();
    if (this.score) this.score.stop();
    if (this._raf) cancelAnimationFrame(this._raf);
  }
  seek(t) {
    t = Math.max(0, Math.min(this.duration, t));
    if (this.playing) {
      this.t = t; this._t0 = t; this._ctxT0 = this.actx.currentTime;
      this.voices.scheduleFrom(t);
      if (this.score) { this.score.stop(); this.score.start(t); }
    } else {
      this.t = t;
      this.renderer.render(t);
      this._caption(t);
      if (this.onTick) this.onTick(t);
    }
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 1; }
  _caption(t) {
    if (!this.captionEl) return;
    if (!this.captions) { this.captionEl.textContent = ''; this.captionEl.dataset.on = '0'; return; }
    const c = this.cues.find(c => t >= c.start && t < c.start + c.dur + 0.3);
    if (c) {
      this.captionEl.dataset.on = '1';
      this.captionEl.innerHTML = '<span class="cap-who">' + c.character + '</span> ' + c.text;
    } else { this.captionEl.dataset.on = '0'; }
  }
  _loop() {
    const step = () => {
      if (!this.playing) return;
      const t = this.now();
      if (t >= this.duration) {
        this.t = this.duration; this.playing = false;
        this.voices.stopAll(); if (this.score) this.score.stop();
        this.renderer.render(this.duration);
        if (this.onEnd) this.onEnd();
        return;
      }
      this.renderer.render(t);
      this._caption(t);
      if (this.onTick) this.onTick(t);
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }
}
