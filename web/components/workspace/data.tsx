"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getJSON, hourTime, utc, type Lookup, type Meta } from "@/lib/sample";
import { ageH, hoursText, useLive, type Coastal, type Forecast, type Load, type Nowcast } from "@/lib/live";
import { liveWindow, stepLabel, type LiveWindow, type RouteForecast } from "@/lib/live-route";
import type { RouteCrossings, XAssessed } from "@/lib/route";
import { loadServices, type ServicesDoc } from "@/lib/services";
import { useWS, type Mode } from "@/components/workspace/store";
import { t } from "@/content/copy";

export type Base = { meta: Meta; svc: ServicesDoc; X: RouteCrossings };
export type Prov = { source: string; generated: string; note: string; stale: boolean };

type Ctx = {
  base: Base | null;
  error: string | null;
  fc: Load<Forecast>;
  nc: Load<Nowcast>;
  co: Load<Coastal>;
  blocks: Lookup | null; // Florence replay only: Census blocks with population and per-hour access results
  now: number;
  useOsm: boolean; setUseOsm: (v: boolean) => void; nOsm: number;
  /** Crossings on the current time axis (replay hours, or the live window), with the OpenStreetMap setting applied. Never filtered by the Layer chip: route checks must see every crossing. */
  X: RouteCrossings | null;
  win: LiveWindow | null;
  hours: number;
  start: string;
  timeText: (h: number) => string;
  caption: (h: number) => string;
  prov: Prov | null;
  selectedId: string | null; setSelectedId: (id: string | null) => void;
  byId: Map<string, XAssessed>;
};

const D = createContext<Ctx | null>(null);
export const useData = () => useContext(D)!;

const NO_FORECAST: RouteForecast = { mode: "FORECAST", label: "", stale: true, generated_at: "", cycle_issue_time: "", cycle_age_hours: 0, nwm_version: "", caveats: [], valid_times: [],
  fallback: { used: false, skipped_newer_cycles: [], note: "" }, crossings: [] };

/** Loads the sample data once and builds the time axis for the active mode. Replay: the 18 Florence hours. Nowcast and forecast: the live window (step 0 = the modeled hour covering now). */
export function WorkspaceData({ children }: { children: ReactNode }) {
  const { mode, setHours } = useWS();
  const [base, setBase] = useState<Base | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Lookup | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [useOsm, setUseOsm] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fc = useLive<Forecast>("forecast_latest.json", true);
  const nc = useLive<Nowcast>("nowcast.json", true);
  const co = useLive<Coastal>("coastal.json", mode === "nowcast");

  useEffect(() => {
    Promise.all([getJSON<Meta>("meta.json"), loadServices(), getJSON<RouteCrossings>("route_crossings.json")])
      .then(([meta, svc, X]) => setBase({ meta, svc, X })).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 300000); return () => clearInterval(t); }, []); // keep "Now" current in a tab left open
  useEffect(() => { // 1.6 MB, replay only
    if (mode !== "replay" || blocks) return;
    getJSON<Lookup>("blocks_lookup.json").then(setBlocks).catch(() => {});
  }, [mode, blocks]);

  const win = useMemo(() => (base ? liveWindow(base.X, (fc.data as RouteForecast | null) ?? NO_FORECAST, now) : null), [base, fc.data, now]);
  const raw = base ? (mode === "replay" ? base.X : win!.X) : null;
  const X = useMemo<RouteCrossings | null>(() => !raw || useOsm ? raw : { ...raw, assessed: raw.assessed.filter((a) => a.basis !== "osm"),
    not_assessed: [...raw.not_assessed, ...raw.assessed.filter((a) => a.basis === "osm").map((a) => [a.id, a.lat, a.lon, t("data.osm.excluded")] as [string, number, number, string])] }, [raw, useOsm]);
  const nOsm = useMemo(() => base?.X.assessed.filter((a) => a.basis === "osm").length ?? 0, [base]);
  const byId = useMemo(() => new Map((X?.assessed ?? []).map((a) => [a.id, a])), [X]);
  const hours = !X ? 18 : mode === "nowcast" ? 1 : X.hours;
  useEffect(() => { setHours(hours); }, [hours, setHours]);
  useEffect(() => { setSelectedId(null); }, [mode]);

  const start = base?.meta.event.replay_start_utc ?? "";
  const timeText = (k: number) => (mode === "replay" ? (start ? hourTime(start, k) : "") : win?.times[k] ? `${stepLabel(k)} · ${utc(win.times[k])}` : stepLabel(k));
  const caption = (k: number) => (mode === "replay" ? (start ? hourTime(start, k) : "") : mode === "nowcast" ? t("data.caption.nowcast") : win?.times[k] ? `${stepLabel(k)} · ${utc(win.times[k])}` : stepLabel(k));

  const prov = useMemo<Prov | null>(() => {
    const note = (m: Mode, s: boolean): string => m === "replay" ? t("data.note.replay")
      : m === "nowcast" ? t("data.note.nowcast")
      : `${s ? `${t("data.note.stale")} ` : ""}${t("data.note.forecast")}`;
    if (!base) return null;
    if (mode === "replay") return { source: base.meta.data_sources[0] ?? t("data.source.fallback"), generated: utc(base.meta.generated_at), note: note(mode, false), stale: false };
    if (mode === "nowcast") {
      const d = nc.data, age = d ? ageH(d.generated_at, now) : null, stale = !!d && (d.stale || (age !== null && age > 3));
      return { source: d ? d.sources.join("; ") : nc.error ? t("data.source.gauges.error") : t("data.source.gauges.loading"), generated: d ? t("data.generated.age", { time: utc(d.generated_at), age: hoursText(age) }) : t("data.generated.none"), note: note(mode, stale), stale };
    }
    const f = fc.data, age = f ? ageH(f.cycle_issue_time, now) : null, stale = !f || f.stale || win!.expired || (age !== null && age > 6);
    return { source: f ? f.source : fc.error ? t("data.source.forecast.error") : t("data.source.forecast.loading"), generated: f ? t("data.generated.cycle", { time: utc(f.generated_at), age: hoursText(age) }) : t("data.generated.none"), note: note(mode, stale), stale };
  }, [base, mode, nc, fc, win, now]);

  const v = useMemo<Ctx>(() => ({ base, error, fc, nc, co, blocks, now, useOsm, setUseOsm, nOsm, X, win, hours, start, timeText, caption, prov, selectedId, setSelectedId, byId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, error, fc, nc, co, blocks, now, useOsm, nOsm, X, win, hours, start, mode, prov, selectedId, byId]);
  return <D.Provider value={v}>{children}</D.Provider>;
}
