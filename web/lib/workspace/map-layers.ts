// Sources and layers of the workspace map. One GeoJSON source per dataset, all styling in paint expressions (see expr.ts).
// Crossings and facilities are added once; tabs, hours and the Layer chip only change paint, filters or the data of an existing source.
import type { ML } from "@/lib/maplibre";
import type { Svc } from "@/lib/services";
import { KIND } from "@/lib/services";
import type { XAssessed } from "@/lib/route";
import { FILL_OPACITY, HALO_OPACITY, NO_VALUE, clusterFillAt, clusterHaloAt, clusterProps, clusterTier, fillAt, haloFillAt, haloRadiusExpr, radiusExpr, selRadiusExpr, strokeAt, strokeWAt, type Expr } from "./expr";
import { TIERS, tierFromLevel } from "./tiers";

export type Tab = "water" | "access" | "consequence";
const EMPTY = { type: "FeatureCollection", features: [] };

/** 3-character, zero-padded flow ratio x100 per step; "---" where the model has no value. */
const rt = (r: (number | null)[]) => r.map((v) => (v === null || v === undefined || Number.isNaN(v) ? "---" : String(Math.min(999, Math.max(0, Math.round(v * 100)))).padStart(3, "0"))).join("");

export type Placed = { ids: Map<string, number>; maxPeople: number };

/** Crossings as GeoJSON points. The numeric feature id (position in the list) is what feature-state hangs on. */
export function crossingFeatures(list: XAssessed[]) {
  return {
    type: "FeatureCollection",
    features: list.map((x, i) => ({
      type: "Feature", id: i,
      properties: { id: x.id, name: x.name, ppl: x.people_affected, tidal: x.tidal ? 1 : 0, osm: x.basis === "osm" ? 1 : 0, county: x.county, lv: x.level, rt: rt(x.ratio_q10) },
      geometry: { type: "Point", coordinates: [x.lon, x.lat] },
    })),
  };
}
export const unassessedFeatures = (list: [string, number, number, string][]) => ({
  type: "FeatureCollection",
  features: list.map(([id, lat, lon, why], i) => ({ type: "Feature", id: i, properties: { id, why }, geometry: { type: "Point", coordinates: [lon, lat] } })),
});

const glyph = (k: string) => (k === "fire" ? "flame" : k === "hospital_ed" || k === "hospital" || k === "urgent_care" ? "cross" : "dot");
export const serviceFeatures = (items: Svc[]) => ({
  type: "FeatureCollection",
  features: items.map((s, i) => ({
    type: "Feature", id: i,
    properties: { id: s.id, k: s.k, kindLabel: KIND[s.k].one, name: s.name, fill: KIND[s.k].fill, ico: glyph(s.k), big: s.k === "hospital_ed" || s.k === "hospital" || s.k === "fire" ? 1 : 0, z: s.k === "hospital_ed" ? 3 : s.k === "hospital" ? 2 : 1 },
    geometry: { type: "Point", coordinates: [s.lon, s.lat] },
  })),
});

const BEFORE_LABELS = (map: ML): string | undefined => (map.getStyle().layers as { id: string; type: string }[]).find((l) => l.type === "symbol")?.id;
const NOT_CLUSTER: Expr = ["!", ["has", "point_count"]];
// Icon size by zoom; fire stations (214 of them) stay hidden until zoom 10 so the wide view is not a field of flames.
const fire: Expr = ["==", ["get", "k"], "fire"];
const zoomIcon: Expr = ["interpolate", ["linear"], ["zoom"], 8, ["case", fire, 0, 0.5], 9.9, ["case", fire, 0, 0.6], 10, ["case", fire, 0.55, 0.62], 14, ["case", fire, 0.9, 1]];

