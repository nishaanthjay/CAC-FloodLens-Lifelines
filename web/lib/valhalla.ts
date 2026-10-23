// Public FOSSGIS Valhalla server (OpenStreetMap roads, no key, fair use). GET with ?json= avoids a CORS preflight.
import { closedNear, crossingsOnRoute, decodePolyline6, routeAtHour, type LngLat, type RouteCrossings } from "./route";

const BASE = "https://valhalla1.openstreetmap.de";
export const TIMEOUT_MS = 15000; // one request gives up after this long
export const SLOW_MS = 6000; // a request slower than this raises the "routing is slow" notice
export const DETOUR_BUDGET_MS = 30000; // the whole detour search (several requests) stops after this long
const MAX_CACHE = 150;

const loc = ([lon, lat]: LngLat) => ({ lat, lon });
const cache = new Map<string, Promise<unknown>>();

/** Every request reports how long it took and whether it timed out, so the page can say when routing is slow instead of just spinning. */
export type Timing = { path: string; ms: number; timedOut: boolean };
const listeners = new Set<(t: Timing) => void>();
export const onTiming = (cb: (t: Timing) => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

export class RoutingTimeout extends Error {
  constructor(s: number) { super(`the routing service did not answer within ${s} s`); }
}

function get<T>(path: string, body: object, timeoutMs = TIMEOUT_MS): Promise<T> {
  const url = `${BASE}/${path}?json=${encodeURIComponent(JSON.stringify(body))}`;
  const hit = cache.get(url);
  if (hit) return hit as Promise<T>;
  const t0 = performance.now(), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeoutMs);
  let timedOut = false;
  const p = fetch(url, { signal: ctl.signal }).then(async (r) => {
    const j = await r.json();
    if (!r.ok && j?.error_code !== 442) throw new Error(j?.error ?? `routing ${r.status}`);
    return j; // 442 = no path: returned as data, callers treat it as "no route"
  }).catch((e) => {
    if ((e as Error).name === "AbortError") { timedOut = true; throw new RoutingTimeout(Math.round(timeoutMs / 1000)); }
    throw e;
  }).finally(() => {
    clearTimeout(timer);
    for (const cb of listeners) cb({ path, ms: Math.round(performance.now() - t0), timedOut });
  });
  cache.set(url, p);
  p.catch(() => cache.delete(url)); // failures and timeouts are retried next time, never cached
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value!);
  return p as Promise<T>;
}

/** Drive time (s) and distance (km) from one origin to many targets; null where unroutable. */
export async function matrix(from: LngLat, to: LngLat[]) {
  const j = await get<{ sources_to_targets: { time: number | null; distance: number | null }[][] }>("sources_to_targets",
    { sources: [loc(from)], targets: to.map(loc), costing: "auto" });
  return j.sources_to_targets[0].map((c) => (c.time == null ? null : { timeS: c.time, km: c.distance ?? 0 }));
}

export type Trip = { shape: LngLat[]; timeS: number; km: number; via: string };
type Raw = { trip?: { summary: { time: number; length: number }; legs: { shape: string; maneuvers?: { street_names?: string[]; length: number }[] }[] }; alternates?: Raw[] };

const box = ([lon, lat]: LngLat, d = 0.0004) => [[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]];
// Public server limits: 50 exclude_locations; exclude_polygons up to 100 vertices (20 boxes) and 10 km total perimeter.
export const MAX_POINTS = 50, MAX_BOXES = 20;

/** Fastest route plus up to `alternates` alternatives, avoiding road edges at `avoid` points and inside boxes around `hard` points. [] = no path. */
export async function route(from: LngLat, to: LngLat, avoid: LngLat[] = [], alternates = 0, hard: LngLat[] = []): Promise<Trip[]> {
  const j = await get<Raw>("route", {
    locations: [loc(from), loc(to)], costing: "auto", units: "kilometers", directions_type: "maneuvers",
    ...(alternates ? { alternates } : {}),
    ...(avoid.length ? { exclude_locations: avoid.map(loc) } : {}),
    ...(hard.length ? { exclude_polygons: hard.map((p) => box(p)) } : {}),
  });
  const trips = j.trip ? [j, ...(j.alternates ?? [])] : [];
  return trips.map(({ trip }) => {
    const names = new Map<string, number>();
    for (const m of trip!.legs[0].maneuvers ?? []) for (const n of m.street_names?.slice(0, 1) ?? []) names.set(n, (names.get(n) ?? 0) + m.length);
    const via = [...names].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n).join(" and ") || "local roads";
    return { shape: decodePolyline6(trip!.legs[0].shape), timeS: trip!.summary.time, km: trip!.summary.length, via };
  });
}

/** Route that avoids every crossing closed in step h. The first request already excludes all closed crossings near the straight line from origin to
 * destination (closedNear); each later request adds the closed crossings the last route still passed: first as a point (blocks the nearest road edge),
 * then as a box if the route still passes it (e.g. the other carriageway). Stops after `maxTries` requests or `budgetMs`, and says which. */
export async function openRoute(from: LngLat, to: LngLat, X: RouteCrossings, h: number, maxTries = 6, budgetMs = DETOUR_BUDGET_MS) {
  const t0 = Date.now(), points = new Map<string, LngLat>(), boxes = new Map<string, LngLat>();
  for (const c of closedNear(X, h, from, to)) points.set(c.id, [c.lon, c.lat]);
  let seeded = points.size > 0;
  const out = (trip: (Trip & { on: ReturnType<typeof crossingsOnRoute> }) | null, reason: string | null) =>
    ({ trip, avoided: points.size + boxes.size, reason, ms: Date.now() - t0 });
  for (let i = 0; i < maxTries; i++) {
    if (Date.now() - t0 > budgetMs) return out(null, `the detour search was stopped after ${Math.round((Date.now() - t0) / 1000)} s (too slow)`);
    let t: Trip | undefined;
    try { [t] = await route(from, to, [...points.values()], 0, [...boxes.values()]); }
    catch (e) { return out(null, `the public router ${e instanceof RoutingTimeout ? "timed out" : "refused the detour"} (${(e as Error).message})`); }
    if (!t && seeded) { points.clear(); seeded = false; continue; } // over-constrained by the up-front exclusions: fall back to discovering closures one at a time
    if (!t) return out(null, "no road path once the closed crossings are avoided");
    const on = crossingsOnRoute(t.shape, X);
    const shut = routeAtHour(on, h).blocked;
    if (!shut.length) return out({ ...t, on }, null);
    for (const o of shut) {
      if (!points.has(o.id)) points.set(o.id, [o.lon, o.lat]);
      else if (!boxes.has(o.id)) boxes.set(o.id, [o.lon, o.lat]);
    }
    if (points.size > MAX_POINTS || boxes.size > MAX_BOXES)
      return out(null, `more closed crossings than the public router can avoid at once (${MAX_POINTS})`);
  }
  return out(null, `every detour found in ${maxTries} tries still crossed a closed crossing`);
}
