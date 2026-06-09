#!/usr/bin/env node
// Voice recording session: final-script.json -> audio/*.m4a + film/cues.json + film/timeline.json
// Every cue is one file. Start times accumulate from measured durations, so the
// timeline is locked to the real audio, not to estimates.
//
// Usage: node tools/gen-audio.mjs [--only c07,c12]   (regenerate specific cues)

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = JSON.parse(readFileSync(join(root, 'film/final-script.json'), 'utf8'));
const only = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null;

mkdirSync(join(root, 'audio'), { recursive: true });
mkdirSync('/tmp/www-audio-build', { recursive: true });

const castByChar = Object.fromEntries(script.cast.map(c => [c.character.toUpperCase(), c]));

function ttsClean(s) {
  return s
    .replace(/…/g, '...').replace(/\.\.\./g, ', ')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/—/g, ', ')
    .replace(/\s+/g, ' ').trim();
}

function genCue(cue) {
  const cast = castByChar[cue.character.toUpperCase()];
  if (!cast) throw new Error(`No cast entry for ${cue.character} (${cue.id})`);
  const text = ttsClean(cue.tts_text || cue.text);
  const aiff = `/tmp/www-audio-build/${cue.id}.aiff`;
  const m4a = join(root, 'audio', `${cue.id}.m4a`);
  execFileSync('say', ['-v', cast.voice, '-r', String(cast.rate_wpm || 165), '-o', aiff, text]);
  const args = ['-y', '-i', aiff];
  // trim leading/trailing silence so cue starts bite
  let af = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse';
  // the Ghost arrives pitched down two semitones (time preserved); reverb lives in WebAudio
  if ((cue.processing || '').startsWith('ghost')) af += ',asetrate=22050*0.8909,aresample=22050,atempo=1.1225';
  args.push('-af', af);
  const cutFrac = cue.cut_frac ?? (cue.processing === 'cutoff-mid-word' ? 0.88 : null);
  if (cutFrac) {
    const full = parseFloat(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', aiff]).toString());
    args.push('-t', String((full * cutFrac).toFixed(3)));
  }
  args.push('-c:a', 'aac', '-b:a', '96k', m4a);
  execFileSync('ffmpeg', args, { stdio: 'pipe' });
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', m4a]).toString());
  return { file: `${cue.id}.m4a`, dur: Math.round(dur * 1000) / 1000 };
}

// ---- generate ----------------------------------------------------------
const measured = {};
for (const scene of script.scenes) {
  for (const cue of scene.cues) {
    if (only && !only.includes(cue.id)) {
      // reuse existing measurement
      const m4a = join(root, 'audio', `${cue.id}.m4a`);
      if (existsSync(m4a)) {
        const dur = parseFloat(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', m4a]).toString());
        measured[cue.id] = { file: `${cue.id}.m4a`, dur: Math.round(dur * 1000) / 1000 };
        continue;
      }
    }
    process.stdout.write(`  ${cue.id} ${cue.character} ... `);
    measured[cue.id] = genCue(cue);
    console.log(`${measured[cue.id].dur}s`);
  }
}

// ---- lock the timeline -------------------------------------------------
const GAP = 0.35;                       // minimum air between cues
const cues = [];
const timeline = { scenes: [], duration: 0 };
let cursor = 0;

for (const scene of script.scenes) {
  cursor = Math.max(cursor + GAP, scene.start_est_s ?? cursor);
  const sceneStart = cursor;
  const sc = { id: scene.id, name: scene.name, start: Math.round(sceneStart * 100) / 100, cues: {} };
  // lead-in before first cue belongs to the scene's visual opening
  for (const cue of scene.cues) {
    const m = measured[cue.id];
    const start = cursor + (cue.pause_before_s ?? 0.4);
    cues.push({
      id: cue.id, character: cue.character, text: cue.text,
      file: m.file, start: Math.round(start * 1000) / 1000, dur: m.dur,
      processing: cue.processing || 'none',
      ...(cue.processing === 'granulate-tail' ? { granStart: cue.granStart ?? 0.55 } : {}),
    });
    sc.cues[cue.id] = { start: Math.round(start * 1000) / 1000, dur: m.dur, end: Math.round((start + m.dur) * 1000) / 1000 };
    cursor = start + m.dur;
  }
  // visual tail after last cue
  cursor += scene.tail_s ?? 2.0;
  sc.end = Math.round(cursor * 100) / 100;
  timeline.scenes.push(sc);
}
timeline.duration = Math.round((cursor + (script.coda_tail_s ?? 4)) * 100) / 100;

writeFileSync(join(root, 'film/cues.json'), JSON.stringify(cues, null, 1));
writeFileSync(join(root, 'film/timeline.json'), JSON.stringify(timeline, null, 1));
console.log(`\nLocked: ${cues.length} cues, duration ${timeline.duration}s (${Math.floor(timeline.duration / 60)}:${String(Math.round(timeline.duration % 60)).padStart(2, '0')})`);
for (const s of timeline.scenes) console.log(`  ${s.id} ${String(s.start).padStart(6)} -> ${String(s.end).padStart(6)}  ${s.name}`);
