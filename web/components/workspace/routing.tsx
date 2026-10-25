"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { geocode } from "@/lib/geocode";
import { blockView, nearestBlock, type LocationView } from "@/lib/sample";
import { crossingRoad } from "@/lib/format";
import { backupCandidates, crossingsOnRoute, dedupeOptions, rankRoutes, routeAtHour, type HourStatus, type LngLat, type OnRoute, type RouteOption } from "@/lib/route";
import { KIND, KINDS, nearestByKind, type Kind } from "@/lib/services";
import { avoidingRoute, matrix, onTiming, openRoute, route, SLOW_MS, type Trip } from "@/lib/valhalla";
import type { Group } from "@/components/route/route-analysis";
import { useData } from "@/components/workspace/data";
import { useWS } from "@/components/workspace/store";
import { t } from "@/content/copy";

export type Service = { id: string; k: Kind; kind: string; kindLabel: string; fill: string; name: string; sub: string; lat: number; lon: number; straightKm: number; timeS?: number | null; km?: number; phone?: string; addr?: string; src: string };
export type Origin = { lat: number; lon: number; label: string };
type Pending = "loading";
type Ranked = { o: RouteOption; s: HourStatus }[];

export const PER_KIND = 5; // nearest services of each kind that get drive times (9 kinds x 5 stays under the router's 50-target limit)
export const SHOW_ALL = 3; // per kind in the "All" view
const BACKUP_GAP_MS = 400; // spacing between backup-route requests (public server, fair use)
const MAX_OPTIONS = 4; // routes kept per service
export const FILTERS: ["all" | Kind, string][] = [["all", t("common.all")], ...KINDS.map((k) => [k.id, k.label] as ["all" | Kind, string])];

type Ctx = {
  query: string; setQuery: (q: string) => void; search: (q: string) => void; busy: boolean; msg: string | null;
  origin: Origin | null;
  net: { slow: boolean; lastMs: number; timeouts: number }; slowWait: boolean; loading: boolean;
  services: Service[]; shown: Service[]; filter: "all" | Kind; setFilter: (f: "all" | Kind) => void;
  selected: string[]; toggle: (id: string) => void;
  trips: Record<string, Trip[] | Pending | string>;
  groups: Group[]; ranked: Ranked; focus: string | null; setFocusId: (id: string | null) => void;
  names: Record<string, string>; fastest: Record<string, number>; noRoute: { name: string; reason: string }[];
  noBackup: Record<string, boolean>; // services where backup routes were tried and every way there uses the same crossings
  baseline: Record<string, RouteOption>; // the normal-conditions fastest route per selected service
  bestFor: (id: string) => Ranked[number] | undefined;
  block: LocationView | null;
  copied: boolean; share: () => void;
  hh: number;
};
const R = createContext<Ctx | null>(null);
export const useRouting = () => useContext(R)!;

