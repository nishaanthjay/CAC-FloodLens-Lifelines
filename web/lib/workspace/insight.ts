// The summary at the top of the left panel: a big stat sentence, one short sentence, and the full wording ("More"). Every number comes from the data on
// screen; the wording (content/site-copy.md) never calls anything safe.
import { t } from "../../content/copy";
import { shareOf } from "./plain";
import type { replaySummary } from "./stats";

const n = (v: number) => v.toLocaleString("en-US");
const p = (v: number) => (v > 0 && v < 0.01 ? "under 1%" : `${Math.round(v * 100)}%`);
export type Insight = { stat: string; short: string; more: string };

export function replayInsight(s: ReturnType<typeof replaySummary>, hour: number, when: string): Insight {
  const v = { hour, when, county: s.county, gt10Share: p(s.gt10Share), lostShare: p(s.lostShare), naShare: p(s.naShare), lostPeople: n(s.lostPeople), gt10People: n(s.gt10People) };
  if (!s.flagged && !s.lostPeople) return { stat: t("insight.stat.replay.clear"), short: t("insight.short.replay.clear"), more: t("insight.replay.clear", v) };
  const short = t("insight.short.replay", v);
  if (s.lostShare > 0 && s.gt10Share > 0) return { stat: t("insight.stat.replay.slow", { share: shareOf(s.gt10Share), county: s.county }), short, more: t("insight.replay.both", v) };
  if (s.lostShare > 0) return { stat: t("insight.stat.replay.lost", { share: shareOf(s.lostShare), county: s.county }), short, more: t("insight.replay.lost", v) };
  if (s.gt10Share > 0) return { stat: t("insight.stat.replay.slow", { share: shareOf(s.gt10Share), county: s.county }), short, more: t("insight.replay.slow", v) };
  return { stat: t("insight.stat.replay.none", { county: s.county }), short, more: t("insight.replay.none", v) };
}

export function liveInsight(o: { step: string; above10: number; assessed: number; noValue: number; unassessed: number; people: number; expired: boolean; layerNote: string }): Insight {
  const v = { step: o.step, above10: n(o.above10), assessed: n(o.assessed), layer: o.layerNote, people: n(o.people), unmeasured: n(o.noValue + o.unassessed), unassessed: n(o.unassessed) };
  if (o.expired) return { stat: t("insight.stat.live.expired"), short: t("insight.short.live.expired"), more: t("insight.live.expired", v) };
  if (!o.above10) return { stat: t("insight.stat.live.none"), short: t("insight.short.live.none"), more: t("insight.live.none", v) };
  return { stat: t("insight.stat.live.some", v), short: t("insight.short.live.some", v), more: t("insight.live.some", v) };
}
