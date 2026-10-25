// The one-paragraph summary at the top of the left panel. Every number comes from the data on screen; the wording (content/site-copy.md) never calls anything safe.
import { t } from "../../content/copy";
import type { replaySummary } from "./stats";

const n = (v: number) => v.toLocaleString("en-US");
const p = (v: number) => (v > 0 && v < 0.01 ? "under 1%" : `${Math.round(v * 100)}%`);

export function replayInsight(s: ReturnType<typeof replaySummary>, hour: number, when: string) {
  const v = { hour, when, county: s.county, gt10Share: p(s.gt10Share), lostShare: p(s.lostShare), naShare: p(s.naShare), lostPeople: n(s.lostPeople), gt10People: n(s.gt10People) };
  if (!s.flagged && !s.lostPeople) return t("insight.replay.clear", v);
  return s.lostShare > 0 && s.gt10Share > 0 ? t("insight.replay.both", v)
    : s.lostShare > 0 ? t("insight.replay.lost", v)
    : s.gt10Share > 0 ? t("insight.replay.slow", v)
    : t("insight.replay.none", v);
}

export function liveInsight(o: { step: string; above10: number; assessed: number; noValue: number; unassessed: number; people: number; expired: boolean; layerNote: string }) {
  const v = { step: o.step, above10: n(o.above10), assessed: n(o.assessed), layer: o.layerNote, people: n(o.people), unmeasured: n(o.noValue + o.unassessed), unassessed: n(o.unassessed) };
  if (o.expired) return t("insight.live.expired", v);
  if (!o.above10) return t("insight.live.none", v);
  return t("insight.live.some", v);
}
