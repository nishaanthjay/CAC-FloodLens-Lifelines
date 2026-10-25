"use client";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Bars, Legend, StackedArea, type BarRow, type Series } from "@/components/workspace/charts";
import { ErrorCard } from "@/components/workspace/left-panel";
import { HowToRead, InfoDot } from "@/components/workspace/how-to-read";
import { Section, Segmented, Skeleton } from "@/components/workspace/ui";
import { useData } from "@/components/workspace/data";
import { useDerived } from "@/components/workspace/derived";
import { useWS } from "@/components/workspace/store";
import { ageH, hoursText, type Gauge } from "@/lib/live";
import { utc } from "@/lib/sample";
import { ACCESS_STATES, LEVELS, levelSum, type Level } from "@/lib/workspace/tiers";
import { t } from "@/content/copy";

const PATTERN = ["sparse", "dots", "diag", "cross"] as const; // levels 1..3 (Watch, High, Likely closed) use the first three
const n = (v: number) => v.toLocaleString("en-US");
const levelBar = (l: Level, value: number): BarRow => ({ key: String(l.id), label: l.label, fill: l.fill, stroke: l.stroke, strokeW: l.strokeW, value });

const CAT: Record<string, { label: string; w: number }> = {
  major: { label: t("rp.cat.major"), w: 4 }, moderate: { label: t("rp.cat.moderate"), w: 3 }, minor: { label: t("rp.cat.minor"), w: 2.5 }, action: { label: t("rp.cat.action"), w: 2 },
  no_flooding: { label: t("rp.cat.no_flooding"), w: 1 }, no_observation: { label: t("rp.cat.no_observation"), w: 1 }, obs_not_current: { label: t("rp.cat.obs_not_current"), w: 1 }, not_defined: { label: t("rp.cat.not_defined"), w: 1 },
};
const CAT_COLOR: Record<string, [string, string]> = { major: ["#C0392B", "#7F1D12"], moderate: ["#D4694A", "#9E3F25"], minor: ["#E9B07C", "#B5773F"], action: ["#7FA7D6", "#4D78AA"] };
const ORDER = ["major", "moderate", "minor", "action", "no_flooding", "obs_not_current", "no_observation", "not_defined"];

