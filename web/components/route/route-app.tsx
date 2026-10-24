"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Link2, LoaderCircle, MapPin, Phone, Printer, Search, Siren } from "lucide-react";
import { ADDRESS_EXAMPLE, geocode } from "@/lib/geocode";
import { mi, mins } from "@/lib/format";
import { blockView, getJSON, hourTime, nearestBlock, utc, type LocationView, type Lookup, type Meta } from "@/lib/sample";
import { ageH, hoursText, useLive, type Forecast, type Nowcast } from "@/lib/live";
import { liveWindow, stepLabel, type RouteForecast } from "@/lib/live-route";
import { crossingsOnRoute, rankRoutes, routeAtHour, type LngLat, type RouteCrossings, type RouteOption } from "@/lib/route";
import { KIND, KINDS, loadServices, nearestByKind, telHref, type Kind, type ServicesDoc } from "@/lib/services";
import { SLOW_MS, matrix, onTiming, openRoute, route, type Trip } from "@/lib/valhalla";
import { HourSlider } from "@/components/ui/hour-slider";
import { KindIcon } from "@/components/ui/kind-icon";
import { RouteMap, type MapService } from "@/components/route/route-map";
import { RouteAnalysis, StatusBadge, type Group } from "@/components/route/route-analysis";

type Service = MapService & { k: Kind; sub: string; straightKm: number; timeS?: number | null; km?: number; phone?: string; addr?: string; src: string };
type Origin = { lat: number; lon: number; label: string };
type Pending = "loading";
type Mode = "live" | "replay";

const PER_KIND = 5; // nearest services of each kind that get drive times (9 kinds x 5 stays under the router's 50-target limit)
const SHOW_ALL = 3; // per kind in the "All" view
const FILTERS: ["all" | Kind, string][] = [["all", "All"], ...KINDS.map((k) => [k.id, k.label] as ["all" | Kind, string])];
const NO_FORECAST: RouteForecast = { mode: "FORECAST", label: "", stale: true, generated_at: "", cycle_issue_time: "", cycle_age_hours: 0, nwm_version: "", caveats: [], valid_times: [],
  fallback: { used: false, skipped_newer_cycles: [], note: "" }, crossings: [] };

