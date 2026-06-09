// The page map — the final frame, designed backward. All coordinates in page units
// (page is 1000 x 1414). Regions come from the shooting script; anchors are the
// load-bearing points every scene must agree on.

export const REGIONS = {
  title:            { x: 120, y: 36,   w: 760, h: 76 },
  rubric:           { x: 180, y: 130,  w: 640, h: 44 },
  margin_left:      { x: 36,  y: 130,  w: 110, h: 1160 },
  band_ghost:       { x: 180, y: 200,  w: 560, h: 130 },
  band_fork:        { x: 180, y: 350,  w: 560, h: 230 },
  band_eval:        { x: 180, y: 600,  w: 560, h: 170 },
  inset_mousetrap:  { x: 400, y: 600,  w: 220, h: 150 },
  band_prayer:      { x: 180, y: 790,  w: 560, h: 130 },
  band_closet:      { x: 180, y: 940,  w: 560, h: 90 },
  band_ophelia:     { x: 180, y: 1050, w: 560, h: 100 },
  band_readiness:   { x: 180, y: 1170, w: 560, h: 70 },
  band_duel:        { x: 180, y: 1260, w: 560, h: 80 },
  colophon:         { x: 180, y: 1350, w: 560, h: 56 },
  margin_right:     { x: 770, y: 200,  w: 160, h: 1140 },
  telemetry:        { x: 940, y: 130,  w: 36,  h: 1230 },
};

export const ANCHORS = {
  rubricStop:      { x: 812, y: 160 },    // the command's full stop — the root node
  redRuleX: 158,                          // the hairline red rule down the inner left margin
  ghostImpress:    { x: 790, y: 250 },    // where the Ghost's outline collapses
  globeCircle:     { x: 565, y: 310 },    // 'globe' circled in pen
  passTick:        { x: 612, y: 606 },    // verdigris PASS tick, NE corner of the inset
  kneelClaudius:   { x: 800, y: 840 },    // kneeling figure in the right gutter
  thoughtBlots:    { x: 800, y: 915 },    // pooled thought-blots below him
  seal1:           { x: 90,  y: 985 },    // closet (Polonius)
  seal2:           { x: 90,  y: 1100 },   // eviction (Ophelia)
  seal3:           { x: 90,  y: 1270 },   // Gertrude
  seal4:           { x: 90,  y: 1295 },   // Claudius
  seal5:           { x: 90,  y: 1318 },   // Laertes
  hurtsTheKing:    { x: 740, y: 1300 },   // right-aligned italic, written never spoken
  goldPeriod:      { x: 705, y: 1332 },   // THE gold. Nothing else on the page is gold.
  evictNotch:      { x: 956, y: 1090 },
  penKnot:         { x: 90,  y: 1372 },   // Horatio's notarial knot at the ledger foot
};

// Standard text metrics for body bands
export const BODY = { size: 17, lh: 26, indent: 14 };

// y of line i within a region (top-aligned column)
export function lineY(region, i, lh = BODY.lh) {
  return region.y + lh * (i + 0.85);
}
export function colX(region) { return region.x + BODY.indent; }

// Camera convention used by the script: CAM(cx, cy, w) — w is viewport width
// in page units; 16:9 means visible height = w * 9/16.
export const CAM = (t, cx, cy, z, ease) => ({ t, cx, cy, z, ...(ease ? { ease } : {}) });