export function addLayers(map: ML) {
  const before = BEFORE_LABELS(map);
  map.addSource("xs", { type: "geojson", data: EMPTY, cluster: true, clusterMaxZoom: 6, clusterRadius: 42, clusterProperties: clusterProps() });
  map.addSource("xu", { type: "geojson", data: EMPTY });
  map.addSource("svc", { type: "geojson", data: EMPTY });

  map.addLayer({ id: "xu", type: "circle", source: "xu", minzoom: 10.5, paint: {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 10.5, 2, 14, 4], "circle-color": "#FFFFFF", "circle-opacity": 0.6, "circle-stroke-color": NO_VALUE.stroke, "circle-stroke-width": 1, "circle-stroke-opacity": 0.8 } }, before);
  map.addLayer({ id: "x-halo", type: "circle", source: "xs", filter: NOT_CLUSTER, layout: { "circle-sort-key": ["-", ["get", "ppl"]] }, paint: { "circle-blur": 0.35, "circle-opacity": HALO_OPACITY, "circle-opacity-transition": { duration: 300, delay: 0 } } }, before);
  map.addLayer({ id: "x-bubble", type: "circle", source: "xs", filter: NOT_CLUSTER, layout: { "circle-sort-key": ["-", ["get", "ppl"]] }, paint: { "circle-opacity": FILL_OPACITY, "circle-stroke-opacity": 1, "circle-opacity-transition": { duration: 300, delay: 0 }, "circle-stroke-opacity-transition": { duration: 300, delay: 0 } } }, before);
  map.addLayer({ id: "x-sel", type: "circle", source: "xs", filter: NOT_CLUSTER, paint: {
    "circle-opacity": 0, "circle-stroke-color": "#111111", "circle-stroke-width": 2.5,
    "circle-stroke-opacity": ["case", ["boolean", ["feature-state", "sel"], false], 1, 0] } }, before);
  const cr: Expr = ["step", ["get", "point_count"], 14, 10, 19, 40, 25, 100, 32];
  map.addLayer({ id: "x-cluster-halo", type: "circle", source: "xs", filter: ["has", "point_count"], paint: { "circle-radius": ["+", 8, ["*", 1.15, cr]], "circle-opacity": HALO_OPACITY, "circle-blur": 0.35 } }, before);
  map.addLayer({ id: "x-cluster", type: "circle", source: "xs", filter: ["has", "point_count"], paint: { "circle-radius": cr, "circle-stroke-width": 2 } }, before);
  map.addLayer({ id: "x-cluster-n", type: "symbol", source: "xs", filter: ["has", "point_count"], layout: {
    "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 13, "text-allow-overlap": true }, paint: { "text-color": "#111111" } }, before);

  const fl = ["==", ["get", "big"], 1];
  map.addLayer({ id: "svc-disc", type: "symbol", source: "svc", filter: fl, layout: { "icon-image": "ws-disc", "icon-size": zoomIcon, "icon-allow-overlap": true, "symbol-sort-key": ["get", "z"] },
    paint: { "icon-color": "#FFFFFF", "icon-halo-color": "rgba(17,17,17,0.32)", "icon-halo-width": 1.4, "icon-halo-blur": 1.2 } });
  map.addLayer({ id: "svc-glyph", type: "symbol", source: "svc", filter: fl, layout: { "icon-image": ["concat", "ws-", ["get", "ico"]], "icon-size": zoomIcon, "icon-allow-overlap": true, "symbol-sort-key": ["get", "z"] },
    paint: { "icon-color": ["get", "fill"] } });
  map.addLayer({ id: "svc-label", type: "symbol", source: "svc", filter: fl, minzoom: 11, layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 13, "text-anchor": "top", "text-offset": [0, 1.2],
    "text-max-width": 9, "text-optional": true, "text-allow-overlap": false }, paint: { "text-color": "#2A2F36", "text-halo-color": "rgba(255,255,255,0.9)", "text-halo-width": 1.3 } });
}

/** Paint for the current tab and hour. Called on every hour tick (cheap: constants inside expressions change, no data moves). */
export function applyEncoding(map: ML, tab: Tab, hour: number, maxPeople: number) {
  const set = (id: string, prop: string, v: unknown) => map.setPaintProperty(id, prop, v);
  set("x-halo", "circle-color", haloFillAt(hour)); set("x-halo", "circle-radius", haloRadiusExpr(tab, hour, maxPeople));
  set("x-bubble", "circle-color", fillAt(hour)); set("x-bubble", "circle-radius", radiusExpr(tab, hour, maxPeople));
  set("x-bubble", "circle-stroke-color", strokeAt(hour)); set("x-bubble", "circle-stroke-width", strokeWAt(hour, tab));
  set("x-sel", "circle-radius", selRadiusExpr(tab, hour, maxPeople));
  set("x-cluster-halo", "circle-color", clusterHaloAt(hour)); set("x-cluster", "circle-color", clusterFillAt(hour));
  set("x-cluster", "circle-stroke-color", ["match", clusterTier(hour), 0, TIERS[0].stroke, 1, TIERS[1].stroke, 2, TIERS[2].stroke, 3, TIERS[3].stroke, 4, TIERS[4].stroke, NO_VALUE.stroke]);
  set("x-cluster", "circle-stroke-width", ["match", clusterTier(hour), 0, 1.5, 1, 2, 2, 2.5, 3, 3, 4, 3.5, 1.5]);
}

/** Fades the bubble layers out, runs `swap` (new paint), then fades them back in: a tab switch never pops. Opacities are layer constants, so MapLibre tweens them (300 ms). */
export function fadeSwap(map: ML, swap: () => void, ms = 300) {
  const level = (on: boolean) => {
    map.setPaintProperty("x-halo", "circle-opacity", on ? HALO_OPACITY : 0);
    map.setPaintProperty("x-bubble", "circle-opacity", on ? FILL_OPACITY : 0);
    map.setPaintProperty("x-bubble", "circle-stroke-opacity", on ? 1 : 0);
  };
  level(false);
  return window.setTimeout(() => { swap(); level(true); }, ms);
}

export const levelTier = (lv: string, h: number): number => tierFromLevel(lv.charAt(h));
