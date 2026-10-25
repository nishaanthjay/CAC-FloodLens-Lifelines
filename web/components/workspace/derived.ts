"use client";
import { useMemo } from "react";
import { utc } from "@/lib/sample";
import { liveInsight, replayInsight } from "@/lib/workspace/insight";
import { crossingName } from "@/lib/workspace/names";
import { accessSeries, layerKeep, replaySummary, tierBreakdown, tierSeries, topCrossings } from "@/lib/workspace/stats";
import { useData } from "@/components/workspace/data";
import { useWS } from "@/components/workspace/store";
import { t } from "@/content/copy";

const ACTION = ["major", "moderate", "minor", "action"];

/** Everything the panels show, computed once per (mode, hour, layer) from the data the map draws. */
export function useDerived() {
  const d = useData();
  const { mode, hour, layer, tab } = useWS();
  const X = d.X;
  const h = X ? Math.min(hour, X.hours - 1) : 0;
  const keep = useMemo(() => layerKeep(layer), [layer]);

  const access = useMemo(() => (mode === "replay" && d.blocks ? accessSeries(d.blocks) : null), [mode, d.blocks]);
  const liveSeries = useMemo(() => (X && mode === "forecast" ? tierSeries(X, keep) : null), [X, mode, keep]);
  const tiers = useMemo(() => (X ? tierBreakdown(X, h, keep) : null), [X, h, keep]);
  const top = useMemo(() => (X ? topCrossings(X, h, tab === "water" ? "flow" : "people", keep) : []), [X, h, tab, keep]);

  const gauges = d.nc.data?.gauges ?? [];
  const gaugesUp = gauges.filter((g) => ACTION.includes(g.nws.flood_category)).length;

  const insight = useMemo(() => {
    if (!X || !tiers) return null;
    const time = d.win?.times[h] ? utc(d.win.times[h]) : "";
    const when = mode === "replay" ? d.timeText(h) : h === 0 ? (time ? t("insight.when.now.at", { time }) : t("insight.when.now")) : (time ? t("insight.when.ahead.at", { h, time }) : t("insight.when.ahead", { h }));
    if (mode === "replay") return access && d.blocks ? replayInsight(replaySummary(access, d.blocks.counties, h), h, when) : null;
    const flagged = tiers.count[3] + tiers.count[4];
    return liveInsight({ step: when, above10: flagged, assessed: tiers.n, noValue: tiers.unknown, unassessed: X.not_assessed.length, people: tiers.people[3] + tiers.people[4],
      expired: !!d.win?.expired, layerNote: layer === "rivers" ? ` ${t("insight.layer.rivers")}` : layer === "coastal" ? ` ${t("insight.layer.coastal")}` : "" });
  }, [X, tiers, access, d, mode, h, layer]);

  const rows = useMemo(() => top.map((r) => ({ id: r.id, name: crossingName(r.x, X?.assessed ?? []), tier: r.tier, people: r.people, ratio: r.ratio })), [top, X]);
  return { h, keep, access, liveSeries, tiers, rows, gauges, gaugesUp, insight };
}

/** Select a crossing, fly the map to it (landing between the open panels) and open the sheet on mobile. */
export function usePick() {
  const d = useData();
  const { api, setSnap } = useWS();
  return (id: string) => {
    const x = d.byId.get(id);
    d.setSelectedId(id);
    if (x) api.current?.flyTo(x.lon, x.lat, 13);
    setSnap("half");
  };
}
