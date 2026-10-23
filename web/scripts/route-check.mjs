// Self-check for lib/route.ts (Node 22.6+ strips the TypeScript types). Run: npm run check:route
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LIMIT_MIN, blockedHours, closedNear, crossingsOnRoute, decodePolyline6, rankRoutes, routeAtHour, routeFlags } from "../lib/route.ts";
import { liveWindow, stepLabel } from "../lib/live-route.ts";

// Polyline6 round trip on a known value (Valhalla precision 6).
const enc = (pts) => {
  let out = "", plat = 0, plon = 0;
  const one = (v) => { v = v < 0 ? ~(v << 1) : v << 1; while (v >= 0x20) { out += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } out += String.fromCharCode(v + 63); };
  for (const [lon, lat] of pts) { const a = Math.round(lat * 1e6), o = Math.round(lon * 1e6); one(a - plat); one(o - plon); plat = a; plon = o; }
  return out;
};
const line = [[-78.0, 34.2], [-77.99, 34.2], [-77.98, 34.21]];
assert.deepEqual(decodePolyline6(enc(line)), line);

// Crossings: one on the line, one 20 m off, one 200 m off; level digits per hour (3 = RL10 closed).
const X = { hours: 3, levels: ["RL0", "RL2", "RL5", "RL10", "RL25", "RL50"], not_assessed: [["N1", 34.205, -77.985, "osm_secondary"]],
  assessed: [
    { id: "A", lat: 34.2, lon: -77.995, level: "013", p_pct: [10, 50, 90], ratio_q10: [0.2, 0.8, 1.5] },
    { id: "B", lat: 34.20018, lon: -77.992, level: "000", p_pct: [0, 0, 0], ratio_q10: [0, 0, 0] },
    { id: "C", lat: 34.2018, lon: -77.99, level: "555", p_pct: [100, 100, 100], ratio_q10: [9, 9, 9] },
  ] };
const on = crossingsOnRoute(line, X, 30);
assert.deepEqual(on.map((o) => o.id), ["A", "B", "N1"], "A and B within 30 m in driving order, C excluded, N1 unassessed");
assert.equal(on[2].x, null);

assert.equal(routeAtHour(on, 0).state, 0);
assert.equal(routeAtHour(on, 1).state, 1, "above 2-yr flow = at risk");
assert.equal(routeAtHour(on, 2).state, 2, "RL10 = blocked");
assert.ok(Math.abs(routeAtHour(on, 1).pFail - 0.5) < 1e-9);
assert.deepEqual(blockedHours(on, 3), [2]);

// Extremes: p = 100% and 0% must stay in [0, 1]; empty route is open.
const sure = crossingsOnRoute(line, { ...X, assessed: [{ ...X.assessed[0], p_pct: [100, 0, -5] }] }, 30);
assert.equal(routeAtHour(sure, 0).pFail, 1);
assert.equal(routeAtHour(sure, 2).pFail, 0);
assert.deepEqual(routeAtHour([], 0), { blocked: [], watch: [], unknown: [], pFail: 0, state: 0 });

// Ranking: fewer closures first, then chance, then time.
const opt = (id, timeS, o) => ({ id, serviceId: "S", label: id, via: "", kind: "fastest", timeS, km: 1, shape: line, on: o });
const r = rankRoutes([opt("blocked", 60, on), opt("slow-open", 900, []), opt("fast-open", 300, [])], 2).map((x) => x.o.id);
assert.deepEqual(r, ["fast-open", "slow-open", "blocked"]);

// A "-" level (no model value) is unknown, never open: it is reported and does not make the route look clear.
const gap = crossingsOnRoute(line, { ...X, assessed: [{ ...X.assessed[0], level: "-1-", ratio_q10: [null, 0.8, null], p_pct: [0, 0, 0] }] }, 30);
assert.equal(routeAtHour(gap, 0).unknown.length, 1);
assert.equal(routeAtHour(gap, 1).watch.length, 1);
assert.equal(routeAtHour(gap, 2).unknown[0].id, "A");

// Flags: slow trip, long detour, unknown and unassessed crossings.
const ro = (timeS, onr) => ({ id: "r", serviceId: "S", label: "r", via: "", kind: "fastest", timeS, km: 1, shape: line, on: onr });
const calm = routeAtHour([], 0);
assert.deepEqual(routeFlags(ro(20 * 60, []), "hospital_ed", 20 * 60, calm), []);
assert.equal(routeFlags(ro(31 * 60, []), "hospital_ed", 31 * 60, calm)[0].code, "slow");
assert.equal(routeFlags(ro(50 * 60, []), "hospital_ed", 50 * 60, calm)[0].level, "alert", "over 1.5x the guide is an alert");
assert.equal(routeFlags(ro(16 * 60, []), "fire", 16 * 60, calm)[0].code, "slow", "fire guide is 15 min");
assert.equal(LIMIT_MIN.dialysis, 45);
assert.ok(routeFlags(ro(26 * 60, []), "dialysis", 15 * 60, calm).some((f) => f.code === "detour"), "adds 11 min and 73%");
assert.ok(!routeFlags(ro(26 * 60, []), "dialysis", 20 * 60, calm).some((f) => f.code === "detour"), "adds only 6 min");
assert.ok(routeFlags(ro(600, on), "hospital_ed", 600, routeAtHour(on, 2)).some((f) => f.code === "unassessed"));
assert.ok(routeFlags(ro(600, gap), "hospital_ed", 600, routeAtHour(gap, 0)).some((f) => f.code === "unknown"));