/** Address, services, routes and detours for the Access tab. Lives above the tabs, so a route survives a visit to Water or Consequence. */
export function RoutingProvider({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const d = useData();
  const { mode, hour, setTab } = useWS();
  const live = mode !== "replay";
  const { base, X } = d;
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [trips, setTrips] = useState<Record<string, Trip[] | Pending | string>>({});
  const [detours, setDetours] = useState<Record<string, RouteOption | Pending | string>>({});
  const [backups, setBackups] = useState<Record<string, { tried: number; found: { trip: Trip; c: OnRoute }[] }>>({}); // per service, once its backup requests have all finished
  const nextSlot = useRef(0);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [net, setNet] = useState({ slow: false, lastMs: 0, timeouts: 0 });
  const [slowWait, setSlowWait] = useState(false);
  const asked = useRef(new Set<string>()); // route / detour requests already made for this origin
  const token = useRef(0); // ignores answers that arrive after the origin changed
  const hh = Math.min(hour, (X?.hours ?? 1) - 1);
  const xKey = `${live ? `live|${d.win?.times[0] ?? ""}` : "replay"}|${d.useOsm ? "osm" : "struct"}`;

  useEffect(() => onTiming((t) => setNet((n) => ({ lastMs: t.ms, slow: t.timedOut || t.ms > SLOW_MS, timeouts: n.timeouts + (t.timedOut ? 1 : 0) }))), []);

  async function search(q: string) {
    setBusy(true);
    const r = await geocode(q);
    setBusy(false);
    if (typeof r === "string") return setMsg(r);
    setMsg(null);
    setOrigin(r);
  }

  // Starting point from the link: ?lat&lon&label (sample place) or #q (address, kept in the URL fragment so it never reaches our server).
  useEffect(() => {
    const lat = params.get("lat"), lon = params.get("lon"), q = new URLSearchParams(window.location.hash.slice(1)).get("q");
    if (lat && lon) setOrigin({ lat: +lat, lon: +lon, label: params.get("label") ?? t("access.place.default") });
    else if (q && !origin) { setQuery(q); setTab("access"); search(q); }
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
    setServices(list); setSelected([]); setTrips({}); setDetours({}); setBackups({}); setFocusId(null);
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
      .catch((e: Error) => { if (tk === token.current) { setMsg(t("routing.error.drivetimes", { error: e.message })); pick(list); } });
  }, [origin, base]); // eslint-disable-line react-hooks/exhaustive-deps

  // Florence cross-check against the model's own road network: replay only, from the block lookup the replay already loaded.
  const block = useMemo(() => {
    if (!origin || live || !d.blocks) return null;
    const [b, km] = nearestBlock(d.blocks, origin.lat, origin.lon);
    return km <= 3 ? blockView(d.blocks, b, km, origin.label) : null;
  }, [origin, live, d.blocks]);

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
        .then((list) => { if (tk === token.current) setTrips((r) => ({ ...r, [id]: list.length ? list : t("routing.noroad") })); })
        .catch((e: Error) => { if (tk === token.current) { asked.current.delete(id); setTrips((r) => ({ ...r, [id]: e.message.includes("did not answer") ? e.message : t("routing.unavailable") })); } });
    }
  }, [selected, origin, base, services]);

  // Backup routes: once the fastest route to a service is known, ask for a route that avoids each of its two most consequential crossings.
  // Independent of the hour (crossing status is read later), spaced out so the public server is not hammered.
  useEffect(() => {
    if (!origin || !base) return;
    const tk = token.current;
    const pause = () => {
      const at = Math.max(Date.now(), nextSlot.current);
      nextSlot.current = at + BACKUP_GAP_MS;
      return new Promise<void>((done) => setTimeout(done, at - Date.now()));
    };
    for (const id of selected) {
      const trip = trips[id], key = `backup|${id}`;
      if (!Array.isArray(trip) || !trip.length || asked.current.has(key)) continue;
      asked.current.add(key);
      const s = services.find((x) => x.id === id)!, from: LngLat = [origin.lon, origin.lat], to: LngLat = [s.lon, s.lat];
      const cands = backupCandidates(crossingsOnRoute(trip[0].shape, base.X), 2);
      (async () => {
        const found: { trip: Trip; c: OnRoute }[] = [];
        for (const c of cands) {
          try {
            const t = await avoidingRoute(from, to, [c.lon, c.lat], (r) => crossingsOnRoute(r.shape, base.X).some((o) => o.id === c.id), pause);
            if (t) found.push({ trip: t, c });
          } catch { /* a backup that failed to load just is not shown */ }
          if (tk !== token.current) return;
        }
        setBackups((b) => ({ ...b, [id]: { tried: cands.length, found } }));
      })();
    }
  }, [trips, selected, origin, base, services]);

  // Route options for the current axis. Crossings are matched here, not when a route arrives, so switching modes re-reads the same roads. Always every crossing: the Layer chip never changes a route check.
  const routes = useMemo(() => {
    const r: Record<string, RouteOption[] | string> = {};
    if (!X) return r;
    for (const id of selected) {
      const trip = trips[id], s = services.find((x) => x.id === id);
      if (Array.isArray(trip) && s) r[id] = trip.map((tr, i) => ({ id: `${id}-${i}`, serviceId: id, label: i ? t("routing.label.alternative", { name: s.name, n: i }) : s.name, via: tr.via, kind: i ? "alternate" as const : "fastest" as const,
        timeS: tr.timeS, km: tr.km, shape: tr.shape, on: crossingsOnRoute(tr.shape, X) }));
      else if (typeof trip === "string") r[id] = trip;
    }
    return r;
  }, [selected, trips, services, X]);

  // When every route to a service is blocked in this step, look for a detour around the closed crossings.
  useEffect(() => {
    if (!origin || !base || !X) return;
    const tk = token.current;
    const timer = setTimeout(() => {
      for (const id of selected) {
        const opts = routes[id];
        if (!Array.isArray(opts) || !opts.every((o) => routeAtHour(o.on, hh).blocked.length)) continue;
        const key = `${id}|${xKey}|${hh}`;
        if (asked.current.has(key)) continue;
        asked.current.add(key);
        const s = services.find((x) => x.id === id)!;
        setDetours((dd) => ({ ...dd, [key]: "loading" }));
        openRoute([origin.lon, origin.lat], [s.lon, s.lat], X, hh)
          .then(({ trip, reason }) => {
            if (tk !== token.current) return;
            setDetours((dd) => ({ ...dd, [key]: trip ? { id: `${id}-d${hh}`, serviceId: id, label: t("routing.label.detour", { name: s.name }), via: trip.via, kind: "detour",
              timeS: trip.timeS, km: trip.km, shape: trip.shape, on: trip.on } : reason! }));
          })
          .catch((e: Error) => { if (tk === token.current) { asked.current.delete(key); setDetours((dd) => ({ ...dd, [key]: e.message })); } });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [hh, selected, routes, origin, base, services, X, xKey]);

  const names = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s.name])), [services]);
  const kindOf = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s.k])), [services]);
  const backupOpts = useMemo(() => {
    const out: Record<string, RouteOption[]> = {};
    if (!X) return out;
    for (const id of selected) out[id] = (backups[id]?.found ?? []).map(({ trip, c }) => ({ id: `${id}-b-${c.id}`, serviceId: id, label: t("routing.label.backup", { name: crossingRoad(c.x!.name) }), via: trip.via, kind: "backup" as const,
      avoids: c.id, timeS: trip.timeS, km: trip.km, shape: trip.shape, on: crossingsOnRoute(trip.shape, X) }));
    return out;
  }, [selected, backups, X]);
  // Per service: the fastest route first, then a detour (only when the hour needs one), the backups, and Valhalla's own alternatives. Near-copies are dropped.
  const options = useMemo(() => selected.flatMap((id) => {
    const r = routes[id], dd = detours[`${id}|${xKey}|${hh}`];
    const list = Array.isArray(r) ? r : [];
    return dedupeOptions([...list.slice(0, 1), ...(dd && typeof dd === "object" ? [dd] : []), ...(backupOpts[id] ?? []), ...list.slice(1)], MAX_OPTIONS);
  }), [selected, routes, detours, backupOpts, hh, xKey]);
  const noBackup = useMemo(() => Object.fromEntries(selected.filter((id) => backups[id]?.tried).map((id) => [id, options.filter((o) => o.serviceId === id).length === 1])), [selected, backups, options]);
  const groups = useMemo<Group[]>(() => KINDS.map((k) => ({ kind: k.id, title: k.label, ranked: rankRoutes(options.filter((o) => kindOf[o.serviceId] === k.id), hh) })).filter((g) => g.ranked.length), [options, hh, kindOf]);
  const ranked = useMemo(() => groups.flatMap((g) => g.ranked), [groups]);
  const fastest = useMemo(() => Object.fromEntries(selected.flatMap((id) => {
    const r = routes[id];
    return Array.isArray(r) && r.length ? [[id, Math.min(...r.map((o) => o.timeS))]] : [];
  })), [selected, routes]);
  const baseline = useMemo(() => Object.fromEntries(selected.flatMap((id) => {
    const r = routes[id];
    return Array.isArray(r) && r[0] ? [[id, r[0]]] : [];
  })), [selected, routes]);
  const noRoute = selected.flatMap((id) => {
    const r = routes[id], dd = detours[`${id}|${xKey}|${hh}`];
    if (typeof r === "string") return [{ name: names[id], reason: r }];
    if (typeof dd === "string" && dd !== "loading") return [{ name: names[id], reason: t("routing.nodetour", { reason: dd }) }];
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
  const shown = filter === "all"
    ? KINDS.flatMap((k) => services.filter((s) => s.k === k.id).sort(byTime).slice(0, SHOW_ALL))
    : services.filter((s) => s.k === filter).sort(byTime);
  const toggle = (id: string) => setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));

  // Link back to this starting point only (coordinates of the geocoded place, never the typed text).
  async function share() {
    if (!origin) return;
    const q = new URLSearchParams({ tab: "access", mode, lat: origin.lat.toFixed(5), lon: origin.lon.toFixed(5), label: origin.label });
    if (!live) q.set("hour", String(hh));
    const u = `${window.location.origin}/?${q}`;
    try { await navigator.clipboard.writeText(u); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setMsg(t("routing.error.copy", { url: u })); }
  }

  const v: Ctx = { query, setQuery, search, busy, msg, origin, net, slowWait, loading, services, shown, filter, setFilter, selected, toggle, trips, groups, ranked, focus, setFocusId,
    names, fastest, noRoute, noBackup, baseline, bestFor, block, copied, share, hh };
  return <R.Provider value={v}>{children}</R.Provider>;
}
