"use client";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { esc, type ML } from "@/lib/maplibre";
import { tidyName } from "@/lib/format";
import { CLOSED, type LngLat, type OnRoute } from "@/lib/route";
import { mapPadding, reducedMotion } from "@/lib/workspace/camera";
import { detourRuns, length, midpoint } from "@/lib/workspace/geo";
import { flowDash, setDestinations, setListed } from "@/lib/workspace/route-layers";
import { tierOfLevel } from "@/lib/workspace/stats";
import { TIERS } from "@/lib/workspace/tiers";
import { createTooltip } from "@/lib/workspace/tooltip";
import { useRouting } from "@/components/workspace/routing";
import { useWS } from "@/components/workspace/store";

type Feat = { type: "Feature"; properties: Record<string, unknown>; geometry: { type: "LineString" | "Point"; coordinates: unknown } };
const fc = (features: Feat[]) => ({ type: "FeatureCollection", features });
const STATE_TEXT = ["No crossing flagged", "At risk", "Crossing flagged"];
const ROUTE_LINES = ["route-alt", "route-base-casing", "route-base", "route-scen-casing", "route-scen", "route-detour-casing", "route-detour", "route-flow"];

/** Everything the Access tab draws, derived from the routing state and the selected hour. */
function useModel() {
  const r = useRouting();
  const hh = r.hh;
  return useMemo(() => {
    const routes: Feat[] = [], detours: Feat[] = [], rx = new Map<string, Feat>();
    const closed = new Map<string, { lon: number; lat: number; id: string; name: string; km: number }>();
    const chips: { at: LngLat; text: string }[] = [];
    const shapes: LngLat[][] = [];
    const crossingPoint = (c: OnRoute) => {
      const lv = c.x ? parseInt(c.x.level[hh] ?? "-", 10) : NaN;
      const cls = !c.x ? -2 : tierOfLevel(lv);
      rx.set(c.id, { type: "Feature", properties: { id: c.id, cls, name: c.x ? tidyName(c.x.name) : "Stream crossing (not assessed)",
        status: !c.x ? "Not assessed by the model: not assumed open" : cls < 0 ? "No flow value for this step: not assumed open" : cls >= 3 ? "Closed in scenario (above 10-year flow)" : `${TIERS[cls].label}: ${TIERS[cls].note}` },
        geometry: { type: "Point", coordinates: [c.lon, c.lat] } });
    };
    for (const id of r.selected) {
      const opts = r.ranked.filter((x) => x.o.serviceId === id);
      if (!opts.length) continue;
      const scen = opts.find((x) => x.o.id === r.focus) ?? opts[0], base = r.baseline[id];
      for (const { o, s } of opts) {
        const role = o.id === scen.o.id ? "scen" : base && o.id === base.id ? "base" : "alt";
        routes.push({ type: "Feature", properties: { id: o.id, role, state: s.state, label: o.label, status: STATE_TEXT[s.state] }, geometry: { type: "LineString", coordinates: o.shape } });
        shapes.push(o.shape);
        if (role !== "alt") for (const c of o.on) crossingPoint(c);
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
        if (longest) { const m = Math.round((scen.o.timeS - base.timeS) / 60); chips.push({ at: midpoint(longest), text: m >= 1 ? `+${m} min detour` : "Rerouted" }); }
      }
    }
    return { routes, detours, rx: [...rx.values()], closed: [...closed.values()].sort((a, b) => a.km - b.km), chips, shapes };
  }, [r.selected, r.ranked, r.focus, r.baseline, hh]);
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
    m.on("mousemove", "route-x", (e: ML) => { const p = e.features?.[0]?.properties; if (!p) return; m.getCanvas().style.cursor = "default"; tip.show(p.name, [["Status", p.status, false]], e.point.x, e.point.y); });
    m.on("mouseleave", "route-x", leave);
    for (const id of ["route-scen", "route-base", "route-alt"]) {
      m.on("mousemove", id, (e: ML) => { const p = e.features?.[0]?.properties; if (!p) return; m.getCanvas().style.cursor = "pointer"; tip.show(p.label, [["Route", id === "route-base" ? "Normal route (no closures)" : id === "route-alt" ? "Alternative" : "Scenario route", false], ["Status", p.status, false]], e.point.x, e.point.y); });
      m.on("mouseleave", id, leave);
      m.on("click", id, (e: ML) => { const p = e.features?.[0]?.properties; if (p) live.current.setFocus(p.id); });
    }
    return () => tip.destroy();
  }, [ready, map]);

  // Layers: fade in and out with the tab (opacity is a paint constant, so MapLibre tweens it), data only while the tab is open.
  useEffect(() => {
    if (!ready) return;
    const m = map.current, o = active ? 1 : 0;
    for (const id of ROUTE_LINES) m.setPaintProperty(id, "line-opacity", id.endsWith("casing") ? o * 0.95 : id === "route-flow" ? o * 0.8 : o);
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
      el.className = "ws-pin-wrap"; el.setAttribute("role", "img"); el.setAttribute("aria-label", `Starting point: ${r.origin.label}`);
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
      el.className = "ws-closed"; el.setAttribute("role", "img"); el.setAttribute("aria-label", `Closed in scenario: ${c.name}`); el.title = `${c.name}: closed in scenario`;
      el.innerHTML = `<span class="ws-closed-pulse"></span><span class="ws-closed-ring"><b>×</b></span>${i === 0 ? `<span class="ws-closed-label">Closed in scenario</span>` : ""}`;
      markers.current.extra.push(new ml.Marker({ element: el, anchor: "center" }).setLngLat([c.lon, c.lat]).addTo(m));
    });
    for (const c of model.chips) {
      const el = document.createElement("div");
      el.className = "ws-chip"; el.textContent = c.text;
      markers.current.extra.push(new ml.Marker({ element: el, anchor: "center" }).setLngLat(c.at).addTo(m));
    }
  }, [ready, active, model.closed, model.chips, map]);

  // Camera: frame the address, the chosen services and their routes inside the gap between the open panels. Refits when the origin or the chosen services change, not on every hour.
  const resolved = r.selected.filter((id) => Array.isArray(r.trips[id])).length;
  const fitKey = r.origin ? `${r.origin.lat},${r.origin.lon}|${r.selected.join(",")}|${resolved}` : "";
  useEffect(() => {
    if (!ready || !active || !fitKey || !r.origin) return;
    const pts: LngLat[] = [[r.origin.lon, r.origin.lat], ...r.services.filter((s) => r.selected.includes(s.id)).map((s) => [s.lon, s.lat] as LngLat), ...model.shapes.flat()];
    const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1]);
    map.current.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
      { padding: mapPadding(window.innerWidth >= 1024, rightOpen, sheetPx), maxZoom: 14, duration: reducedMotion() ? 0 : 900 });
  }, [ready, active, fitKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
