// Route overlay: baseline (what you would drive normally), scenario route (what the selected hour allows), detour highlight and the crossings on them.
// Sources and layers are added once; the hook feeds them with setData.
import type { ML } from "@/lib/maplibre";
import { TIERS } from "./tiers";
import { NO_VALUE, type Expr } from "./expr";

export const INK = "#111111", BLUE = "#2D5DA1", AMBER = "#F2A93B", AMBER_DARK = "#9C5F12", BLOCKED = "#7A0000", SLATE = "#5B6B82", RED = "#CC0000";
const hover = (w: number): Expr => ["case", ["boolean", ["feature-state", "hover"], false], w * 1.3, w]; // feature-state "hover" is set by use-route-map
const EMPTY = { type: "FeatureCollection", features: [] };
const cap = { "line-cap": "round", "line-join": "round" } as const;
const role = (r: string): Expr => ["==", ["get", "role"], r];

export function addRouteLayers(map: ML) {
  for (const s of ["detours", "rx", "avoids"]) map.addSource(s, { type: "geojson", data: EMPTY });
  map.addSource("routes", { type: "geojson", data: EMPTY, promoteId: "id" }); // promoteId: hover state is per route
  const before = "svc-disc"; // routes sit above the bubbles and below the facility icons
  // Other options (alternatives, backups, detours): white casing 5 px under a 3 px slate line; they grow 1.3x on hover and a click makes one the focused route.
  map.addLayer({ id: "route-alt-casing", type: "line", source: "routes", filter: role("alt"), layout: cap, paint: { "line-color": "#FFFFFF", "line-width": hover(5), "line-opacity": 0.95 } }, before);
  map.addLayer({ id: "route-alt", type: "line", source: "routes", filter: role("alt"), layout: cap, paint: { "line-color": SLATE, "line-width": hover(3), "line-opacity": 0.75 } }, before);
  // Baseline: white casing 6 px under a 3.5 px dashed ink line at 55%.
  map.addLayer({ id: "route-base-casing", type: "line", source: "routes", filter: role("base"), layout: cap, paint: { "line-color": "#FFFFFF", "line-width": 6, "line-opacity": 0.95 } }, before);
  map.addLayer({ id: "route-base", type: "line", source: "routes", filter: role("base"), layout: { "line-cap": "butt", "line-join": "round" }, paint: { "line-color": "rgba(17,17,17,0.55)", "line-width": 3.5, "line-dasharray": [2, 1.6] } }, before);
  // Scenario route: white casing 7 px, blue 4 px (deep red when every route found has a closed crossing), and a moving dash overlay.
  map.addLayer({ id: "route-scen-casing", type: "line", source: "routes", filter: role("scen"), layout: cap, paint: { "line-color": "#FFFFFF", "line-width": 7, "line-opacity": 0.95 } }, before);
  map.addLayer({ id: "route-scen", type: "line", source: "routes", filter: role("scen"), layout: cap, paint: { "line-color": ["match", ["get", "state"], 2, BLOCKED, BLUE], "line-width": 4 } }, before);
  map.addLayer({ id: "route-detour-casing", type: "line", source: "detours", layout: cap, paint: { "line-color": AMBER_DARK, "line-width": 8, "line-opacity": 0.9 } }, before);
  map.addLayer({ id: "route-detour", type: "line", source: "detours", layout: cap, paint: { "line-color": AMBER, "line-width": 5 } }, before);
  map.addLayer({ id: "route-flow", type: "line", source: "routes", filter: role("scen"), layout: { "line-cap": "butt", "line-join": "round" }, paint: { "line-color": "#FFFFFF", "line-width": 2, "line-opacity": 0.8, "line-dasharray": [0, 4, 3] } }, before);
  // The crossing a backup route avoids: a hollow red ring.
  map.addLayer({ id: "route-avoid", type: "circle", source: "avoids", paint: { "circle-radius": 10, "circle-color": RED, "circle-opacity": 0, "circle-stroke-color": RED, "circle-stroke-width": 2.5 } }, before);
  // Crossings on the drawn routes, in the tier palette. cls: 0..4 tier, -1 no model value, -2 not assessed.
  map.addLayer({ id: "route-x", type: "circle", source: "rx", paint: {
    "circle-radius": ["match", ["get", "cls"], 4, 8, 3, 7.5, 2, 6.5, 1, 6, 5.5], "circle-stroke-width": 2,
    "circle-color": ["match", ["get", "cls"], 0, TIERS[0].fill, 1, TIERS[1].fill, 2, TIERS[2].fill, 3, TIERS[3].fill, 4, TIERS[4].fill, "#FFFFFF"],
    "circle-stroke-color": ["match", ["get", "cls"], 0, TIERS[0].stroke, 1, TIERS[1].stroke, 2, TIERS[2].stroke, 3, TIERS[3].stroke, 4, TIERS[4].stroke, NO_VALUE.stroke] } }, before);

  // Chosen destinations: the facility icon, enlarged, with a blue ring and an always-on label.
  const big: Expr = ["interpolate", ["linear"], ["zoom"], 8, 0.85, 12, 1.2, 15, 1.55];
  const sel = (ids: string[]): Expr => ["in", ["get", "id"], ["literal", ids]];
  map.addLayer({ id: "svc-sel-ring", type: "circle", source: "svc", filter: sel([]), paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 15, 15, 30], "circle-color": "rgba(45,93,161,0.14)", "circle-stroke-color": BLUE, "circle-stroke-width": 2.5 } });
  map.addLayer({ id: "svc-sel-disc", type: "symbol", source: "svc", filter: sel([]), layout: { "icon-image": "ws-disc", "icon-size": big, "icon-allow-overlap": true }, paint: { "icon-color": "#FFFFFF", "icon-halo-color": "rgba(17,17,17,0.35)", "icon-halo-width": 1.4, "icon-halo-blur": 1.2 } });
  map.addLayer({ id: "svc-sel-glyph", type: "symbol", source: "svc", filter: sel([]), layout: { "icon-image": ["concat", "ws-", ["get", "ico"]], "icon-size": big, "icon-allow-overlap": true }, paint: { "icon-color": ["get", "fill"] } });
  map.addLayer({ id: "svc-sel-label", type: "symbol", source: "svc", filter: sel([]), layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": 13, "text-anchor": "top", "text-offset": [0, 1.9], "text-max-width": 10, "text-optional": true },
    paint: { "text-color": "#111111", "text-halo-color": "rgba(255,255,255,0.95)", "text-halo-width": 1.6 } });
}

