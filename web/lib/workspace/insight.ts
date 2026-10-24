// The one-paragraph summary at the top of the left panel. Every number comes from the data on screen; the wording never calls anything safe.
import type { replaySummary } from "./stats";

const n = (v: number) => v.toLocaleString("en-US");
const p = (v: number) => (v > 0 && v < 0.01 ? "under 1%" : `${Math.round(v * 100)}%`);

export function replayInsight(s: ReturnType<typeof replaySummary>, hour: number, when: string) {
  const head = `At H+${hour} (${when}) in this Florence replay`;
  if (!s.flagged && !s.lostPeople) return `${head}, no assessed block is cut off or slowed in this scenario. That is not an all-clear: the replay sees river flow only, and ${p(s.naShare)} of blocks are not assessed.`;
  const lead = s.lostShare > 0 && s.gt10Share > 0 ? `${p(s.gt10Share)} of ${s.county} blocks need a detour of more than 10 min to reach an emergency room and ${p(s.lostShare)} have no route`
    : s.lostShare > 0 ? `${p(s.lostShare)} of ${s.county} blocks have no route to an emergency room`
    : s.gt10Share > 0 ? `${p(s.gt10Share)} of ${s.county} blocks need a detour of more than 10 min to reach an emergency room`
    : `no ${s.county} block needs a detour of more than 10 min to reach an emergency room`;
  return `${head}, ${lead}. Across the three counties ${n(s.lostPeople)} people have no route and ${n(s.gt10People)} more are slowed by more than 10 min. Blocks that are not flagged are not flagged in this scenario, which is different from safe.`;
}

export function liveInsight(o: { step: string; above10: number; assessed: number; noValue: number; unassessed: number; people: number; expired: boolean; layerNote: string }) {
  if (o.expired) return `The latest forecast cycle has ended, so every crossing shows as "no data", never as open. ${n(o.unassessed)} further crossings could not be assessed at all.`;
  if (!o.above10) return `For ${o.step}, none of the ${n(o.assessed)} assessed crossings${o.layerNote} is above its 10-year flow in this model run. That is not an all-clear: the run is unvalidated, sees river flow only, and ${n(o.noValue + o.unassessed)} crossings have no value or were not assessed.`;
  return `For ${o.step}, ${n(o.above10)} of ${n(o.assessed)} assessed crossings${o.layerNote} are above their 10-year flow in this model run, which closes them in the scenario. About ${n(o.people)} people live behind them (summed per crossing, so some are counted twice). ${n(o.noValue + o.unassessed)} crossings have no value or were not assessed and are not assumed open.`;
}