// Detour seeding: closed crossings near the straight line, nearest first, capped.
const seed = closedNear(X, 2, [-78.0, 34.2], [-77.98, 34.21], 4000, 50);
assert.deepEqual(seed.map((c) => c.id).sort(), ["A", "C"], "A (level RL10) and C (RL50) are closed at step 2; B is not");
assert.equal(closedNear(X, 2, [-78.0, 34.2], [-77.98, 34.21], 4000, 1).length, 1);
assert.deepEqual(closedNear(X, 0, [-78.0, 34.2], [-77.98, 34.21]).map((c) => c.id), ["C"], "only C (RL50 every step) is closed at step 0");

// Live window: step 0 = modelled hour covering now; later steps are forecast hours; an ended forecast is all unknown.
const base = { hours: 18, levels: X.levels, not_assessed: [], assessed: [{ ...X.assessed[0], level: "0".repeat(18), p_pct: Array(18).fill(40), first_above_RL10_utc: "2018-09-15T12:00Z" }] };
const vt = Array.from({ length: 18 }, (_, i) => new Date(Date.UTC(2026, 9, 23, 13 + i)).toISOString().slice(0, 16) + "Z");
const fc = { valid_times: vt, crossings: [{ id: "A", name: "A", q10_cfs: 1, in_model_output: true, ratio_q10: Array.from({ length: 18 }, (_, i) => i / 10), level: "00000003".padEnd(18, "5") }] };
const at = (h, m) => Date.UTC(2026, 9, 23, h, m);
let w = liveWindow(base, fc, at(15, 20));
assert.equal(w.times[0], "2026-10-23T15:00Z", "latest hour at or before now stands in for now");
assert.equal(w.X.hours, 16);
assert.equal(w.X.assessed[0].level.length, 16);
assert.equal(w.X.assessed[0].level[5], "3", "lead index 7 (20:00Z) is step 5");
assert.deepEqual(w.X.assessed[0].p_pct.slice(0, 2), [0, 0], "no placeholder chances in the live view");
assert.equal(w.X.assessed[0].first_above_RL10_utc, null);
assert.equal(w.expired, false); assert.equal(w.withData, 1);
w = liveWindow(base, fc, at(12, 0));
assert.equal(w.times[0], vt[0], "forecast starts after now: first lead stands in");
assert.equal(w.X.hours, 18);
w = liveWindow(base, fc, at(13 + 17 + 3, 0));
assert.equal(w.expired, true);
assert.equal(routeAtHour(crossingsOnRoute(line, w.X, 30), 0).unknown.length, 1, "ended forecast: unknown, not open");
w = liveWindow(base, { valid_times: [], crossings: [] }, at(15, 0));
assert.equal(w.expired, true);
assert.equal(w.X.assessed[0].level, "-");
assert.equal(stepLabel(0), "Now"); assert.equal(stepLabel(3), "+3 h");

// Real data: all assessed crossings are indexed; matching a long route is fast and agrees with a brute-force scan.
const R = JSON.parse(readFileSync(new URL("../public/data/sample/route_crossings.json", import.meta.url), "utf8"));
assert.ok(R.assessed.length > 1000, `expected the full assessed set, got ${R.assessed.length}`);
assert.ok(R.assessed.every((a) => a.level.length === R.hours && a.ratio_q10.length === R.hours));
// A route that threads through 600 real crossings (sorted west to east), plus a 4,000-point straight diagonal.
const through = [...R.assessed].sort((p, q) => p.lon - q.lon).slice(0, 600).map((a) => [a.lon, a.lat]);
const N = through.length - 1;
const longLine = through;
const t0 = performance.now();
const hit = crossingsOnRoute(longLine, R, 30);
const ms = performance.now() - t0;
const kx = 111320 * Math.cos((longLine[0][1] * Math.PI) / 180), ky = 110570;
const brute = (p) => { let best = Infinity; for (let i = 1; i < longLine.length; i++) {
  const ax = longLine[i - 1][0] * kx, ay = longLine[i - 1][1] * ky, dx = longLine[i][0] * kx - ax, dy = longLine[i][1] * ky - ay, L2 = dx * dx + dy * dy;
  const px = p[1] * kx, py = p[0] * ky, t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
  best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy))); } return best; };
const want = new Set([...R.assessed.map((a) => [a.id, a.lat, a.lon]), ...R.not_assessed].filter(([, la, lo]) => brute([la, lo]) <= 30).map(([id]) => id));
assert.deepEqual(new Set(hit.map((h) => h.id)), want, "indexed match equals brute force");
assert.ok(hit.length >= 600, `route through 600 crossings should hit them all, got ${hit.length}`);
assert.ok(ms < 250, `matching ${N} segments against ${R.assessed.length + R.not_assessed.length} crossings took ${ms.toFixed(0)} ms`);
console.log(`route-check: all assertions passed (${R.assessed.length} assessed + ${R.not_assessed.length} unassessed crossings; ${hit.length} on a ${N}-segment route in ${ms.toFixed(0)} ms)`);
