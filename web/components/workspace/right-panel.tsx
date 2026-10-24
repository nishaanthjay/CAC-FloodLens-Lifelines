"use client";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Bars, Legend, StackedArea, type BarRow, type Series } from "@/components/workspace/charts";
import { ErrorCard } from "@/components/workspace/left-panel";
import { Section, Segmented, Skeleton } from "@/components/workspace/ui";
import { useData } from "@/components/workspace/data";
import { useDerived } from "@/components/workspace/derived";
import { useWS } from "@/components/workspace/store";
import { ageH, hoursText, type Gauge } from "@/lib/live";
import { utc } from "@/lib/sample";
import { ACCESS_STATES, TIERS } from "@/lib/workspace/tiers";

const PATTERN = ["sparse", "dots", "diag", "cross"] as const; // tier 1..4: Low, Elevated, High, Very high
const n = (v: number) => v.toLocaleString("en-US");
const tierBar = (i: number, value: number): BarRow => ({ key: String(i), label: TIERS[i].label, fill: TIERS[i].fill, stroke: TIERS[i].stroke, strokeW: TIERS[i].strokeW, value });

const CAT: Record<string, { label: string; w: number }> = {
  major: { label: "Major flood stage", w: 4 }, moderate: { label: "Moderate flood stage", w: 3 }, minor: { label: "Minor flood stage", w: 2.5 }, action: { label: "Action stage", w: 2 },
  no_flooding: { label: "Below action stage", w: 1 }, no_observation: { label: "No current NWS reading", w: 1 }, obs_not_current: { label: "NWS reading not current", w: 1 }, not_defined: { label: "Flood stage not defined", w: 1 },
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
      <Section label="River gauges by NWS category" className="mt-3"><Bars rows={rows} unitLabel="gauges" /></Section>
      <Section label="Gauges" className="mt-3">
        <ul className="divide-y divide-ink/8 font-ui text-xs">
          {list.map((g) => (
            <li key={g.lid} className="py-1.5">
              <p className="font-medium text-ink">{g.name ?? g.lid}</p>
              <p className="text-ink/75">{CAT[g.nws.flood_category]?.label ?? g.nws.flood_category}{g.nws.stage_ft_nws_datum !== null ? ` · stage ${g.nws.stage_ft_nws_datum} ft` : ""}
                <span className="font-mono text-muted"> · {g.nws.stage_time ? hoursText(ageH(g.nws.stage_time, now)) : "no time"}</span></p>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 font-ui text-[11px] leading-snug text-muted">NWS category for NWS stage. Readings are not route status. USGS gage height uses a different datum and is not compared.</p>
      </Section>
    </>
  );
}

function Coastal() {
  const d = useData();
  const c = d.co.data;
  return (
    <Section label="Coastal water levels (separate layer)" className="mt-3">
      {d.co.error ? <ErrorCard title="Coastal file unavailable" text={d.co.error} /> : !c ? <Skeleton className="h-24" /> : (
        <>
          <ul className="divide-y divide-ink/8 font-ui text-xs">
            {c.stations.map((s) => (
              <li key={s.id} className="py-1.5">
                <p className="font-medium text-ink">{s.name} <span className="font-mono text-[10px] text-muted">{s.id}</span></p>
                <p className="text-ink/75">{!s.has_observations ? "Predictions only: no observed level here" : s.latest_residual_m === null ? "No residual available"
                  : `Observed is ${Math.abs(s.latest_residual_m).toFixed(2)} m ${s.latest_residual_m >= 0 ? "above" : "below"} the tide prediction${s.stale ? " (older reading)" : ""}`}
                  {s.latest_observed_time && <span className="font-mono text-muted"> · {utc(s.latest_observed_time)}</span>}</p>
                {s.riverine_influence && <p className="text-[11px] text-muted">Up the Cape Fear River: the residual includes river flow, not only surge.</p>}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 font-ui text-[11px] leading-snug text-muted">Shown on its own. It changes no crossing or route result, and road-level surge and tide flooding are not modeled.</p>
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

  let count = "…";
  if (ready) count = mode === "replay" ? `${n(d.blocks?.blocks.length ?? 0)} blocks` : mode === "forecast" ? `${n(v.tiers!.n)} crossings` : d.nc.data ? `${v.gauges.length} gauges` : "…";

  // (a) the stacked area and its legend
  let series: Series[] = [], legend: { id: string; label: string; fill: string; pattern: Series["pattern"]; value?: string }[] = [], aTitle = "", aNote = "", opts: { id: "people" | "blocks"; label: string }[] = [];
  if (mode === "replay" && v.access) {
    const src = unit === "people" ? v.access.people : v.access.blocks, h = v.h;
    series = ACCESS_STATES.slice(0, 3).map((s) => ({ ...s, values: src[s.id] }));
    legend = ACCESS_STATES.map((s) => ({ ...s, value: n(src[s.id][h]) }));
    aTitle = `${unit === "people" ? "People" : "Blocks"} by access state over time`;
    aNote = "The chart stacks the people (or blocks) cut off or slowed; the other states are listed with their numbers. From the model's road network with default speeds, not observed closures.";
    opts = [{ id: "people", label: "People" }, { id: "blocks", label: "Blocks" }];
  } else if (mode === "forecast" && v.liveSeries) {
    const pick = (t: number) => v.liveSeries!.map((s) => (unit === "people" ? s.people[t] : s.count[t]));
    series = [4, 3, 2, 1].map((t) => ({ id: `t${t}`, label: TIERS[t].label, fill: TIERS[t].fill, pattern: PATTERN[t - 1], values: pick(t) }));
    legend = [4, 3, 2, 1, 0].map((t) => ({ id: `t${t}`, label: t === 0 ? "Not flagged in this scenario" : TIERS[t].label, fill: TIERS[t].fill, pattern: t === 0 ? "plain" : PATTERN[t - 1], value: n(unit === "people" ? v.liveSeries![v.h].people[t] : v.liveSeries![v.h].count[t]) }));
    if (v.liveSeries[v.h].unknown) legend.push({ id: "none", label: "No model value (not assumed open)", fill: "#FFFFFF", pattern: "sparse", value: n(v.liveSeries[v.h].unknown) });
    aTitle = unit === "people" ? "People behind flagged crossings, by tier" : "Crossings by tier over time";
    aNote = unit === "people" ? "People are summed per crossing, so the same person can appear under more than one. Unvalidated model flow, not a closure probability." : "Unvalidated model flow compared with each stream's recurrence flows. Not a closure probability.";
    opts = [{ id: "people", label: "People" }, { id: "blocks", label: "Crossings" }];
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em]">Network insights</h2>
        <span className="rounded-full bg-ink/[0.07] px-2.5 py-1 font-mono text-[11px] font-semibold text-ink" aria-live="polite">{count}</span>
      </div>
      {d.error ? <ErrorCard title="No data to chart" text={d.error} /> : !ready ? <div className="mt-3 space-y-3" role="status" aria-busy="true" aria-label="Loading charts"><Skeleton className="h-40" /><Skeleton className="h-24" /></div> : mode === "nowcast" ? (
        d.nc.error ? <ErrorCard title="Gauge file unavailable" text={d.nc.error} /> : !d.nc.data ? <div className="mt-3 space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : <><Gauges gauges={v.gauges} now={d.now} /><Coastal /></>
      ) : (
        <>
          {series.length > 0 ? (
            <Section label={aTitle} className="mt-3">
              <StackedArea series={series} hour={v.h} onHour={setHour} unitLabel={unit === "people" ? "people" : mode === "replay" ? "blocks" : "crossings"} ariaLabel={`${aTitle}. Left and right arrow keys change the hour.`} emptyText="Nothing flagged in this window. Not an all-clear." />
              <Legend items={legend} />
              <p className="mt-1.5 font-ui text-[11px] leading-snug text-muted">{aNote}</p>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-ink/8 pt-2">
                <span className="ws-label">Distributed by</span>
                <Segmented size="sm" label="Distributed by" value={unit} onChange={setUnit} options={opts} />
              </div>
            </Section>
          ) : <Skeleton className="mt-3 h-40" />}
          <Section label="Crossings by risk tier" className="mt-3" aside={<span className="font-mono text-[11px] text-muted">H+{v.h}</span>}>
            <Bars rows={[4, 3, 2, 1, 0].map((t) => tierBar(t, v.tiers!.count[t]))} unitLabel="crossings" />
            {v.tiers!.unknown > 0 && <p className="mt-2 font-ui text-[11px] leading-snug text-ink/80">{n(v.tiers!.unknown)} crossings have no model value this step. They are not counted above and not assumed open.</p>}
            <p className="mt-1.5 font-ui text-[11px] leading-snug text-muted">{n(d.X!.not_assessed.length)} further crossings could not be assessed (no flow threshold).</p>
          </Section>
        </>
      )}
    </div>
  );
}

export function RightPanel() {
  const { rightOpen, setRightOpen } = useWS();
  return (
    <m.aside initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }} aria-label="Network insights"
      className="ws-glass absolute right-3 top-[60px] z-20 hidden rounded-2xl lg:block">
      {rightOpen ? (
        <>
          <button type="button" onClick={() => setRightOpen(false)} aria-label="Collapse network insights" aria-expanded
            className="absolute -left-3 top-4 z-10 grid h-6 w-6 place-items-center rounded-full border border-ink/10 bg-white text-ink/70 shadow-sm hover:text-ink">
            <ChevronRight size={14} aria-hidden />
          </button>
          <div className="ws-scroll max-h-[calc(100dvh-60px-104px)] w-[360px] overflow-y-auto rounded-2xl p-4"><RightContent /></div>
        </>
      ) : (
        <button type="button" onClick={() => setRightOpen(true)} aria-expanded={false} className="flex min-h-11 items-center gap-2 rounded-2xl px-4 font-display text-base font-bold">
          Network insights <ChevronRight size={15} aria-hidden className="rotate-180 text-muted" />
        </button>
      )}
    </m.aside>
  );
}
