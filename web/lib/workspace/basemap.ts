// Restyles the OpenFreeMap positron style at load: quieter land and roads, soft blue water, small muted labels, no POIs.
// Only paint and layout properties change; layer ids come from the style itself, so an unknown id is simply skipped.
import type { ML } from "@/lib/maplibre";

const WATER = "#DCE8F5";
const LAND = "rgb(244,244,242)";

const FILL: Record<string, string> = {
  background: LAND,
  park: "#E8EAE7", landcover_wood: "#E5E7E4", landuse_residential: "#EDEDEB", building: "#E9E9E6",
  water: WATER,
};
const LINE: Record<string, string> = {
  waterway: "#C5D8EC",
  highway_minor: "#ECECEA", highway_path: "#EEEEEC", highway_major_subtle: "hsla(0,0%,86%,0.5)", highway_motorway_subtle: "hsla(0,0%,86%,0.45)",
  highway_major_casing: "#DEDEDC", highway_motorway_casing: "#D9D9D7", highway_motorway_bridge_casing: "#D9D9D7", tunnel_motorway_casing: "#DEDEDC",
  boundary_3: "hsl(0,0%,78%)", boundary_2: "hsl(0,0%,74%)",
};

/** Scales a number or a zoom interpolate/step expression by k (legacy {stops} too). Anything else is left alone. */
export function scaleSize(v: unknown, k: number): unknown {
  if (typeof v === "number") return +(v * k).toFixed(2);
  if (Array.isArray(v) && (v[0] === "interpolate" || v[0] === "step")) {
    const first = v[0] === "step" ? 2 : 4; // step: [op, input, out0, z1, out1, ...]; interpolate: [op, type, input, z1, out1, ...]
    return v.map((x, i) => (i >= first && (i - first) % 2 === 0 ? scaleSize(x, k) : x));
  }
  if (v && typeof v === "object" && "stops" in (v as object)) return { ...(v as object), stops: (v as { stops: [number, number][] }).stops.map(([z, n]) => [z, scaleSize(n, k)]) };
  return v;
}

export function restyle(map: ML) {
  const style = map.getStyle();
  for (const l of style.layers as { id: string; type: string; "source-layer"?: string; layout?: Record<string, unknown> }[]) {
    try {
      if (l["source-layer"] === "poi") { map.setLayoutProperty(l.id, "visibility", "none"); continue; }
      if (l.type === "background") map.setPaintProperty(l.id, "background-color", LAND);
      else if (l.type === "fill" && FILL[l.id]) map.setPaintProperty(l.id, "fill-color", FILL[l.id]);
      else if (l.type === "line" && LINE[l.id]) map.setPaintProperty(l.id, "line-color", LINE[l.id]);
      else if (l.type === "symbol") {
        const water = l.id.startsWith("water");
        map.setPaintProperty(l.id, "text-color", water ? "#7F97B8" : l.id.startsWith("label_") ? "#6F747C" : "#8A8F97");
        map.setPaintProperty(l.id, "text-halo-color", "rgba(255,255,255,0.85)");
        map.setPaintProperty(l.id, "text-halo-width", 1.2);
        const ts = l.layout?.["text-size"];
        if (ts !== undefined) map.setLayoutProperty(l.id, "text-size", scaleSize(ts, 0.88));
      }
    } catch { /* a layer this style version does not have: skip */ }
  }
  // Rivers a touch more present than the stock style so the water reads as the subject.
  try { map.setPaintProperty("waterway", "line-width", ["interpolate", ["exponential", 1.3], ["zoom"], 8, 0.6, 12, 1.6, 16, 5]); } catch { /* ignore */ }
}
