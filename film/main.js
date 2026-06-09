// Bootstrap: load fonts, cues, build the film, wire the player chrome.
import { Player } from './engine.js';
import { buildFilm } from './film.js';
import { makeScore } from './score.js';

const $ = id => document.getElementById(id);

function fmt(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}

async function boot() {
  await Promise.all([
    document.fonts.load('20px "IM Fell English"'),
    document.fonts.load('italic 20px "IM Fell English"'),
    document.fonts.load('20px "IM Fell English SC"'),
  ]);
  await document.fonts.ready;

  const cues = await (await fetch('film/cues.json')).json();
  const film = buildFilm(cues);

  const player = new Player({
    canvas: $('screen'),
    film, cues,
    scoreFactory: makeScore,
    captionEl: $('caption'),
  });
  window.__player = player;

  const playBtn = $('play'), scrub = $('scrub'), clock = $('clock');
  const poster = $('poster');

  const refresh = (t) => {
    clock.textContent = fmt(t) + ' / ' + fmt(film.duration);
    if (!scrub.matches(':active')) scrub.value = Math.round(t / film.duration * 1000);
    playBtn.textContent = player.playing ? '❚❚' : '▶';
  };
  player.onTick = refresh;
  player.onEnd = () => { playBtn.textContent = '▶'; };

  const start = async () => {
    poster.hidden = true;
    await player.play();
    playBtn.textContent = '❚❚';
  };
  $('bigplay').addEventListener('click', start);
  playBtn.addEventListener('click', async () => {
    if (player.playing) { player.pause(); playBtn.textContent = '▶'; }
    else await start();
  });
  scrub.addEventListener('input', () => {
    const t = scrub.value / 1000 * film.duration;
    player.seek(t);
    refresh(t);
  });
  $('cap').addEventListener('click', (e) => {
    player.captions = !player.captions;
    e.target.classList.toggle('on', player.captions);
    e.target.setAttribute('aria-pressed', String(player.captions));
  });
  $('mute').addEventListener('click', (e) => {
    player.setMuted(!player.muted);
    e.target.textContent = player.muted ? 'sound off' : 'sound on';
    e.target.classList.toggle('on', false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.closest('input,button')) { e.preventDefault(); playBtn.click(); }
    if (e.code === 'ArrowRight') player.seek(player.now() + 5);
    if (e.code === 'ArrowLeft') player.seek(player.now() - 5);
  });

  // QA still mode: ?t=123 renders the frame and signals readiness; no audio.
  const params = new URLSearchParams(location.search);
  if (params.has('t')) {
    const t = parseFloat(params.get('t'));
    poster.hidden = true;
    if (params.has('frame')) document.body.classList.add('frame-only');
    player.seek(Math.min(t, film.duration));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__FRAME_READY = true;
      document.title = 'READY';
    }));
    return;
  }

  // poster frame
  player.seek(0);
  refresh(0);
}

boot().catch(e => {
  console.error(e);
  document.title = 'BOOT-ERROR';
  const el = document.createElement('pre');
  el.style.color = '#9E2B25'; el.style.padding = '2rem';
  el.textContent = 'Boot error: ' + (e.stack || e);
  document.body.appendChild(el);
});
