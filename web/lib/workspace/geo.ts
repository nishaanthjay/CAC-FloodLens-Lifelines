// Geometry for the route overlay. Pure (no imports) so scripts/workspace-check.mjs can run it under Node.
export type LngLat = [number, number];

const KY = 110570; // metres per degree of latitude
const CELL = 100; // metres: base-route segments are bucketed in cells this wide
const cell = (i: number, j: number) => i * 100003 + j;

/** Runs of `scen` (at least 2 points each) that stray more than `tolM` metres from `base`: the stretches of a scenario route that are not on the normal route. */
export function detourRuns(base: LngLat[], scen: LngLat[], tolM = 30): LngLat[][] {
  if (base.length < 2 || scen.length < 2) return [];
  const kx = 111320 * Math.cos((scen[0][1] * Math.PI) / 180);
  const bx = base.map((p) => p[0] * kx), by = base.map((p) => p[1] * KY);
  const grid = new Map<number, number[]>();
  for (let i = 1; i < base.length; i++) {
    const x0 = Math.min(bx[i - 1], bx[i]) - tolM, x1 = Math.max(bx[i - 1], bx[i]) + tolM, y0 = Math.min(by[i - 1], by[i]) - tolM, y1 = Math.max(by[i - 1], by[i]) + tolM;
    for (let a = Math.floor(x0 / CELL); a <= Math.floor(x1 / CELL); a++) for (let b = Math.floor(y0 / CELL); b <= Math.floor(y1 / CELL); b++) {
      const k = cell(a, b), l = grid.get(k);
      if (l) l.push(i); else grid.set(k, [i]);
    }
  }
  const near = (p: LngLat) => {
    const px = p[0] * kx, py = p[1] * KY;
    for (const i of grid.get(cell(Math.floor(px / CELL), Math.floor(py / CELL))) ?? []) {
      const ax = bx[i - 1], ay = by[i - 1], dx = bx[i] - ax, dy = by[i] - ay, L2 = dx * dx + dy * dy;
      const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
      if (Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) <= tolM) return true;
    }
    return false;
  };
  const off = scen.map((p) => !near(p));
  const runs: LngLat[][] = [];
  for (let i = 0; i < scen.length; i++) {
    if (!off[i]) continue;
    let j = i;
    while (j + 1 < scen.length && off[j + 1]) j++;
    runs.push(scen.slice(Math.max(0, i - 1), Math.min(scen.length, j + 2))); // one vertex each side joins the detour to the route
    i = j;
  }
  return runs.filter((r) => r.length >= 2);
}

/** The point halfway along a line, by length. */
export function midpoint(line: LngLat[]): LngLat {
  const kx = 111320 * Math.cos((line[0][1] * Math.PI) / 180);
  const seg = line.slice(1).map((p, i) => Math.hypot((p[0] - line[i][0]) * kx, (p[1] - line[i][1]) * KY));
  let half = seg.reduce((a, b) => a + b, 0) / 2;
  for (let i = 0; i < seg.length; i++) {
    if (half <= seg[i] || i === seg.length - 1) { const t = seg[i] ? Math.min(1, half / seg[i]) : 0; return [line[i][0] + t * (line[i + 1][0] - line[i][0]), line[i][1] + t * (line[i + 1][1] - line[i][1])]; }
    half -= seg[i];
  }
  return line[0];
}

export const length = (line: LngLat[]) => {
  const kx = 111320 * Math.cos((line[0][1] * Math.PI) / 180);
  return line.slice(1).reduce((a, p, i) => a + Math.hypot((p[0] - line[i][0]) * kx, (p[1] - line[i][1]) * KY), 0);
};