const SEQ = [[0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]];
/** Cycles line-dasharray so dashes travel along the scenario route. Returns a stop function. Frozen when the tab is hidden or reduced motion is on. */
export function flowDash(map: ML, reduce: boolean) {
  if (reduce) { map.setPaintProperty("route-flow", "line-dasharray", [2, 2]); return () => {}; }
  let i = 0, t = 0;
  const tick = () => {
    if (!document.hidden) { i = (i + 1) % SEQ.length; map.setPaintProperty("route-flow", "line-dasharray", SEQ[i]); }
    t = window.setTimeout(tick, 90);
  };
  tick();
  return () => window.clearTimeout(t);
}

/** Show these facility ids in the destination layers. */
export function setDestinations(map: ML, ids: string[]) {
  const f: Expr = ["in", ["get", "id"], ["literal", ids]];
  for (const l of ["svc-sel-ring", "svc-sel-disc", "svc-sel-glyph", "svc-sel-label"]) map.setFilter(l, f);
}
/** Facilities drawn on the Access tab: hospitals and fire stations always, plus the services listed for the address. */
export function setListed(map: ML, ids: string[]) {
  const f: Expr = ids.length ? ["any", ["==", ["get", "big"], 1], ["in", ["get", "id"], ["literal", ids]]] : ["==", ["get", "big"], 1];
  for (const l of ["svc-disc", "svc-glyph", "svc-label"]) map.setFilter(l, f);
}
