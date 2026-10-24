"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BOUNDS, STYLE, loadMaplibre, type ML } from "@/lib/maplibre";
import { tidyName } from "@/lib/format";
import { restyle } from "@/lib/workspace/basemap";
import { addLayers, applyEncoding, crossingFeatures, fadeSwap, levelTier, serviceFeatures, unassessedFeatures } from "@/lib/workspace/map-layers";
import { addIcons } from "@/lib/workspace/sdf";
import { TIERS } from "@/lib/workspace/tiers";
import { createTooltip } from "@/lib/workspace/tooltip";
import { useData } from "@/components/workspace/data";
import { useWS } from "@/components/workspace/store";

/** Camera padding that keeps the visible centre between the open panels. Desktop: left 400 (+ rail), right 380, top 90, bottom 110. */
export const mapPadding = (desktop: boolean, rightOpen: boolean, sheetPx: number) =>
  desktop ? { left: 460, right: rightOpen ? 392 : 80, top: 90, bottom: 110 } : { left: 24, right: 24, top: 110, bottom: sheetPx + 70 };

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Full-viewport map. Hover and selection run through feature-state: nothing here re-renders React per mouse move. */
export function MapView() {
  const ws = useWS(), d = useData();
  const { tab, hour, layer, facilities, rightOpen, sheetPx, api, setSnap } = ws;
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<ML>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxPeople, setMaxPeople] = useState(1);
  const pad = useRef(mapPadding(true, true, 0));
  const live = useRef({ tab, hour, byId: d.byId });
  live.current = { tab, hour, byId: d.byId };
  const ids = useRef(new Map<string, number>()); // crossing id -> numeric feature id in the current data
  const prevTab = useRef(tab);
  const swapTimer = useRef(0);

  // The crossings drawn: the Layer chip is a display filter (rivers = non-tidal, coastal = tidal). Route checks elsewhere always use every crossing.
  const shown = useMemo(() => (d.X ? d.X.assessed.filter((x) => layer === "both" || (layer === "coastal") === x.tidal) : []), [d.X, layer]);

  useEffect(() => { pad.current = mapPadding(window.innerWidth >= 1024, rightOpen, sheetPx); }, [rightOpen, sheetPx]);

  // Build the map once.
  useEffect(() => {
    let gone = false;
    const cleanups: (() => void)[] = [];
    loadMaplibre().then((ml) => {
      if (gone || !box.current) return;
      pad.current = mapPadding(window.innerWidth >= 1024, window.innerWidth >= 1280, 0);
      const m = new ml.Map({ container: box.current, style: STYLE, bounds: BOUNDS, fitBoundsOptions: { padding: pad.current }, attributionControl: false, dragRotate: false, pitchWithRotate: false });
      map.current = m;
      if (process.env.NODE_ENV !== "production") (window as unknown as { __map: ML }).__map = m; // dev only: lets screenshot scripts drive the camera
      m.addControl(new ml.AttributionControl({ compact: true }), "bottom-left");
      api.current = {
        zoomIn: () => m.zoomIn(), zoomOut: () => m.zoomOut(),
        reset: () => m.fitBounds(BOUNDS, { padding: pad.current, duration: reduced() ? 0 : 800 }),
        flyTo: (lon, lat, zoom) => m.flyTo({ center: [lon, lat], zoom: zoom ?? Math.max(m.getZoom(), 12), padding: pad.current, essential: true, duration: reduced() ? 0 : 1100 }),
      };
      m.on("load", () => {
        try { restyle(m); } catch { /* the stock style still works */ }
        addIcons(m);
        addLayers(m);
        const tip = createTooltip(box.current!);
        cleanups.push(() => tip.destroy());

        // Hover growth: feature-state "grow" eased 0 to 1 in JS (paint expressions cannot tween per feature).
        const grow = new Map<number, { v: number; raf: number }>();
        const to = (id: number, target: number) => {
          const g = grow.get(id) ?? { v: 0, raf: 0 };
          cancelAnimationFrame(g.raf); grow.set(id, g);
          if (reduced()) { g.v = target; m.setFeatureState({ source: "xs", id }, { grow: target }); return; }
          const from = g.v, t0 = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - t0) / 160);
            g.v = from + (target - from) * easeOut(t);
            m.setFeatureState({ source: "xs", id }, { grow: g.v });
            if (t < 1) g.raf = requestAnimationFrame(step);
          };
          g.raf = requestAnimationFrame(step);
        };
        let hov: number | null = null;
        const leave = () => { if (hov !== null) to(hov, 0); hov = null; m.getCanvas().style.cursor = ""; tip.hide(); };

        m.on("mousemove", "x-bubble", (e: ML) => {
          const f = e.features?.[0];
          if (!f) return;
          m.getCanvas().style.cursor = "pointer";
          if (hov !== f.id) { if (hov !== null) to(hov, 0); hov = f.id; to(f.id, 1); }
          const p = f.properties, h = live.current.hour, t = levelTier(p.lv, h), parts = String(p.name).split(/ over /i);
          const ratio = parseInt(String(p.rt).slice(3 * h, 3 * h + 3), 10);
          const rows: [string, string, boolean?][] = [["Crossing ID", p.id, true], ["Stream", tidyName(parts.length > 1 ? parts[1] : "Not named"), false]];
          if (live.current.tab === "water") rows.push(["Flow vs 10-year", Number.isNaN(ratio) ? "no model value" : `${(ratio / 100).toFixed(2)}×`, true]);
          rows.push(["People affected", Number(p.ppl).toLocaleString("en-US"), true], ["Tier", t < 0 ? "No model value" : TIERS[t].label, false]);
          tip.show(tidyName(parts[0] ?? p.name), rows, e.point.x, e.point.y);
        });
        m.on("mouseleave", "x-bubble", leave);
        m.on("click", "x-bubble", (e: ML) => { const p = e.features?.[0]?.properties; if (p) { d.setSelectedId(p.id); setSnap("half"); } });

        m.on("mousemove", "x-cluster", (e: ML) => {
          const p = e.features?.[0]?.properties; if (!p) return;
          m.getCanvas().style.cursor = "pointer";
          tip.show(`${p.point_count} crossings`, [["People affected", `${Number(p.pp).toLocaleString("en-US")} (summed)`, true], ["Worst tier now", (() => { const t = p[`mx${Math.min(live.current.hour, 17)}`]; return t >= 0 ? TIERS[t].label : "No model value"; })(), false]], e.point.x, e.point.y);
        });
        m.on("mouseleave", "x-cluster", leave);
        m.on("click", "x-cluster", async (e: ML) => {
          const f = e.features?.[0]; if (!f) return;
          const z = await m.getSource("xs").getClusterExpansionZoom(f.properties.cluster_id);
          m.easeTo({ center: f.geometry.coordinates, zoom: z + 0.4, duration: reduced() ? 0 : 600 });
        });

        m.on("mousemove", "xu", (e: ML) => {
          m.getCanvas().style.cursor = "default";
          tip.show("Stream crossing", [["Crossing ID", e.features[0].properties.id, true], ["Status", "Not assessed", false], ["Open?", "Not assumed open", false]], e.point.x, e.point.y);
        });
        m.on("mouseleave", "xu", leave);
        const svcTip = (e: ML) => { const p = e.features?.[0]?.properties; if (!p) return; m.getCanvas().style.cursor = "default"; tip.show(p.name, [["Type", p.kindLabel, false], ["Open?", "Not confirmed", false]], e.point.x, e.point.y); };
        for (const id of ["svc-disc", "svc-glyph"]) { m.on("mousemove", id, svcTip); m.on("mouseleave", id, leave); }
        setReady(true);
      });
    }).catch((e: Error) => setError(e.message));
    return () => { gone = true; for (const c of cleanups) c(); api.current = null; map.current?.remove(); map.current = null; setReady(false); };
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  // Data: crossings (filtered by the Layer chip), unassessed crossings, services.
  useEffect(() => {
    if (!ready || !d.X) return;
    const m = map.current;
    ids.current = new Map(shown.map((x, i) => [x.id, i]));
    setMaxPeople(Math.max(1, ...shown.map((x) => x.people_affected)));
    m.getSource("xs").setData(crossingFeatures(shown));
    m.getSource("xu").setData(unassessedFeatures(layer === "both" ? d.X.not_assessed : []));
  }, [ready, shown, d.X, layer]);
  useEffect(() => { if (ready && d.base) map.current.getSource("svc").setData(serviceFeatures(d.base.svc.items)); }, [ready, d.base]);

  // Encoding for the tab and hour. A tab change fades the bubbles out and in; an hour change swaps the constant inside the expressions at once.
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    window.clearTimeout(swapTimer.current);
    if (prevTab.current !== tab && !reduced()) swapTimer.current = fadeSwap(m, () => applyEncoding(m, tab, hour, maxPeople));
    else applyEncoding(m, tab, hour, maxPeople);
    prevTab.current = tab;
  }, [ready, tab, hour, maxPeople]);

  useEffect(() => {
    if (!ready) return;
    const v = facilities ? "visible" : "none";
    for (const id of ["svc-disc", "svc-glyph", "svc-label"]) map.current.setLayoutProperty(id, "visibility", v);
  }, [ready, facilities]);

  // Selection ring.
  const selFeature = useRef<number | null>(null);
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    if (selFeature.current !== null) m.setFeatureState({ source: "xs", id: selFeature.current }, { sel: false });
    selFeature.current = d.selectedId ? ids.current.get(d.selectedId) ?? null : null;
    if (selFeature.current !== null) m.setFeatureState({ source: "xs", id: selFeature.current }, { sel: true });
  }, [ready, d.selectedId, shown]);

  return (
    <div className="absolute inset-0">
      <div ref={box} className="h-full w-full" role="region" aria-label="Map of crossings and services in the Cape Fear region" />
      {error && <p className="absolute inset-0 grid place-items-center p-8 text-center font-ui text-sm text-muted">The map could not load ({error}).</p>}
    </div>
  );
}