export function RouteApp() {
  const params = useSearchParams();
  const [base, setBase] = useState<{ meta: Meta; svc: ServicesDoc; X: RouteCrossings } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(params.get("mode") === "replay" ? "replay" : "live");
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [trips, setTrips] = useState<Record<string, Trip[] | Pending | string>>({});
  const [detours, setDetours] = useState<Record<string, RouteOption | Pending | string>>({});
  const [hour, setHour] = useState(() => (params.get("mode") === "replay" ? Math.max(0, Number(params.get("hour")) || 0) : 0));
  const [copied, setCopied] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [block, setBlock] = useState<LocationView | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [net, setNet] = useState({ slow: false, lastMs: 0, timeouts: 0 });
  const [slowWait, setSlowWait] = useState(false);
  const [showMapBtn, setShowMapBtn] = useState(false);
  const [useOsm, setUseOsm] = useState(true);
  const asked = useRef(new Set<string>()); // route / detour requests already made for this origin
  const token = useRef(0); // ignores answers that arrive after the origin changed
  const fc = useLive<Forecast>("forecast_latest.json", true);
  const nc = useLive<Nowcast>("nowcast.json", true);
  const live = mode === "live";

  useEffect(() => {
    Promise.all([getJSON<Meta>("meta.json"), loadServices(), getJSON<RouteCrossings>("route_crossings.json")])
      .then(([meta, svc, X]) => setBase({ meta, svc, X }))
      .catch((e: Error) => setLoadErr(e.message));
  }, []);
  useEffect(() => {
    const on = () => setShowMapBtn(window.scrollY > window.innerHeight * 0.6);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 300000); return () => clearInterval(t); }, []); // keep "Now" current in a tab left open
  useEffect(() => onTiming((t) => setNet((n) => ({ lastMs: t.ms, slow: t.timedOut || t.ms > SLOW_MS, timeouts: n.timeouts + (t.timedOut ? 1 : 0) }))), []);

  // The live axis: step 0 = modeled hour covering now, then the forecast hours. Without a forecast every crossing is "no data", never open.
  const win = useMemo(() => (base ? liveWindow(base.X, (fc.data as RouteForecast | null) ?? NO_FORECAST, now) : null), [base, fc.data, now]);
  const Xraw = base ? (live ? win!.X : base.X) : null;
  // OpenStreetMap-mapped crossings (1,333 of the assessed set) are road-stream intersections that may not be bridges. Switching them off moves them to "not assessed".
  const X = useMemo<RouteCrossings | null>(() => !Xraw || useOsm ? Xraw : { ...Xraw, assessed: Xraw.assessed.filter((a) => a.basis !== "osm"),
    not_assessed: [...Xraw.not_assessed, ...Xraw.assessed.filter((a) => a.basis === "osm").map((a) => [a.id, a.lat, a.lon, "OpenStreetMap-mapped crossing, left out by your setting"] as [string, number, number, string])] }, [Xraw, useOsm]);
  const nOsm = useMemo(() => base?.X.assessed.filter((a) => a.basis === "osm").length ?? 0, [base]);
  const hours = X?.hours ?? 1;
  const xKey = `${live ? `live|${win?.times[0] ?? ""}` : "replay"}|${useOsm ? "osm" : "struct"}`;
  const start = base?.meta.event.replay_start_utc ?? "";
  const timeText = (h: number) => (live ? (win?.times[h] ? `${stepLabel(h)} · ${utc(win.times[h])}` : stepLabel(h)) : start ? hourTime(start, h) : "");
  const hh = Math.min(hour, hours - 1);

  async function search(q: string) {
    setBusy(true);
    const r = await geocode(q);
    setBusy(false);
    if (typeof r === "string") return setMsg(r);
    setMsg(null);
    setOrigin(r);
  }

  // Starting point from the link: ?lat&lon&label (sample place) or #q (address).
  useEffect(() => {
    // A typed address arrives in the URL #fragment (never sent to our server or its logs) and is cleared once read.
    const lat = params.get("lat"), lon = params.get("lon"), q = new URLSearchParams(window.location.hash.slice(1)).get("q");
    if (lat && lon) setOrigin({ lat: +lat, lon: +lon, label: params.get("label") ?? "Selected place" });
    else if (q && !origin) { setQuery(q); search(q); }
    if (q) history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // New origin: list the nearest services of every kind with drive times, preselect the linked service or the nearest emergency room.
  useEffect(() => {
    if (!origin || !base) return;
    const tk = ++token.current;
    asked.current.clear();
    const here = { lat: origin.lat, lon: origin.lon }, want = params.get("svc");
    const near = nearestByKind(base.svc.items, here, PER_KIND);
    const wanted = want && !near.some((n) => n.s.id === want) ? base.svc.items.find((s) => s.id === want) : undefined;
    if (wanted) near.push({ s: wanted, straightKm: Math.hypot((wanted.lon - here.lon) * 94, (wanted.lat - here.lat) * 110.57) });
    const list: Service[] = near.map(({ s, straightKm }) => ({ id: s.id, k: s.k, kind: s.k, kindLabel: KIND[s.k].one, fill: KIND[s.k].fill, name: s.name,
      sub: s.sub ?? KIND[s.k].one, lat: s.lat, lon: s.lon, straightKm, phone: s.phone, addr: s.addr, src: s.src }));
    setServices(list); setSelected([]); setTrips({}); setDetours({}); setFocusId(null); setBlock(null);
    const pick = (l: Service[]) => {
      const w = want ? l.find((s) => s.id === want) : undefined;
      const h = w ?? l.filter((s) => s.k === "hospital_ed").sort((a, b) => (a.timeS ?? a.straightKm * 1e4) - (b.timeS ?? b.straightKm * 1e4))[0];
      if (h) setSelected([h.id]);
    };
    matrix([origin.lon, origin.lat], list.map((s) => [s.lon, s.lat] as LngLat))
      .then((m) => {
        if (tk !== token.current) return;
        const timed = list.map((s, i) => ({ ...s, timeS: m[i]?.timeS ?? null, km: m[i]?.km }));
        setServices(timed); pick(timed);
      })
      .catch((e: Error) => { if (tk === token.current) { setMsg(`Drive times are unavailable right now (${e.message}), so services are listed by straight-line distance.`); pick(list); } });
  }, [origin, base]); // eslint-disable-line react-hooks/exhaustive-deps

  // Florence cross-check against the model's own road network: replay only, loaded only when the replay is open.
  useEffect(() => {
    if (!origin || live) { setBlock(null); return; }
    let gone = false;
    getJSON<Lookup>("blocks_lookup.json").then((L) => {
      if (gone) return;
      const [b, d] = nearestBlock(L, origin.lat, origin.lon);
      setBlock(d <= 3 ? blockView(L, b, d, origin.label) : null);
    }).catch(() => {});
    return () => { gone = true; };
  }, [origin, live]);

  // Fastest route (plus any alternatives Valhalla finds) to each selected service.
  useEffect(() => {
    if (!origin || !base) return;
    const tk = token.current;
    for (const id of selected) {
      if (asked.current.has(id)) continue;
      asked.current.add(id);
      const s = services.find((x) => x.id === id)!;
      setTrips((r) => ({ ...r, [id]: "loading" }));
      route([origin.lon, origin.lat], [s.lon, s.lat], [], 2)
        .then((t) => { if (tk === token.current) setTrips((r) => ({ ...r, [id]: t.length ? t : "no road route found" })); })
        .catch((e: Error) => { if (tk === token.current) { asked.current.delete(id); setTrips((r) => ({ ...r, [id]: e.message.includes("did not answer") ? e.message : "the routing service is unavailable right now" })); } });
    }
  }, [selected, origin, base, services]);

  // Route options for the current axis. Crossings are matched here, not when a route arrives, so switching between Now/forecast and the replay re-reads the same roads.
  const routes = useMemo(() => {
    const r: Record<string, RouteOption[] | string> = {};
    if (!X) return r;
    for (const id of selected) {
      const t = trips[id], s = services.find((x) => x.id === id);
      if (Array.isArray(t) && s) r[id] = t.map((tr, i) => ({ id: `${id}-${i}`, serviceId: id, label: `${s.name}${i ? ` (alternative ${i})` : ""}`, via: tr.via, kind: i ? "alternate" as const : "fastest" as const,
        timeS: tr.timeS, km: tr.km, shape: tr.shape, on: crossingsOnRoute(tr.shape, X) }));
      else if (typeof t === "string") r[id] = t;
    }
    return r;
  }, [selected, trips, services, X]);

  // When every route to a service is blocked in this step, look for a detour around the closed crossings.
  useEffect(() => {
    if (!origin || !base || !X) return;
    const tk = token.current;
    const t = setTimeout(() => {
      for (const id of selected) {
        const opts = routes[id];
        if (!Array.isArray(opts) || !opts.every((o) => routeAtHour(o.on, hh).blocked.length)) continue;
        const key = `${id}|${xKey}|${hh}`;
        if (asked.current.has(key)) continue;
        asked.current.add(key);
        const s = services.find((x) => x.id === id)!;
        setDetours((d) => ({ ...d, [key]: "loading" }));
        openRoute([origin.lon, origin.lat], [s.lon, s.lat], X, hh)
          .then(({ trip, reason }) => {
            if (tk !== token.current) return;
            setDetours((d) => ({ ...d, [key]: trip ? { id: `${id}-d${hh}`, serviceId: id, label: `${s.name} (detour)`, via: trip.via, kind: "detour",
              timeS: trip.timeS, km: trip.km, shape: trip.shape, on: trip.on } : reason! }));
          })
          .catch((e: Error) => { if (tk === token.current) { asked.current.delete(key); setDetours((d) => ({ ...d, [key]: e.message })); } });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [hh, selected, routes, origin, base, services, X, xKey]);

  const names = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s.name])), [services]);
  const kindOf = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s.k])), [services]);
  const options = useMemo(() => selected.flatMap((id) => {
    const r = routes[id], d = detours[`${id}|${xKey}|${hh}`];
    return [...(Array.isArray(r) ? r : []), ...(d && typeof d === "object" ? [d] : [])];
  }), [selected, routes, detours, hh, xKey]);
  const groups = useMemo<Group[]>(() => KINDS.map((k) => ({ kind: k.id, title: k.label, ranked: rankRoutes(options.filter((o) => kindOf[o.serviceId] === k.id), hh) })).filter((g) => g.ranked.length), [options, hh, kindOf]);
  const ranked = useMemo(() => groups.flatMap((g) => g.ranked), [groups]);
  const fastest = useMemo(() => Object.fromEntries(selected.flatMap((id) => {
    const r = routes[id];
    return Array.isArray(r) && r.length ? [[id, Math.min(...r.map((o) => o.timeS))]] : [];
  })), [selected, routes]);
  const noRoute = selected.flatMap((id) => {
    const r = routes[id], d = detours[`${id}|${xKey}|${hh}`];
    if (typeof r === "string") return [{ name: names[id], reason: r }];
    if (typeof d === "string" && d !== "loading") return [{ name: names[id], reason: `no detour found (${d})` }];
    return [];
  });
  const loading = selected.some((id) => trips[id] === "loading" || detours[`${id}|${xKey}|${hh}`] === "loading");
  useEffect(() => {
    if (!loading) { setSlowWait(false); return; }
    const t = setTimeout(() => setSlowWait(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);
  const focus = ranked.some((r) => r.o.id === focusId) ? focusId : ranked[0]?.o.id ?? null;
  const bestFor = (id: string) => ranked.find((r) => r.o.serviceId === id);
  const byTime = (a: Service, b: Service) => (a.timeS ?? Infinity) - (b.timeS ?? Infinity) || a.straightKm - b.straightKm;
  const shown = (filter === "all"
    ? KINDS.flatMap((k) => services.filter((s) => s.k === k.id).sort(byTime).slice(0, SHOW_ALL))
    : services.filter((s) => s.k === filter).sort(byTime));
  const mapServices = useMemo(() => services.filter((s) => filter === "all" || s.k === filter || selected.includes(s.id)), [services, filter, selected]);
  const toggle = (id: string) => setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));

  function switchMode(m: Mode) {
    setMode(m); setHour(0); setFocusId(null);
    const u = new URL(window.location.href);
    if (m === "replay") u.searchParams.set("mode", "replay"); else u.searchParams.delete("mode");
    history.replaceState(null, "", u.pathname + u.search);
  }
  // Link back to this starting point only (coordinates of the geocoded place, never the typed text).
  async function share() {
    if (!origin) return;
    const q = new URLSearchParams({ lat: origin.lat.toFixed(5), lon: origin.lon.toFixed(5), label: origin.label });
    if (!live) q.set("mode", "replay");
    const u = `${window.location.origin}/route?${q}`;
    try { await navigator.clipboard.writeText(u); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setMsg(`Copy this link: ${u}`); }
  }

  const f = fc.data, age = f ? ageH(f.cycle_issue_time, now) : null;
  const gauges = nc.data?.gauges ?? [];
  const up = gauges.filter((g) => ["major", "moderate", "minor", "action"].includes(g.nws.flood_category)).length;
  const ncAge = nc.data ? ageH(nc.data.generated_at, now) : null;
  const sliderTicks: [number, string][] | undefined = live ? [...new Set([0, Math.round((hours - 1) / 2), hours - 1])].map((h) => [h, h === 0 ? "NOW" : `+${h}H`] as [number, string]) : undefined;

  return (
    <main id="content" className="flex flex-1 flex-col lg:min-h-0 lg:flex-row print:block">
      <div id="route-map" className={`relative order-1 h-[58vh] min-h-[360px] bg-soft-blue print:hidden lg:order-2 lg:block lg:h-auto lg:flex-1 ${origin ? "" : "hidden"}`}>
        <RouteMap origin={origin} services={mapServices} selected={selected} ranked={ranked} focusId={focus} hour={hh} live={live} onService={toggle} onRoute={setFocusId} />
        {origin && hours > 1 && (live
          ? <HourSlider hour={hh} hours={hours} onChange={setHour} title={`Now, then the next ${hours - 1} forecast hours`} text={timeText(hh)} ticks={sliderTicks} />
          : <HourSlider hour={hh} hours={hours} start={start} onChange={setHour} />)}
        {loading && (
          <p className="glass absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-2 font-ui text-xs font-semibold shadow-panel" role="status">
            <LoaderCircle size={14} className="animate-spin" aria-hidden /> Routing…
          </p>
        )}
      </div>

      <aside className="order-2 w-full border-ink/10 bg-paper px-4 pb-16 pt-5 sm:px-6 lg:order-1 lg:w-[440px] lg:shrink-0 lg:overflow-y-auto lg:border-r print:w-full print:overflow-visible">
        <a href="/" className="inline-flex min-h-11 items-center gap-1.5 font-ui text-sm text-muted hover:text-blue">
          <ArrowLeft size={15} aria-hidden /> Home
        </a>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Route analysis</h1>
        <p className="hidden font-ui text-xs font-semibold text-alert print:block">
          {live ? "Now and forecast preview (unvalidated NWM river flow)." : "Florence 2018 replay scenario. Not a forecast."} Not for emergency use. Call 911 in an emergency. lifelines-nc.vercel.app
        </p>
        <p className="mt-2 font-ui text-sm leading-relaxed text-muted">
          Routes from an address to emergency rooms, fire, EMS, police, dialysis, urgent care, nursing homes and pharmacies, checked against {live ? "the latest river-flow forecast" : "the Florence 2018 replay"}.
        </p>

        <form className="mt-6" role="search" onSubmit={(e) => { e.preventDefault(); search(query); }}>
          <label htmlFor="route-addr" className="sr-only">Starting address</label>
          <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white p-1.5 pl-4 shadow-panel focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15">
            <Search size={18} className="shrink-0 text-blue" aria-hidden />
            <input id="route-addr" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter an address in Cape Fear"
              autoComplete="street-address" className="min-h-11 w-full min-w-0 bg-transparent font-ui text-base focus-visible:outline-none" />
            <button type="submit" disabled={busy} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-blue px-5 font-ui text-sm font-semibold text-white hover:bg-[#244d86] disabled:opacity-70">
              {busy && <LoaderCircle size={15} className="animate-spin" aria-hidden />} Go
            </button>
          </div>
        </form>
        <p className="mt-2 font-ui text-xs text-muted">Use a street address with the town name, {ADDRESS_EXAMPLE}. Nothing you type is stored.</p>
        <p aria-live="polite" className="mt-2 min-h-5 font-ui text-sm text-alert">{loadErr ? `Data failed to load (${loadErr}).` : msg}</p>
        {net.slow && (
          <p role="status" className="mt-1 rounded-xl border border-[#E6DFA3] bg-yellow px-3 py-2 font-ui text-xs font-semibold">
            The routing service is slow right now ({net.lastMs >= 1000 ? `${Math.round(net.lastMs / 1000)} s` : `${net.lastMs} ms`} for the last answer{net.timeouts ? `, ${net.timeouts} timed out` : ""}).
            Routes may arrive late or not at all. Call 911 in an emergency.
          </p>
        )}

        <div role="group" aria-label="Data mode" className="mt-4 flex gap-1 rounded-full bg-soft-blue p-1 print:hidden">
          {([["live", "Now & forecast"], ["replay", "Florence 2018 replay"]] as [Mode, string][]).map(([m, label]) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)}
              className={`min-h-11 flex-1 rounded-full px-3 font-ui text-sm font-semibold transition ${mode === m ? "bg-ink text-white shadow-panel" : "text-ink hover:bg-white/70"}`}>{label}</button>
          ))}
        </div>

        {live ? (
          <div className="mt-5 space-y-3 rounded-2xl border border-ink/10 bg-white p-5 font-ui text-xs leading-relaxed" role="region" aria-label="What Now and forecast are based on">
            <p className="font-semibold text-ink"><span className="mr-2 rounded-full bg-blue px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Nowcast</span>Observed river gauges</p>
            <p className="text-ink/80">
              {nc.error ? `Gauge file could not be loaded (${nc.error}).`
                : !nc.data ? "Loading gauge readings…"
                : `${up} of ${gauges.length} gauges near the pilot counties at or above NWS action stage · updated ${hoursText(ncAge)}.`}
              {" "}These are readings, not route status. Route status below uses the model.
            </p>
            <p className="font-semibold text-ink"><span className="mr-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Forecast</span>NWM short-range, unvalidated</p>
            <p className="text-ink/80">
              {fc.error ? `Forecast file could not be loaded (${fc.error}). Every crossing is shown as "no data", never as open.`
                : !f || !win ? "Loading forecast…"
                : win.expired ? `The latest forecast cycle (issued ${utc(f.cycle_issue_time)}) has ended. Every crossing is shown as "no data", never as open.`
                : `Forecast cycle issued ${utc(f.cycle_issue_time)} (${hoursText(age)}). The first step is the modeled hour covering now, then ${hours - 1} forecast hours. ${win!.withData === base!.X.assessed.length ? "All" : `${win!.withData.toLocaleString()} of`} ${base!.X.assessed.length.toLocaleString()} assessed crossings have a model value now.`}
              {f?.fallback.used && ` Newest cycle was incomplete; the previous one is shown.`}
            </p>
            <p className="text-muted">Not a closure probability and not validated. River flow only: no surge, tide or street flooding.</p>
          </div>
        ) : (
          <p role="note" className="mt-3 rounded-2xl border border-[#E6DFA3] bg-yellow px-4 py-3 font-ui text-xs font-semibold">
            Replay of a past storm (Hurricane Florence, NWM v3.0 hindcast), not a forecast and not today&rsquo;s conditions. Switch to Now &amp; forecast for the latest.
          </p>
        )}

        <label className="mt-5 flex items-start gap-3 font-ui text-xs leading-relaxed text-ink/80 print:hidden">
          <input type="checkbox" checked={useOsm} onChange={(e) => setUseOsm(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#2D5DA1]" />
          <span>Count the {nOsm.toLocaleString()} OpenStreetMap-mapped crossings. They are road-stream intersections that may not be bridges, so they are less certain than the {((base?.X.assessed.length ?? 0) - nOsm).toLocaleString()} NCDOT / NBI structures. Untick to use structures only.</span>
        </label>

        {slowWait && loading && <p role="status" className="mt-1 font-ui text-xs text-muted">Still routing. This is taking longer than usual; the public routing service may be busy.</p>}

        {origin && (
          <p className="mt-1 flex items-start gap-2 font-ui text-sm"><MapPin size={16} className="mt-0.5 shrink-0 text-blue" aria-hidden />
            <span className="min-w-0 break-words"><b className="font-semibold">Starting at</b> {origin.label}</span></p>
        )}
        {origin && (
          <div className="mt-2 flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 font-ui text-xs font-semibold hover:border-blue">
              <Link2 size={14} aria-hidden /> {copied ? "Link copied" : "Copy link"}
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 font-ui text-xs font-semibold hover:border-blue">
              <Printer size={14} aria-hidden /> Print or save as PDF
            </button>
            <a href={`/emergency?${new URLSearchParams({ lat: origin.lat.toFixed(5), lon: origin.lon.toFixed(5), label: origin.label })}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-alert/40 bg-softred px-4 font-ui text-xs font-semibold text-alert hover:border-alert">
              <Siren size={14} aria-hidden /> Quick emergency finder
            </a>
          </div>
        )}

        {services.length > 0 && (
          <section aria-labelledby="svc-h" className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="svc-h" className="font-ui text-sm font-semibold">Essential services</h2>
              <span className="font-ui text-xs text-muted">Tap to add or remove a route</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter services">
              {FILTERS.map(([k, label]) => (
                <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k}
                  className={`min-h-9 rounded-full border px-3.5 font-ui text-xs font-semibold transition-colors ${filter === k ? "border-blue bg-blue text-white" : "border-ink/15 bg-white text-ink/75 hover:border-blue"}`}>
                  {label}
                </button>
              ))}
            </div>
            <ul className="mt-3 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white">
              {shown.map((s) => {
                const on = selected.includes(s.id), b = bestFor(s.id), r = trips[s.id], tel = telHref(s.phone);
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => toggle(s.id)} aria-pressed={on}
                      className={`grid min-h-14 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-paper ${on ? "bg-soft-blue/50" : ""}`}>
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${on ? "bg-blue text-white" : s.k === "hospital_ed" ? "bg-softred text-alert" : "bg-ink/5 text-ink"}`}>
                        {on ? <Check size={16} aria-hidden /> : <KindIcon kind={s.k} />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 font-ui text-sm font-medium">{s.name}</span>
                        <span className="block truncate font-ui text-xs text-muted">{s.sub}{s.addr ? ` · ${s.addr}` : ""}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1 text-right">
                        <span className="font-mono text-xs">{s.timeS != null ? mins(s.timeS) : s.timeS === null ? "no route" : mi(s.straightKm, 0)}</span>
                        {on && (b ? <StatusBadge state={b.s.state} live={live} /> : r === "loading" ? <LoaderCircle size={14} className="animate-spin text-muted" aria-label="Routing" /> : null)}
                      </span>
                    </button>
                    {tel && (
                      <a href={tel} className="mb-2 ml-14 inline-flex min-h-9 items-center gap-1.5 font-ui text-xs font-semibold text-blue hover:underline">
                        <Phone size={13} aria-hidden /> Call {s.phone}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 font-ui text-xs leading-relaxed text-muted">
              {filter === "all" ? `The ${SHOW_ALL} nearest of each kind; pick a kind to see ${PER_KIND}.` : `The ${PER_KIND} nearest.`} Times are normal driving. Emergency rooms (CMS) and fire stations come from official lists; the rest
              are federal / HHS lists plus OpenStreetMap, incomplete and sometimes out of date. A listing does not mean the place is open. Call ahead; call 911 in an emergency.
            </p>
          </section>
        )}

        {ranked.length > 0 && X && (
          <div className="mt-8">
            <RouteAnalysis groups={groups} focusId={focus} onFocus={setFocusId} hour={hh} hours={hours} timeText={timeText} live={live}
              names={names} fastest={fastest} block={block} noRoute={noRoute} nAssessed={X.assessed.length} replayStart={start} />
          </div>
        )}
        {!origin && !busy && (
          <p className="mt-8 rounded-2xl bg-yellow p-4 font-ui text-sm leading-relaxed text-ink/80">
            Enter an address to list the nearest emergency rooms, fire stations, dialysis centers and other services. Pick one or several to compare routes, see which stream crossings
            each one uses, and how {live ? "the river-flow forecast" : "the Florence replay"} would affect them {live ? "from now on" : "hour by hour"}.
          </p>
        )}
      </aside>
      {origin && showMapBtn && (
        <button type="button" onClick={() => document.getElementById("route-map")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="fixed bottom-4 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 font-ui text-sm font-semibold text-white shadow-lift print:hidden lg:hidden">
          <MapPin size={16} aria-hidden /> Map
        </button>
      )}
    </main>
  );
}
