// MapLibre is bundled from npm and loaded on first use; basemap is OpenFreeMap (no API key).
export const STYLE = "https://tiles.openfreemap.org/styles/positron";
export const BOUNDS = [[-78.65, 33.83], [-77.65, 34.65]];

export type ML = any; // eslint-disable-line @typescript-eslint/no-explicit-any
let loading: Promise<ML> | null = null;

export function loadMaplibre(): Promise<ML> {
  loading ??= Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl.css")])
    .then(([m]) => { const ml = (m as ML).default ?? m; ml.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs"); (window as unknown as { maplibregl: ML }).maplibregl = ml; return ml; }) // callers read window.maplibregl
    .catch((e) => { loading = null; throw new Error("map library failed to load: " + e.message); });
  return loading;
}

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
