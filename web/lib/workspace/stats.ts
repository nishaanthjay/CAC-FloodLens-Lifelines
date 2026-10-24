// Numbers behind the panels, computed from the same data the map draws. Pure (type-only imports) so scripts/workspace-check.mjs can run it under Node.
import type { Lookup } from "../sample";
import type { RouteCrossings, XAssessed } from "../route";

/** Level digit (RL0, RL2, RL5, RL10, RL25, RL50 = 0..5) -> tier id 0..4; RL25 and RL50 both read "Very high"; -1 = no model value. */
export const tierOfLevel = (lv: number): -1 | 0 | 1 | 2 | 3 | 4 => (Number.isNaN(lv) || lv < 0 ? -1 : (Math.min(lv, 4) as 0 | 1 | 2 | 3 | 4));
export const tierOfCrossing = (x: XAssessed, h: number) => tierOfLevel(parseInt(x.level[h] ?? "-", 10));

export type Keep = (x: XAssessed) => boolean;
export const layerKeep = (layer: "rivers" | "coastal" | "both"): Keep => (x) => layer === "both" || (layer === "coastal") === x.tidal;

/** Crossings and the people behind them per tier at step h (people are summed per crossing, so one person can count under several). */
export function tierBreakdown(X: RouteCrossings, h: number, keep: Keep = () => true) {
  const count = [0, 0, 0, 0, 0], people = [0, 0, 0, 0, 0];
  let unknown = 0, n = 0;
  for (const x of X.assessed) {
    if (!keep(x)) continue;
    n++;
    const t = tierOfCrossing(x, h);
    if (t < 0) { unknown++; continue; }
    count[t]++; people[t] += x.people_affected;
  }
  return { count, people, unknown, n };
}

/** Series per step of the tier breakdown, for the live (forecast) chart. */
export const tierSeries = (X: RouteCrossings, keep: Keep = () => true) => Array.from({ length: X.hours }, (_, h) => tierBreakdown(X, h, keep));

export type Row = { id: string; name: string; tier: number; people: number; ratio: number | null; x: XAssessed };
/** Top crossings at step h. "people": flagged (tier 3+) crossings first, then the rest, each by people affected. "flow": by flow / 10-year flow. */
export function topCrossings(X: RouteCrossings, h: number, by: "people" | "flow", keep: Keep = () => true, n = 10): Row[] {
  const rows: Row[] = [];
  for (const x of X.assessed) {
    if (!keep(x)) continue;
    const t = tierOfCrossing(x, h);
    if (t < 0) continue; // no model value this step: listed nowhere as a ranked risk, counted separately
    rows.push({ id: x.id, name: x.name, tier: t, people: x.people_affected, ratio: x.ratio_q10[h] ?? null, x });
  }
  rows.sort(by === "flow"
    ? (a, b) => (b.ratio ?? -1) - (a.ratio ?? -1) || b.people - a.people
    : (a, b) => +(b.tier >= 3) - +(a.tier >= 3) || b.people - a.people);
  return rows.slice(0, n);
}

export const ACCESS_IDS = ["lost", "gt10", "s1_10", "none", "na"] as const;
export type AccessId = (typeof ACCESS_IDS)[number];

/** Access state of a Census block at replay step h. detour_min: 0 = 1 min or less, null = no route; blocks with no baseline route are "not assessed", never "not flagged". */
export function blockState(b: Lookup["blocks"][number], h: number): AccessId {
  if (!b[7]) return "na";
  const r = b[8];
  if (!r) return "none";
  if (r.lost[h]) return "lost";
  const d = r.detour_min[h];
  if (d === null || d === undefined) return "lost";
  return d > 10 ? "gt10" : d > 0 ? "s1_10" : "none";
}

/** People and blocks per access state per replay step, plus the same for each county (for the insight sentence). */
export function accessSeries(L: Lookup, hours = L.hours) {
  const zero = () => Object.fromEntries(ACCESS_IDS.map((k) => [k, Array(hours).fill(0)])) as Record<AccessId, number[]>;
  const people = zero(), blocks = zero();
  const county = L.counties.map(() => ({ people: zero(), blocks: zero() }));
  for (const b of L.blocks) {
    const pop = b[4], ci = b[1];
    for (let h = 0; h < hours; h++) {
      const s = blockState(b, h);
      people[s][h] += pop; blocks[s][h]++;
      county[ci].people[s][h] += pop; county[ci].blocks[s][h]++;
    }
  }
  return { people, blocks, county };
}

export type AccessSeries = ReturnType<typeof accessSeries>;
const sum = (o: Record<AccessId, number[]>, h: number, ids: AccessId[]) => ids.reduce((a, k) => a + o[k][h], 0);
const total = (o: Record<AccessId, number[]>, h: number) => sum(o, h, [...ACCESS_IDS]);

/** Replay summary at step h: the county with the largest share of blocks cut off or slowed by more than 10 min, and the three-county totals. */
export function replaySummary(S: AccessSeries, counties: string[], h: number) {
  let best = 0, bestShare = -1;
  S.county.forEach((c, i) => {
    const assessed = total(c.blocks, h) - c.blocks.na[h];
    const share = assessed ? sum(c.blocks, h, ["lost", "gt10"]) / assessed : 0;
    if (share > bestShare) { bestShare = share; best = i; }
  });
  const c = S.county[best], assessed = total(c.blocks, h) - c.blocks.na[h];
  const all = total(S.blocks, h);
  return {
    county: counties[best],
    gt10Share: assessed ? c.blocks.gt10[h] / assessed : 0,
    lostShare: assessed ? c.blocks.lost[h] / assessed : 0,
    lostPeople: S.people.lost[h], gt10People: S.people.gt10[h], slowedPeople: S.people.s1_10[h],
    naShare: all ? S.blocks.na[h] / all : 0,
    flagged: sum(S.blocks, h, ["lost", "gt10", "s1_10"]),
  };
}
