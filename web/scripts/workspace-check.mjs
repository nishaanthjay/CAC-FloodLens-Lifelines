// Self-check for lib/workspace/stats.ts against the real sample data. Run: npm run check:workspace
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCESS_IDS, accessSeries, blockState, replaySummary, tierBreakdown, tierOfLevel, topCrossings } from "../lib/workspace/stats.ts";

const load = (f) => JSON.parse(readFileSync(new URL(`../public/data/sample/${f}`, import.meta.url), "utf8"));
const L = load("blocks_lookup.json"), X = load("route_crossings.json");

// Tiers: RL25 and RL50 both read "Very high"; no value is never a tier.
assert.deepEqual([0, 1, 2, 3, 4, 5].map(tierOfLevel), [0, 1, 2, 3, 4, 4]);
assert.equal(tierOfLevel(NaN), -1);

// Block states on hand-made blocks: [geoid, county, lat, lon, pop, drive, red, assessed, replay]
const blk = (assessed, r) => ["g", 0, 0, 0, 10, 5, 1, assessed, r];
const r = { lost: [0, 1, 0, 0], detour_min: [0, null, 10.4, 6.3], crit: [], red: [], p_pct: [] };
assert.equal(blockState(blk(0, r), 0), "na", "no baseline route = not assessed, never not flagged");
assert.equal(blockState(blk(1, null), 0), "none");
assert.deepEqual([0, 1, 2, 3].map((h) => blockState(blk(1, r), h)), ["none", "lost", "gt10", "s1_10"]);

// Real data: every block lands in exactly one state per hour, so the states always sum to the population.
const S = accessSeries(L);
const pop = L.blocks.reduce((a, b) => a + b[4], 0);
for (let h = 0; h < L.hours; h++) {
  assert.equal(ACCESS_IDS.reduce((a, k) => a + S.people[k][h], 0), pop, `people at H+${h}`);
  assert.equal(ACCESS_IDS.reduce((a, k) => a + S.blocks[k][h], 0), L.blocks.length, `blocks at H+${h}`);
}
// Known value from the data: people with no route at H+17 (checked independently of blockState).
let lost17 = 0; for (const b of L.blocks) if (b[7] && b[8]?.lost[17]) lost17 += b[4];
assert.equal(S.people.lost[17], lost17);
assert.ok(S.people.lost[17] > S.people.lost[0], "access loss grows through the replay");
const sum = replaySummary(S, L.counties, 12);
assert.ok(L.counties.includes(sum.county) && sum.gt10Share >= 0 && sum.gt10Share <= 1);

// Crossings: tier counts add up; the top list puts flagged crossings first and never lists a crossing with no value.
for (const h of [0, 9, 17]) {
  const t = tierBreakdown(X, h);
  assert.equal(t.count.reduce((a, b) => a + b, 0) + t.unknown, X.assessed.length);
  const top = topCrossings(X, h, "people");
  assert.equal(top.length, 10);
  const firstUnflagged = top.findIndex((x) => x.tier < 3);
  assert.ok(firstUnflagged < 0 || top.slice(firstUnflagged).every((x) => x.tier < 3), "flagged first");
  assert.ok(top.every((x) => x.tier >= 0));
  const flow = topCrossings(X, h, "flow");
  assert.ok(flow.every((x, i) => i === 0 || (flow[i - 1].ratio ?? -1) >= (x.ratio ?? -1)), "flow list is sorted");
}
const noVal = { ...X, assessed: X.assessed.map((x) => ({ ...x, level: "-".repeat(X.hours) })) };
assert.equal(tierBreakdown(noVal, 0).unknown, X.assessed.length, "no model value is counted as unknown, not as not flagged");
console.log(`workspace-check: all assertions passed (${L.blocks.length} blocks, ${pop.toLocaleString("en-US")} people, ${X.assessed.length} crossings)`);
