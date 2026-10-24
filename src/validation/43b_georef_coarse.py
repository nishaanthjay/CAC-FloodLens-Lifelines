"""Coarse georeference of the BCSO service-island wall map (protocol I, section C) to help pick ground control points.
The map is in NC State Plane NAD83 feet (north-up), so the PDF->EPSG:2264 transform is a similarity (s, tx, ty). Fitted here from the map's own road-name labels against same-name OSM roads;
the final GCPs (road intersections, picked by eye on crops) are made in 43c_georef.py. Reads no flow or consequence data."""
import re, numpy as np, pandas as pd, geopandas as gpd, pymupdf
from scipy.optimize import least_squares
from shapely.geometry import Point
P = "data/bcso_florence/wallmaps_flood_islands.pdf"; CRS = "EPSG:2264"


def labels():
    d = pymupdf.open(P)[0]; out = []
    for b in d.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = " ".join(s["text"] for s in l["spans"]).strip(); x0, y0, x1, y1 = l["bbox"]
            if len(t) >= 6 and t.upper() == t and re.search(r"(RD|ST|DR|HWY|BLVD|WAY|AVE|LN)$", t): out.append((t, (x0 + x1) / 2, (y0 + y1) / 2, l["dir"]))
    return out


def main():
    R = gpd.read_parquet("data/phase0/osm_roads.parquet").to_crs(CRS); cnt = gpd.read_file("data/phase0/counties.geojson").to_crs(CRS)
    poly = cnt[cnt.COUNTYFP == "019"].geometry.union_all(); R = R[R.intersects(poly.buffer(3000)) & R.name.notna()]
    R["key"] = R.name.str.upper().str.replace(".", "", regex=False).str.strip()
    g = R.groupby("key").geometry.apply(lambda s: s.union_all()); L = [l for l in labels() if l[0] in g.index]
    print(len(L), "labels with a same-name OSM road")
    minx, miny, maxx, maxy = poly.bounds; W, H = 3456.0, 2592.0
    s0 = (maxx - minx) / (0.9 * W)    # feet per PDF point, first guess (map spans ~90% of the page width)
    tx0, ty0 = minx - 0.08 * W * s0, maxy + 0.07 * H * s0
    geoms = [g[l[0]] for l in L]; pts = np.array([[l[1], l[2]] for l in L])

    def resid(p):
        s, tx, ty = p; r = []
        for (x, y), gm in zip(pts, geoms): r.append(gm.distance(Point(tx + s * x, ty - s * y)))
        return np.array(r)
    best = None
    for ds in (0.9, 1.0, 1.1):
        for dx in (-1500, 0, 1500):
            for dy in (-1500, 0, 1500):
                p0 = [s0 * ds, tx0 + dx, ty0 + dy]; sol = least_squares(resid, p0, loss="soft_l1", f_scale=400, x_scale=[s0 * .05, 1000, 1000], max_nfev=40)
                if best is None or sol.cost < best.cost: best = sol
    s, tx, ty = best.x; r = resid(best.x)
    print("scale ft/pt", round(s, 3), "tx", round(tx), "ty", round(ty), "median label->road dist (ft)", round(float(np.median(r))), "share within 500 ft", round(float((r < 500).mean()), 2))
    pd.Series(dict(s=s, tx=tx, ty=ty)).to_json("data/derived/bcso_render/coarse_similarity.json")


if __name__ == "__main__": main()
