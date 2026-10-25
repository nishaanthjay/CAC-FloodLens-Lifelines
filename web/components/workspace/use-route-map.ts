"use client";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { esc, type ML } from "@/lib/maplibre";
import { crossingRoad, tidyName } from "@/lib/format";
import { CLOSED, type LngLat, type OnRoute } from "@/lib/route";
import { mapPadding, reducedMotion } from "@/lib/workspace/camera";
import { detourRuns, length, midpoint } from "@/lib/workspace/geo";
import { flowDash, setDestinations, setListed } from "@/lib/workspace/route-layers";
import { tierOfLevel } from "@/lib/workspace/stats";
import { TIERS } from "@/lib/workspace/tiers";
import { createTooltip } from "@/lib/workspace/tooltip";
import { useRouting } from "@/components/workspace/routing";
import { useWS } from "@/components/workspace/store";
import { t } from "@/content/copy";

type Feat = { type: "Feature"; properties: Record<string, unknown>; geometry: { type: "LineString" | "Point"; coordinates: unknown } };
const fc = (features: Feat[]) => ({ type: "FeatureCollection", features });
const STATE_TEXT = [t("routemap.state.none"), t("routemap.state.risk"), t("routemap.state.flagged")];
const ROUTE_LINES = ["route-alt-casing", "route-alt", "route-base-casing", "route-base", "route-scen-casing", "route-scen", "route-detour-casing", "route-detour", "route-flow"];

/** Everything the Access tab draws, derived from the routing state and the selected hour. */
function useModel() {
  const r = useRouting();
  const hh = r.hh;
  return useMemo(() => {
    const routes: Feat[] = [], detours: Feat[] = [], rx = new Map<string, Feat>();
    const closed = new Map<string, { lon: number; lat: number; id: string; name: string; km: number }>();
    const chips: { at: LngLat; text: string; focusId?: string }[] = [];
    const avoids = new Map<string, Feat>();
    const shapes: LngLat[][] = [];
    const crossingPoint = (c: OnRoute) => {
      const lv = c.x ? parseInt(c.x.level[hh] ?? "-", 10) : NaN;
      const cls = !c.x ? -2 : tierOfLevel(lv);
      rx.set(c.id, { type: "Feature", properties: { id: c.id, cls, name: c.x ? tidyName(c.x.name) : t("routemap.crossing.unassessed"),
        status: !c.x ? t("routemap.status.unassessed") : cls < 0 ? t("routemap.status.novalue") : cls >= 3 ? t("routemap.status.closed") : `${TIERS[cls].label}: ${TIERS[cls].note}` },
        geometry: { type: "Point", coordinates: [c.lon, c.lat] } });
    };
    for (const id of r.selected) {
      const opts = r.ranked.filter((x) => x.o.serviceId === id);
      if (!opts.length) continue;
      const scen = opts.find((x) => x.o.id === r.focus) ?? opts[0], base = r.baseline[id];
      for (const { o, s } of opts) {
        const role = o.id === scen.o.id ? "scen" : base && o.id === base.id ? "base" : "alt";
        routes.push({ type: "Feature", properties: { id: o.id, role, state: s.state, kind: o.kind, label: o.label, status: STATE_TEXT[s.state] }, geometry: { type: "LineString", coordinates: o.shape } });
        shapes.push(o.shape);
        if (role !== "alt") for (const c of o.on) crossingPoint(c);
        const av = o.avoids ? (base ?? scen.o).on.find((c) => c.id === o.avoids) : undefined; // the crossing a backup route stays clear of
        if (av) avoids.set(av.id, { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [av.lon, av.lat] } });
        if (role === "alt") chips.push({ at: midpoint(o.shape), focusId: o.id, text: o.kind === "backup"
          ? t("routemap.chip.backup", { name: av?.x ? crossingRoad(av.x.name) : o.avoids ?? "" })
          : t("routemap.chip.alt", { m: Math.max(0, Math.round((o.timeS - (r.fastest[id] ?? o.timeS)) / 60)), via: tidyName(o.via) }) });
      }
      const ref = base ?? scen.o; // closed crossings on the normal (baseline) path
      for (const c of ref.on) {
        const lv = c.x ? parseInt(c.x.level[hh] ?? "-", 10) : NaN;
        if (c.x && lv >= CLOSED) closed.set(c.id, { lon: c.lon, lat: c.lat, id: c.id, name: tidyName(c.x.name), km: c.km });
      }
      if (base && scen.o.id !== base.id) {
        const runs = detourRuns(base.shape, scen.o.shape);
        for (const run of runs) detours.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: run } });
        const longest = runs.sort((a, b) => length(b) - length(a))[0];
        if (longest) { const m = Math.round((scen.o.timeS - base.timeS) / 60); chips.push({ at: midpoint(longest), text: m >= 1 ? t("routemap.chip.detour", { m }) : t("routemap.chip.rerouted") }); }
      }
    }
    return { routes, detours, avoids: [...avoids.values()], rx: [...rx.values()], closed: [...closed.values()].sort((a, b) => a.km - b.km), chips, shapes };
  }, [r.selected, r.ranked, r.focus, r.baseline, r.fastest, hh]);
}

