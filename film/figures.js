// WORDS, WORDS, WORDS — marginal figures
// 17th-century drollery poses, 2–6 nib strokes each, in a unit box:
// x 0..1 (0.5 center), y 0..1 (0 top of head, 1 ground line).
// The figure() renderer in ink.js compresses x by 0.72 — head circles
// compensate with a wider x-radius so they render round.

const RUBRIC = '#9E2B25';

// A head circle. r is the on-screen radius in unit-y terms.
function head(cx, cy, r = 0.055, w = 1.5) {
  const rx = r / 0.72, pts = [];
  for (let i = 0; i <= 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * r]);
  }
  return { pts, w };
}

// A three-point crown zigzag centred on (cx, cy), tilted by rot radians.
function crown(cx, cy, s = 0.06, rot = 0, color) {
  const raw = [[-1, 0.4], [-1, -0.5], [-0.5, 0.1], [0, -0.7], [0.5, 0.1], [1, -0.5], [1, 0.4]];
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const pts = raw.map(([px, py]) => {
    const x = px * s, y = py * s;
    return [cx + (x * cos - y * sin) / 0.72, cy + x * sin + y * cos];
  });
  return color ? { pts, w: 2, color } : { pts, w: 1.8 };
}

export const POSES = {

  // ---------------------------------------------------------------- hamlet
  // The deliberator: weight on one hip, elbow thrown out, hand to chin.
  'hamlet-stand': {
    strokes: [
      head(0.46, 0.105),
      // spine, slight S — hip pushed right
      { pts: [[0.475, 0.175], [0.50, 0.32], [0.515, 0.44], [0.505, 0.55]], w: 2.6 },
      // weight leg, straight
      { pts: [[0.505, 0.55], [0.475, 0.78], [0.465, 1.0]], w: 2.1 },
      // free leg, kicked out to rest on its toe
      { pts: [[0.505, 0.55], [0.60, 0.76], [0.625, 1.0]], w: 1.9 },
      // chin arm: elbow flung forward, hand back up to the jaw
      { pts: [[0.475, 0.215], [0.345, 0.305], [0.395, 0.175]], w: 1.9 },
      // other arm tucked behind the back
      { pts: [[0.50, 0.215], [0.555, 0.34], [0.535, 0.42]], w: 1.7 },
    ],
  },

  // The imagined kill: full lunge, arm and dagger one gesture.
  'hamlet-strike': {
    strokes: [
      head(0.64, 0.20),
      // torso driving forward
      { pts: [[0.615, 0.26], [0.52, 0.38], [0.455, 0.52]], w: 2.6 },
      // back leg, extended
      { pts: [[0.455, 0.52], [0.30, 0.74], [0.16, 0.98]], w: 2.0 },
      // front leg, bent under him
      { pts: [[0.455, 0.52], [0.565, 0.68], [0.59, 1.0]], w: 2.0 },
      // arm extended to the kill
      { pts: [[0.625, 0.275], [0.78, 0.235], [0.87, 0.215]], w: 1.9 },
      // the dagger, kinked up at the wrist
      { pts: [[0.87, 0.21], [1.0, 0.165]], w: 1.4 },
    ],
  },

  // Seated scribe, bent over the page, quill cocked up behind the hand.
  'hamlet-quill': {
    strokes: [
      head(0.43, 0.305),
      // hunched back arcing over the work
      { pts: [[0.47, 0.35], [0.565, 0.38], [0.615, 0.49], [0.605, 0.62]], w: 2.6 },
      // thigh forward, shin down — seated
      { pts: [[0.605, 0.62], [0.475, 0.65], [0.40, 0.665]], w: 2.4 },
      { pts: [[0.41, 0.665], [0.415, 0.84], [0.435, 1.0]], w: 2.0 },
      // writing arm reaching down to the page
      { pts: [[0.475, 0.39], [0.39, 0.50], [0.335, 0.585]], w: 1.7 },
      // the quill, long and cocked up behind the hand
      { pts: [[0.325, 0.595], [0.24, 0.41]], w: 1.4 },
    ],
  },

  // -------------------------------------------------------------- claudius
  // Broad as a bell — a chess king of a man.
  'claudius-stand': {
    strokes: [
      head(0.51, 0.10),
      // wide shoulder yoke
      { pts: [[0.345, 0.25], [0.51, 0.195], [0.675, 0.25]], w: 2.6 },
      // robe flaring left and right
      { pts: [[0.375, 0.27], [0.305, 0.62], [0.265, 0.97]], w: 2.7 },
      { pts: [[0.645, 0.27], [0.715, 0.62], [0.755, 0.97]], w: 2.7 },
      // hem, closing the bell
      { pts: [[0.275, 0.97], [0.51, 1.0], [0.745, 0.97]], w: 2.4 },
      // centre fold, the weight of the cloth
      { pts: [[0.51, 0.30], [0.515, 0.62], [0.505, 0.94]], w: 2.0 },
    ],
    accents: [crown(0.51, 0.025, 0.06, 0, RUBRIC)],
  },

  // Kneeling at prayer — hands a wedge thrust forward, crown still on.
  'claudius-kneel': {
    strokes: [
      head(0.49, 0.265),
      // torso, inclined toward the prayer
      { pts: [[0.515, 0.33], [0.55, 0.45], [0.575, 0.575]], w: 2.6 },
      // kneeling robe: down the front of the thigh, back along the ground
      { pts: [[0.575, 0.575], [0.595, 0.77], [0.58, 0.955], [0.72, 0.965], [0.83, 0.925]], w: 2.6 },
      // joined arms thrust forward at chest height, rising to the hands
      { pts: [[0.535, 0.52], [0.42, 0.475], [0.31, 0.40]], w: 2.3 },
    ],
    accents: [crown(0.475, 0.185, 0.052, -0.2, RUBRIC)],
  },

  // Running for his life, cape streaming, crown toppling off behind.
  'claudius-flee': {
    strokes: [
      head(0.71, 0.14),
      // torso pitched hard forward
      { pts: [[0.675, 0.20], [0.575, 0.33], [0.515, 0.46]], w: 2.6 },
      // front leg striding for the ground
      { pts: [[0.515, 0.46], [0.665, 0.60], [0.825, 0.97]], w: 2.0 },
      // back leg kicked up behind
      { pts: [[0.515, 0.46], [0.39, 0.58], [0.26, 0.685]], w: 2.0 },
      // cape streaming up and back like a banner
      { pts: [[0.645, 0.235], [0.49, 0.195], [0.345, 0.245], [0.245, 0.36]], w: 2.7 },
      // arms thrust forward, grasping at escape
      { pts: [[0.685, 0.245], [0.82, 0.30], [0.895, 0.36]], w: 1.7 },
    ],
    accents: [crown(0.815, 0.05, 0.05, 0.7, RUBRIC)],
  },

  // Collapsed on his back — the crown rolled away on the ground.
  'claudius-dead': {
    strokes: [
      head(0.235, 0.92),
      // torso sprawled flat
      { pts: [[0.30, 0.895], [0.43, 0.865], [0.575, 0.88]], w: 2.8 },
      // one knee buckled up, the other leg flat
      { pts: [[0.575, 0.88], [0.675, 0.77], [0.775, 0.96]], w: 2.2 },
      { pts: [[0.575, 0.885], [0.74, 0.92], [0.885, 0.935]], w: 2.0 },
      // arm flung out along the ground
      { pts: [[0.345, 0.875], [0.30, 0.79], [0.225, 0.745]], w: 1.7 },
    ],
    accents: [crown(0.06, 0.955, 0.048, 1.3, RUBRIC)],
  },

  // -------------------------------------------------------------- gertrude
  // Tall, regal — a closed A-line gown, veil falling behind.
  'gertrude-stand': {
    strokes: [
      head(0.50, 0.095),
      // gown, both sides
      { pts: [[0.475, 0.175], [0.43, 0.50], [0.375, 0.97]], w: 2.6 },
      { pts: [[0.525, 0.175], [0.575, 0.50], [0.64, 0.97]], w: 2.6 },
      // hem, closing the gown
      { pts: [[0.385, 0.97], [0.51, 1.0], [0.63, 0.97]], w: 2.2 },
      // veil falling from the head
      { pts: [[0.55, 0.065], [0.62, 0.135], [0.635, 0.27]], w: 1.5 },
      // hands clasped at the waist
      { pts: [[0.45, 0.42], [0.51, 0.46], [0.575, 0.42]], w: 1.8 },
    ],
  },

  // Head and arm lifted toward something she cannot see.
  'gertrude-look': {
    strokes: [
      head(0.535, 0.07),
      // gown leaning back from the apparition
      { pts: [[0.49, 0.16], [0.42, 0.55], [0.345, 0.97]], w: 2.6 },
      { pts: [[0.545, 0.165], [0.565, 0.55], [0.615, 0.97]], w: 2.6 },
      // hem
      { pts: [[0.355, 0.97], [0.48, 1.0], [0.605, 0.97]], w: 2.2 },
      // veil swept back
      { pts: [[0.475, 0.085], [0.405, 0.16], [0.38, 0.295]], w: 1.5 },
      // one arm half-raised toward it
      { pts: [[0.55, 0.245], [0.66, 0.145], [0.735, 0.05]], w: 1.8 },
    ],
  },

  // Sinking — knees gone, head thrown back, hand to her throat.
  'gertrude-fall': {
    strokes: [
      head(0.515, 0.245),
      // gown collapsing in a steep diagonal
      { pts: [[0.27, 1.0], [0.345, 0.83], [0.46, 0.70], [0.525, 0.60]], w: 2.9 },
      // the buckled fold beneath
      { pts: [[0.425, 1.0], [0.50, 0.86], [0.575, 0.73]], w: 2.3 },
      // torso arching back
      { pts: [[0.525, 0.60], [0.575, 0.45], [0.555, 0.335]], w: 2.4 },
      // hand to throat, elbow flung out
      { pts: [[0.56, 0.455], [0.675, 0.38], [0.59, 0.295]], w: 1.7 },
    ],
  },

  // --------------------------------------------------------------- ophelia
  // Slender, turned away, three strokes — open and fragile.
  'ophelia-stand': {
    strokes: [
      head(0.465, 0.105, 0.048, 1.3),
      // one long fragile S, neck to hem
      { pts: [[0.49, 0.165], [0.455, 0.36], [0.495, 0.62], [0.455, 1.0]], w: 1.9 },
      // a sleeve drifting loose
      { pts: [[0.475, 0.25], [0.405, 0.38], [0.385, 0.49]], w: 1.4 },
    ],
  },

  // -------------------------------------------------------------- polonius
  // Stooped, officious, mid-bow — hand presenting well below the chin.
  'polonius-stand': {
    strokes: [
      head(0.345, 0.29),
      // the hump of the bow
      { pts: [[0.39, 0.315], [0.49, 0.26], [0.575, 0.33], [0.60, 0.46]], w: 2.6 },
      // robe falling from the hip
      { pts: [[0.60, 0.46], [0.575, 0.72], [0.55, 1.0]], w: 2.4 },
      { pts: [[0.615, 0.48], [0.66, 0.73], [0.675, 1.0]], w: 2.1 },
      // the officious hand, sweeping the bow
      { pts: [[0.43, 0.38], [0.32, 0.47], [0.235, 0.505], [0.19, 0.475]], w: 1.7 },
    ],
  },

  // --------------------------------------------------------------- laertes
  // Fencing lunge: blade one long stroke, off arm low behind for balance.
  'laertes-lunge': {
    strokes: [
      head(0.655, 0.37),
      // torso, low and driving
      { pts: [[0.625, 0.43], [0.52, 0.52], [0.44, 0.615]], w: 2.5 },
      // back leg, straight to the ground
      { pts: [[0.44, 0.615], [0.27, 0.79], [0.10, 0.985]], w: 2.0 },
      // front leg, deep bend
      { pts: [[0.44, 0.615], [0.565, 0.745], [0.595, 1.0]], w: 2.0 },
      // sword arm
      { pts: [[0.645, 0.44], [0.77, 0.41], [0.85, 0.395]], w: 1.8 },
      // the blade
      { pts: [[0.85, 0.39], [1.0, 0.35]], w: 1.3 },
      // off arm trailing low behind
      { pts: [[0.615, 0.445], [0.50, 0.50], [0.405, 0.515]], w: 1.6 },
    ],
  },

  // --------------------------------------------------------------- players
  // The dumb-show: one bends and tips the vial over the sleeper's ear.
  'player-pour': {
    strokes: [
      // the pourer, bent over his work
      head(0.50, 0.305),
      { pts: [[0.465, 0.355], [0.405, 0.47], [0.36, 0.62]], w: 2.3 },
      { pts: [[0.36, 0.62], [0.32, 0.80], [0.305, 1.0]], w: 1.9 },
      { pts: [[0.36, 0.62], [0.415, 0.81], [0.42, 1.0]], w: 1.9 },
      // the pouring arm, reaching down over the ear
      { pts: [[0.475, 0.39], [0.545, 0.49], [0.585, 0.575]], w: 1.7 },
      // the sleeper, lying away to the right
      head(0.61, 0.815, 0.05),
      { pts: [[0.675, 0.81], [0.79, 0.79], [0.92, 0.825]], w: 2.5 },
      { pts: [[0.92, 0.825], [0.955, 0.79]], w: 1.8 },
    ],
    accents: [
      // the vial, tipped
      { pts: [[0.55, 0.535], [0.655, 0.605]], w: 2.0, color: RUBRIC },
      // the drop, falling to the ear
      { pts: [[0.62, 0.65], [0.615, 0.72]], w: 1.4, color: RUBRIC },
    ],
  },

  // The player king asleep, small ink crown still on his brow.
  'player-sleep': {
    strokes: [
      head(0.18, 0.80, 0.052),
      // body lying, a gentle mound
      { pts: [[0.25, 0.79], [0.41, 0.755], [0.585, 0.77], [0.80, 0.835]], w: 2.6 },
      // feet, a small upturned dash
      { pts: [[0.835, 0.845], [0.865, 0.765]], w: 1.8 },
      // arm folded on the chest
      { pts: [[0.32, 0.77], [0.37, 0.83], [0.435, 0.835]], w: 1.6 },
      // his crown — ink, not rubric; only the real king bleeds red
      crown(0.105, 0.705, 0.055, -0.6, undefined),
    ],
  },

  // --------------------------------------------------------------- horatio
  // The witness: straight, steady, plain.
  'horatio-stand': {
    strokes: [
      head(0.50, 0.105),
      // plain straight body
      { pts: [[0.50, 0.17], [0.50, 0.38], [0.50, 0.565]], w: 2.5 },
      // two quiet legs
      { pts: [[0.50, 0.565], [0.475, 0.78], [0.465, 1.0]], w: 1.9 },
      { pts: [[0.50, 0.565], [0.525, 0.78], [0.535, 1.0]], w: 1.9 },
      // hands met before him
      { pts: [[0.435, 0.40], [0.50, 0.435], [0.565, 0.40]], w: 1.7 },
    ],
  },

  // ------------------------------------------------------------ fortinbras
  // A soldier like an exclamation mark, pike taller than he is.
  'fortinbras-stand': {
    strokes: [
      head(0.45, 0.095),
      // one rigid line, neck to ground
      { pts: [[0.45, 0.16], [0.45, 0.55], [0.45, 1.0]], w: 2.8 },
      // squared shoulders
      { pts: [[0.355, 0.21], [0.45, 0.185], [0.545, 0.21]], w: 2.2 },
      // arm out to the pike shaft
      { pts: [[0.515, 0.225], [0.585, 0.295], [0.64, 0.33]], w: 1.7 },
      // the pike: thin shaft, heavy short point
      { pts: [[0.645, 0.075], [0.645, 0.50], [0.645, 1.0]], w: 1.4 },
      { pts: [[0.645, 0.09], [0.645, 0.005]], w: 2.4 },
    ],
  },
};
