// Route risk per time step (Florence replay steps, or Now + forecast steps: see live-route.ts). Pure functions (no imports) so scripts/route-check.mjs can run them under Node.

export type LngLat = [number, number];

export type XAssessed = {
  id: string; name: string; lat: number; lon: number; county: string; fema_zone: string; tidal: boolean;
  first_above_RL10_utc: string | null; people_affected: number;
  basis?: "structure" | "osm"; // structure = NCDOT/NBI bridge or culvert; osm = OpenStreetMap road-stream intersection (may not be a bridge)
  level: string; // one digit per step: index into RouteCrossings.levels; "-" = no value for that step (unknown, never treated as open)
  ratio_q10: (number | null)[]; // flow / 10-year flow per step
  p_pct: number[]; // PLACEHOLDER flood chance, percent (replay only; zeros in the live view, which shows no probability)
};
export type RouteCrossings = { hours: number; levels: string[]; assessed: XAssessed[]; not_assessed: [string, number, number, string][] };

export type OnRoute = { id: string; km: number; lat: number; lon: number; x: XAssessed | null; reason?: string };
export type HourStatus = { blocked: OnRoute[]; watch: OnRoute[]; unknown: OnRoute[]; pFail: number; state: 0 | 1 | 2 };

export const CLOSED = 3; // levels[3] = RL10: the scenario closes the crossing at or above this
export const AT_RISK_P = 0.35;

/** Google/Valhalla encoded polyline, precision 6. */
export function decodePolyline6(s: string): LngLat[] {
  const out: LngLat[] = [];
  let i = 0, lat = 0, lon = 0;
  const next = () => {
    let b, shift = 0, v = 0;
    do { b = s.charCodeAt(i++) - 63; v |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    return v & 1 ? ~(v >> 1) : v >> 1;
  };
  while (i < s.length) { lat += next(); lon += next(); out.push([lon / 1e6, lat / 1e6]); }
  return out;
}

// Spatial index: crossings bucketed in 0.005 degree cells (~500 m), built once per RouteCrossings object. A route is matched by walking its
// segments and testing only the crossings in the cells each segment touches, so cost follows route length, not the ~2,900 crossings.
const CELL = 0.005;
type Pt = { id: string; lat: number; lon: number; x: XAssessed | null; reason?: string };
const cellKey = (i: number, j: number) => i * 100003 + j;
const GRIDS = new WeakMap<RouteCrossings, Map<number, Pt[]>>();
function gridOf(X: RouteCrossings) {
  let g = GRIDS.get(X);
  if (!g) {
    const m = new Map<number, Pt[]>();
    const add = (p: Pt) => { const k = cellKey(Math.floor(p.lon / CELL), Math.floor(p.lat / CELL)); const a = m.get(k); if (a) a.push(p); else m.set(k, [p]); };
    for (const x of X.assessed) add({ id: x.id, lat: x.lat, lon: x.lon, x });
    for (const [id, lat, lon, reason] of X.not_assessed) add({ id, lat, lon, x: null, reason });
    GRIDS.set(X, (g = m));
  }
  return g;
}

/** Crossings within `tolM` metres of the route line, in driving order. */
export function crossingsOnRoute(shape: LngLat[], X: RouteCrossings, tolM = 30): OnRoute[] {
  if (shape.length < 2) return [];
  const grid = gridOf(X);
  const lat0 = shape[0][1], kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110570;
  const dLon = tolM / kx, dLat = tolM / ky;
  const best = new Map<Pt, { d: number; along: number }>();
  let cum = 0;
  for (let i = 1; i < shape.length; i++) {
    const ax = shape[i - 1][0] * kx, ay = shape[i - 1][1] * ky, dx = shape[i][0] * kx - ax, dy = shape[i][1] * ky - ay, L2 = dx * dx + dy * dy, L = Math.sqrt(L2);
    const lo0 = Math.min(shape[i - 1][0], shape[i][0]), lo1 = Math.max(shape[i - 1][0], shape[i][0]);
    const la0 = Math.min(shape[i - 1][1], shape[i][1]), la1 = Math.max(shape[i - 1][1], shape[i][1]);
    for (let ci = Math.floor((lo0 - dLon) / CELL); ci <= Math.floor((lo1 + dLon) / CELL); ci++)
      for (let cj = Math.floor((la0 - dLat) / CELL); cj <= Math.floor((la1 + dLat) / CELL); cj++)
        for (const p of grid.get(cellKey(ci, cj)) ?? []) {
          const px = p.lon * kx, py = p.lat * ky;
          const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
          const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
          if (d <= tolM && d < (best.get(p)?.d ?? Infinity)) best.set(p, { d, along: cum + t * L });
        }
    cum += L;
  }
  const hits: OnRoute[] = [];
  for (const [p, b] of best) hits.push({ id: p.id, km: b.along / 1000, lat: p.lat, lon: p.lon, x: p.x, reason: p.reason });
  return hits.sort((a, b) => a.km - b.km);
}

/** Crossings closed in step h that lie within `corridorM` of the straight line from -> to, nearest first (at most `cap`).
 * A detour search starts with all of them excluded at once instead of discovering them one failed route at a time. */
export function closedNear(X: RouteCrossings, h: number, from: LngLat, to: LngLat, corridorM = 4000, cap = 50) {
  const kx = 111320 * Math.cos((from[1] * Math.PI) / 180), ky = 110570;
  const ax = from[0] * kx, ay = from[1] * ky, dx = to[0] * kx - ax, dy = to[1] * ky - ay, L2 = dx * dx + dy * dy;
  const out: { id: string; lon: number; lat: number; d: number }[] = [];
  for (const x of X.assessed) {
    if (!(parseInt(x.level[h] ?? "-", 10) >= CLOSED)) continue;
    const px = x.lon * kx, py = x.lat * ky, t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d <= corridorM) out.push({ id: x.id, lon: x.lon, lat: x.lat, d });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, cap);
}