function Gauges({ gauges, now }: { gauges: Gauge[]; now: number }) {
  const by = new Map<string, Gauge[]>();
  for (const g of gauges) by.set(g.nws.flood_category, [...(by.get(g.nws.flood_category) ?? []), g]);
  const rows: BarRow[] = ORDER.filter((k) => by.has(k)).map((k) => ({ key: k, label: CAT[k]?.label ?? k, fill: CAT_COLOR[k]?.[0] ?? "#CBD5E3", stroke: CAT_COLOR[k]?.[1] ?? "#8A97AB", strokeW: CAT[k]?.w ?? 1, value: by.get(k)!.length }));
  const list = [...gauges].sort((a, b) => ORDER.indexOf(a.nws.flood_category) - ORDER.indexOf(b.nws.flood_category)).slice(0, 6);
  return (
    <>
      <Section label={t("rp.gauges.section")} className="mt-3"><Bars rows={rows} unitLabel={t("rp.gauges.unit")} /></Section>
      <Section label={t("rp.gauges.list")} className="mt-3">
        <ul className="divide-y divide-ink/8 text-xs">
          {list.map((g) => (
            <li key={g.lid} className="py-1.5">
              <p className="font-medium text-ink">{g.name ?? g.lid}</p>
              <p className="text-ink/75">{CAT[g.nws.flood_category]?.label ?? g.nws.flood_category}{g.nws.stage_ft_nws_datum !== null ? ` · ${t("rp.gauge.stage", { ft: g.nws.stage_ft_nws_datum })}` : ""}
                <span className="tabular-nums text-muted"> · {g.nws.stage_time ? hoursText(ageH(g.nws.stage_time, now)) : t("rp.gauge.notime")}</span></p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function Coastal() {
  const d = useData();
  const c = d.co.data;
  return (
    <Section label={t("rp.coastal.section")} className="mt-3">
      {d.co.error ? <ErrorCard title={t("rp.coastal.error")} text={d.co.error} /> : !c ? <Skeleton className="h-24" /> : (
        <>
          <ul className="divide-y divide-ink/8 text-xs">
            {c.stations.map((s) => (
              <li key={s.id} className="py-1.5">
                <p className="font-medium text-ink">{s.name} <span className="tabular-nums text-[13px] text-muted">{s.id}</span></p>
                <p className="text-ink/75">{!s.has_observations ? t("rp.coastal.predonly") : s.latest_residual_m === null ? t("rp.coastal.noresidual")
                  : `${s.latest_residual_m >= 0 ? t("rp.coastal.above", { m: Math.abs(s.latest_residual_m).toFixed(2) }) : t("rp.coastal.below", { m: Math.abs(s.latest_residual_m).toFixed(2) })}${s.stale ? ` ${t("rp.coastal.older")}` : ""}`}
                  {s.latest_observed_time && <span className="tabular-nums text-muted"> · {utc(s.latest_observed_time)}</span>}</p>
                {s.riverine_influence && <p className="text-[13px] text-muted">{t("rp.coastal.river")}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

/** Body of the right panel; also rendered inside the mobile bottom sheet. */
export function RightContent() {
  const { mode, setHour, unit, setUnit } = useWS();
  const d = useData();
  const v = useDerived();
  const ready = !!d.base && !!d.X && !!v.tiers;

  let count = t("common.pending");
  if (ready) count = mode === "replay" ? t("rp.count.blocks", { n: n(d.blocks?.blocks.length ?? 0) }) : mode === "forecast" ? t("rp.count.crossings", { n: n(v.tiers!.n) }) : d.nc.data ? t("rp.count.gauges", { n: v.gauges.length }) : t("common.pending");

  // (a) the stacked area and its legend
  let series: Series[] = [], legend: { id: string; label: string; fill: string; pattern: Series["pattern"]; value?: string }[] = [], aTitle = "", aNote = "", opts: { id: "people" | "blocks"; label: string }[] = [];
  if (mode === "replay" && v.access) {
    const src = unit === "people" ? v.access.people : v.access.blocks, h = v.h;
    series = ACCESS_STATES.slice(0, 3).map((s) => ({ ...s, values: src[s.id] }));
    legend = ACCESS_STATES.map((s) => ({ ...s, value: n(src[s.id][h]) }));
    aTitle = unit === "people" ? t("rp.area.title.replay.people") : t("rp.area.title.replay.blocks");
    aNote = t("rp.area.note.replay");
    opts = [{ id: "people", label: t("rp.opt.people") }, { id: "blocks", label: t("rp.opt.blocks") }];
  } else if (mode === "forecast" && v.liveSeries) {
    const pick = (l: Level) => v.liveSeries!.map((s) => levelSum(unit === "people" ? s.people : s.count)[l.id]);
    const at = (l: Level) => levelSum(unit === "people" ? v.liveSeries![v.h].people : v.liveSeries![v.h].count)[l.id];
    series = [3, 2, 1].map((k) => ({ id: `l${k}`, label: LEVELS[k].label, fill: LEVELS[k].fill, pattern: PATTERN[k - 1], values: pick(LEVELS[k]) }));
    legend = [3, 2, 1, 0].map((k) => ({ id: `l${k}`, label: k === 0 ? t("rp.legend.notflagged") : LEVELS[k].label, fill: LEVELS[k].fill, pattern: k === 0 ? "plain" : PATTERN[k - 1], value: n(at(LEVELS[k])) }));
    if (v.liveSeries[v.h].unknown) legend.push({ id: "none", label: t("rp.legend.novalue"), fill: "#FFFFFF", pattern: "sparse", value: n(v.liveSeries[v.h].unknown) });
    aTitle = unit === "people" ? t("rp.area.title.live.people") : t("rp.area.title.live.crossings");
    aNote = unit === "people" ? t("rp.area.note.live.people") : t("rp.area.note.live.crossings");
    opts = [{ id: "people", label: t("rp.opt.people") }, { id: "blocks", label: t("rp.opt.crossings") }];
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h2 className="whitespace-nowrap font-display text-[22px] font-bold leading-tight tracking-[-0.02em]">{t("rp.title")}</h2>
        <span className="rounded-full bg-ink/[0.07] px-2.5 py-1 tabular-nums text-[13px] font-semibold text-ink" aria-live="polite">{count}</span>
      </div>
      {d.error ? <ErrorCard title={t("rp.error.nodata")} text={d.error} /> : !ready ? <div className="mt-3 space-y-3" role="status" aria-busy="true" aria-label={t("rp.loading")}><Skeleton className="h-40" /><Skeleton className="h-24" /></div> : mode === "nowcast" ? (
        d.nc.error ? <ErrorCard title={t("rp.error.gauges")} text={d.nc.error} /> : !d.nc.data ? <div className="mt-3 space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : <><Gauges gauges={v.gauges} now={d.now} /><Coastal /></>
      ) : (
        <>
          {series.length > 0 ? (
            <Section label={aTitle} className="mt-3" aside={<InfoDot panel="right" />}>
              <StackedArea series={series} hour={v.h} onHour={setHour} unitLabel={unit === "people" ? t("rp.unit.people") : mode === "replay" ? t("rp.unit.blocks") : t("rp.unit.crossings")} ariaLabel={t("rp.area.aria", { title: aTitle })} emptyText={t("rp.area.empty")} />
              <Legend items={legend} />
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-ink/8 pt-2">
                <span className="ws-label">{t("rp.distributed")}</span>
                <Segmented size="sm" label={t("rp.distributed")} value={unit} onChange={setUnit} options={opts} />
              </div>
            </Section>
          ) : <Skeleton className="mt-3 h-40" />}
          <Section label={t("rp.tiers.title")} className="mt-3" aside={<span className="flex items-center gap-1"><span className="tabular-nums text-[13px] text-muted">{t("common.hour", { hour: v.h })}</span><InfoDot panel="right" /></span>}>
            <Bars rows={[3, 2, 1, 0].map((k) => levelBar(LEVELS[k], levelSum(v.tiers!.count)[k]))} unitLabel={t("rp.unit.crossings")} />
          </Section>
        </>
      )}
      {!d.error && ready && (
        <HowToRead panel="right">
          {mode !== "nowcast" && aNote && <p>{aNote}</p>}
          {mode !== "nowcast" && v.tiers && v.tiers.unknown > 0 && <p>{t("rp.tiers.unknown", { n: n(v.tiers.unknown) })}</p>}
          {mode !== "nowcast" && <p>{t("rp.tiers.unassessed", { n: n(d.X!.not_assessed.length) })}</p>}
          {mode === "nowcast" && <p>{t("rp.gauges.note")}</p>}
          {mode === "nowcast" && <p>{t("rp.coastal.note")}</p>}
        </HowToRead>
      )}
    </div>
  );
}

export function RightPanel() {
  const { rightOpen, setRightOpen } = useWS();
  return (
    <m.aside initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }} aria-label={t("rp.title")}
      className="ws-glass absolute right-3 top-[60px] z-20 hidden rounded-2xl lg:block">
      {rightOpen ? (
        <>
          <button type="button" onClick={() => setRightOpen(false)} aria-label={t("rp.collapse")} aria-expanded
            className="absolute -left-3 top-4 z-10 grid h-6 w-6 place-items-center rounded-full border border-ink/10 bg-white text-ink/70 shadow-sm hover:text-ink">
            <ChevronRight size={14} aria-hidden />
          </button>
          <div className="ws-scroll max-h-[calc(100dvh-60px-104px)] w-[360px] overflow-y-auto rounded-2xl p-4"><RightContent /></div>
        </>
      ) : (
        <button type="button" onClick={() => setRightOpen(true)} aria-expanded={false} className="flex min-h-11 items-center gap-2 rounded-2xl px-4 font-display text-base font-bold">
          {t("rp.title")} <ChevronRight size={15} aria-hidden className="rotate-180 text-muted" />
        </button>
      )}
    </m.aside>
  );
}