const initial = (label: string) => (label.match(/[A-Za-z0-9]/)?.[0] ?? "•").toUpperCase();

/** Wires the Access-tab overlay into the map: route lines, detour highlight, crossings, markers, the flow animation and the panel-aware camera. */
export function useRouteMap(map: MutableRefObject<ML>, ready: boolean) {
  const r = useRouting();
  const { tab, rightOpen, sheetPx } = useWS();
  const active = tab === "access";
  const model = useModel();
  const markers = useRef<{ origin: ML | null; extra: ML[] }>({ origin: null, extra: [] });
  const live = useRef({ setFocus: r.setFocusId });
  live.current = { setFocus: r.setFocusId };

  // One-time handlers: hover tooltips and click-to-focus on routes.
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    const tip = createTooltip(m.getContainer());
    const leave = () => { m.getCanvas().style.cursor = ""; tip.hide(); };
    m.on("mousemove", "route-x", (e: ML) => { const p = e.features?.[0]?.properties; if (!p) return; m.getCanvas().style.cursor = "default"; tip.show(p.name, [[t("tip.route.status"), p.status, false]], e.point.x, e.point.y); });
    m.on("mouseleave", "route-x", leave);
    let hov: string | null = null; // the alternative under the pointer (it grows 1.3x)
    const unhover = () => { if (hov !== null) m.setFeatureState({ source: "routes", id: hov }, { hover: false }); hov = null; };
    for (const id of ["route-scen", "route-base", "route-alt-casing"]) {
      m.on("mousemove", id, (e: ML) => {
        const p = e.features?.[0]?.properties; if (!p) return; m.getCanvas().style.cursor = "pointer";
        if (id === "route-alt-casing" && hov !== p.id) { unhover(); hov = p.id; m.setFeatureState({ source: "routes", id: p.id }, { hover: true }); }
        const kind = id === "route-base" ? t("tip.route.base") : id === "route-alt-casing" ? (p.kind === "backup" ? t("tip.route.backup") : p.kind === "detour" ? t("tip.route.detour") : t("tip.route.alt")) : t("tip.route.scen");
        tip.show(p.label, [[t("tip.route.name"), kind, false], [t("tip.route.status"), p.status, false]], e.point.x, e.point.y);
      });
      m.on("mouseleave", id, () => { unhover(); leave(); });
      m.on("click", id, (e: ML) => { const p = e.features?.[0]?.properties; if (p) live.current.setFocus(p.id); });
    }
    return () => tip.destroy();
  }, [ready, map]);

  // Layers: fade in and out with the tab (opacity is a paint constant, so MapLibre tweens it), data only while the tab is open.
  useEffect(() => {
    if (!ready) return;
    const m = map.current, o = active ? 1 : 0;
    for (const id of ROUTE_LINES) m.setPaintProperty(id, "line-opacity", id.endsWith("casing") ? o * 0.95 : id === "route-flow" ? o * 0.8 : id === "route-alt" ? o * 0.75 : o);
    m.setPaintProperty("route-avoid", "circle-stroke-opacity", o);
    m.setPaintProperty("route-x", "circle-opacity", o); m.setPaintProperty("route-x", "circle-stroke-opacity", o);
    m.setPaintProperty("svc-sel-ring", "circle-opacity", o); m.setPaintProperty("svc-sel-ring", "circle-stroke-opacity", o);
    for (const id of ["svc-sel-disc", "svc-sel-glyph"]) m.setPaintProperty(id, "icon-opacity", o);
    m.setPaintProperty("svc-sel-label", "text-opacity", o);
  }, [ready, active, map]);

  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    m.getSource("routes").setData(fc(active ? model.routes : []));
    m.getSource("detours").setData(fc(active ? model.detours : []));
    m.getSource("rx").setData(fc(active ? model.rx : []));
    m.getSource("avoids").setData(fc(active ? model.avoids : []));
    setDestinations(m, active ? r.selected : []);
    setListed(m, active ? r.services.map((s) => s.id) : []);
  }, [ready, active, model, r.selected, r.services, map]);

  // Moving dashes on the scenario route; frozen for reduced motion and while the tab is hidden.
  const hasScenario = active && model.routes.some((f) => f.properties.role === "scen");
  useEffect(() => {
    if (!ready || !hasScenario) return;
    return flowDash(map.current, reducedMotion());
  }, [ready, hasScenario, map]);

  // Markers: origin pin (every tab), closed crossings and the detour chip (Access tab only).
  useEffect(() => {
    if (!ready) return;
    const m = map.current, ml = (window as unknown as { maplibregl: ML }).maplibregl;
    markers.current.origin?.remove(); markers.current.origin = null;
    if (r.origin) {
      const el = document.createElement("div");
      el.className = "ws-pin-wrap"; el.setAttribute("role", "img"); el.setAttribute("aria-label", t("routemap.pin.label", { label: r.origin.label }));
      el.innerHTML = `<div class="ws-pin"><span>${esc(initial(r.origin.label))}</span></div>`;
      markers.current.origin = new ml.Marker({ element: el, anchor: "bottom" }).setLngLat([r.origin.lon, r.origin.lat]).addTo(m);
    }
  }, [ready, r.origin, map]);
  useEffect(() => {
    if (!ready) return;
    const m = map.current, ml = (window as unknown as { maplibregl: ML }).maplibregl;
    for (const x of markers.current.extra) x.remove();
    markers.current.extra = [];
    if (!active) return;
    model.closed.slice(0, 12).forEach((c, i) => {
      const el = document.createElement("div");
      el.className = "ws-closed"; el.setAttribute("role", "img"); el.setAttribute("aria-label", t("routemap.closed.label", { name: c.name })); el.title = t("routemap.closed.title", { name: c.name });
      el.innerHTML = `<span class="ws-closed-pulse"></span><span class="ws-closed-ring"><b>×</b></span>${i === 0 ? `<span class="ws-closed-label">${t("routemap.closed.marker")}</span>` : ""}`;
      markers.current.extra.push(new ml.Marker({ element: el, anchor: "center" }).setLngLat([c.lon, c.lat]).addTo(m));
    });
    for (const c of model.chips) {
      const el = document.createElement("div");
      el.className = c.focusId ? "ws-chip ws-chip-alt" : "ws-chip"; el.textContent = c.text;
      if (c.focusId) { // an alternative's chip is a button: it makes that route the focused one
        const id = c.focusId, go = () => live.current.setFocus(id);
        el.setAttribute("role", "button"); el.tabIndex = 0; el.setAttribute("aria-label", c.text);
        el.addEventListener("click", go); el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      }
      markers.current.extra.push(new ml.Marker({ element: el, anchor: "center" }).setLngLat(c.at).addTo(m));
    }
  }, [ready, active, model.closed, model.chips, map]);

  // Camera: frame the address, the chosen services and their routes inside the gap between the open panels. Refits when the origin or the chosen services change, not on every hour.
  const resolved = r.selected.filter((id) => Array.isArray(r.trips[id])).length;
  const fitKey = r.origin ? `${r.origin.lat},${r.origin.lon}|${r.selected.join(",")}|${resolved}|${r.ranked.filter((x) => x.o.kind !== "detour").length}` : ""; // backups arriving widen the frame; an hour-dependent detour does not
  useEffect(() => {
    if (!ready || !active || !fitKey || !r.origin) return;
    const pts: LngLat[] = [[r.origin.lon, r.origin.lat], ...r.services.filter((s) => r.selected.includes(s.id)).map((s) => [s.lon, s.lat] as LngLat), ...model.shapes.flat()];
    const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1]);
    map.current.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
      { padding: mapPadding(window.innerWidth >= 1024, rightOpen, sheetPx), maxZoom: 14, duration: reducedMotion() ? 0 : 900 });
  }, [ready, active, fitKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