/** Status of a route in step h: blocked if any assessed crossing is at or above RL10. Unknown = assessed crossing with no value this step (reported, never counted as open).
 * pFail is kept for the replay data but is no longer used for status or ranking. */
export function routeAtHour(on: OnRoute[], h: number): HourStatus {
  const blocked: OnRoute[] = [], watch: OnRoute[] = [], unknown: OnRoute[] = [];
  let q = 1;
  for (const o of on) {
    if (!o.x) continue;
    const lv = parseInt(o.x.level[h] ?? "-", 10);
    if (Number.isNaN(lv)) { unknown.push(o); continue; }
    if (lv >= CLOSED) blocked.push(o); else if (lv > 0) watch.push(o);
    q *= 1 - Math.min(100, Math.max(0, o.x.p_pct[h] ?? 0)) / 100;
  }
  const pFail = 1 - q;
  return { blocked, watch, unknown, pFail, state: blocked.length ? 2 : watch.length ? 1 : 0 };
}

export type RouteOption = {
  id: string; serviceId: string; label: string; via: string;
  kind: "fastest" | "alternate" | "backup" | "detour";
  avoids?: string; // backup only: id of the crossing this route was asked to stay clear of
  timeS: number; km: number; shape: LngLat[]; on: OnRoute[];
};

const KY = 110570;
const kxAt = (lat: number) => 111320 * Math.cos((lat * Math.PI) / 180);

/** Crossings worth a backup route: assessed, with people behind them, most people first. Each id and each place (within `minSepM`) is used once. */
export function backupCandidates(on: OnRoute[], max = 2, minSepM = 50): OnRoute[] {
  const out: OnRoute[] = [];
  for (const o of on.filter((c) => c.x && c.x.people_affected > 0).sort((a, b) => b.x!.people_affected - a.x!.people_affected)) {
    const kx = kxAt(o.lat);
    if (out.some((p) => p.id === o.id || Math.hypot((p.lon - o.lon) * kx, (p.lat - o.lat) * KY) < minSepM)) continue;
    out.push(o);
    if (out.length >= max) break;
  }
  return out;
}

const OVERLAPS = new WeakMap<LngLat[], WeakMap<LngLat[], number>>();
/** Share (0..1) of line `a` that runs within `tolM` of line `b`, judged at points every `stepM` metres along `a`. */
export function overlapShare(a: LngLat[], b: LngLat[], stepM = 50, tolM = 25): number {
  if (a.length < 2 || b.length < 2) return 0;
  const hit = OVERLAPS.get(a)?.get(b);
  if (hit !== undefined) return hit;
  const kx = kxAt(a[0][1]);
  const bx = b.map((p) => p[0] * kx), by = b.map((p) => p[1] * KY);
  const near = (px: number, py: number) => {
    for (let i = 1; i < b.length; i++) {
      const ax = bx[i - 1], ay = by[i - 1], dx = bx[i] - ax, dy = by[i] - ay;
      if (px < Math.min(ax, bx[i]) - tolM || px > Math.max(ax, bx[i]) + tolM || py < Math.min(ay, by[i]) - tolM || py > Math.max(ay, by[i]) + tolM) continue;
      const L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
      if (Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) <= tolM) return true;
    }
    return false;
  };
  let n = 0, near_ = 0, carry = 0, px = a[0][0] * kx, py = a[0][1] * KY;
  n++; if (near(px, py)) near_++;
  for (let i = 1; i < a.length; i++) {
    const qx = a[i][0] * kx, qy = a[i][1] * KY, seg = Math.hypot(qx - px, qy - py);
    let at = stepM - carry;
    for (; at <= seg; at += stepM) { n++; if (near(px + ((qx - px) * at) / seg, py + ((qy - py) * at) / seg)) near_++; }
    carry = seg - (at - stepM);
    px = qx; py = qy;
  }
  const share = near_ / n;
  let m = OVERLAPS.get(a); if (!m) OVERLAPS.set(a, (m = new WeakMap()));
  m.set(b, share);
  return share;
}

/** Keeps the options in the order given, dropping any that runs along an already-kept one for more than `maxShare` of its length. At most `max` survive. */
export function dedupeOptions(opts: RouteOption[], max = 4, maxShare = 0.85): RouteOption[] {
  const kept: RouteOption[] = [];
  for (const o of opts) {
    if (kept.length >= max) break;
    if (kept.some((k) => k.id === o.id || overlapShare(o.shape, k.shape) > maxShare)) continue;
    kept.push(o);
  }
  return kept;
}

/** Best first: fewest closed crossings (open routes first), then faster. */
export function rankRoutes(opts: RouteOption[], h: number) {
  return opts
    .map((o) => ({ o, s: routeAtHour(o.on, h) }))
    .sort((a, b) => a.s.blocked.length - b.s.blocked.length
      || a.o.timeS - b.o.timeS);
}

/** Steps (of the window) in which the route is blocked. */
export const blockedHours = (on: OnRoute[], hours: number) =>
  Array.from({ length: hours }, (_, h) => h).filter((h) => routeAtHour(on, h).blocked.length > 0);

// ---- Flags: a route can be open and still be a bad answer in an emergency ----

/** Guide times in minutes by service kind. ER access within 30 min is the standard the pipeline already uses for redundancy; fire, EMS and police are quicker. */
export const LIMIT_MIN: Record<string, number> = { hospital_ed: 30, hospital: 30, urgent_care: 30, pharmacy: 30, dialysis: 45, nursing_home: 45, fire: 15, ems: 15, police: 15 };
export const DETOUR_EXTRA_S = 600, DETOUR_EXTRA_RATIO = 0.5; // a long detour adds 10+ min AND 50%+ over the fastest normal route

export type Flag = { code: "slow" | "detour" | "unknown" | "unassessed"; level: "warn" | "alert"; text: string };

/** Flags for one route at one step. `fastestS` = fastest normal route to the same service, seconds. */
export function routeFlags(o: RouteOption, kind: string, fastestS: number | undefined, st: HourStatus): Flag[] {
  const out: Flag[] = [], min = Math.round(o.timeS / 60), limit = LIMIT_MIN[kind] ?? 30;
  if (min > limit) out.push({ code: "slow", level: min > limit * 1.5 ? "alert" : "warn", text: `Takes about ${min} min in normal traffic, over the ${limit} min guide for this kind of service. Call 911 in an emergency.` });
  if (fastestS !== undefined && o.timeS - fastestS >= DETOUR_EXTRA_S && o.timeS - fastestS >= DETOUR_EXTRA_RATIO * fastestS)
    out.push({ code: "detour", level: "warn", text: `Adds about ${Math.round((o.timeS - fastestS) / 60)} min over the fastest normal route.` });
  if (st.unknown.length) out.push({ code: "unknown", level: "warn", text: `${st.unknown.length} crossing${st.unknown.length > 1 ? "s" : ""} on this route ha${st.unknown.length > 1 ? "ve" : "s"} no water reading for this step: not assumed open.` });
  const un = o.on.filter((c) => !c.x).length;
  if (un) out.push({ code: "unassessed", level: "warn", text: `${un} crossing${un > 1 ? "s" : ""} on this route could not be assessed (the model has no flow data for that stream). Not assessed is not the same as open.` });
  return out;
}
