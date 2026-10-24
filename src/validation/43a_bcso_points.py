"""BCSO 2018 "Known Flood Points" -> config/bcso_flood_points.csv (protocol I, section B; amendment 1).
Legend of data/bcso_florence/bcso_FloodRoads_2018.pdf transcribed below (20 lines, nothing added or removed). Each point is located as the OSM intersection of the named road and the
named waterway (M1), else by crossing-name agreement (M2), then matched to the nearest crossing of data/phase0/crossings_v2.parquet within 300 m. No flow, hazard or consequence value is read here.
Usage: python src/validation/43a_bcso_points.py [explore]"""
import sys, re, itertools, numpy as np, pandas as pd, geopandas as gpd
from shapely.ops import unary_union
M = "EPSG:32617"; RADIUS = 300.0
# id, road, route_no, stream (main name), alt names ([...] in the legend)
LEGEND = [
    (1, "Pireway Rd", "904", "Waccamaw River", ""), (2, "Ocean Hwy", "17", "State Line", ""), (3, "Ocean Hwy", "17", "Hickman Rd", ""),
    (4, "Thomasboro Rd", "1165", "Little CawCaw Creek", ""), (5, "Old Shallotte Rd", "1316", "Cool Run Creek", ""), (6, "Ocean Hwy", "17", "OmniStorage", "McMilly Swamp"),
    (7, "Main St", "17-B", "Shallotte River", ""), (8, "Main St", "17-B", "Shallotte District Park", "Shallotte River"), (9, "Oxpen Rd", "1140", "Shallotte River", ""),
    (10, "Southport-Supply Rd", "211", "Lockwood Folly River", ""), (11, "Sunset Harbor Rd", "1112", "Mill Creek", ""), (12, "Midway Rd", "903", "Middle Swamp Creek", ""),
    (13, "George II Hwy", "87", "Patricia Lake", ""), (14, "E Boiling Spring Rd", "1539", "Pretty Pond", ""), (15, "River Rd", "133", "Orton Curve", "Liliput Creek"),
    (16, "River Rd", "133", "Funston", "Sand Hill Creek"), (17, "River Rd", "133", "Daws Creek", "Town Creek"), (18, "Ocean Hwy", "17", "Town Creek", ""),
    (19, "Lanvale Rd", "1438", "Lanvale Trace Retention Pond", ""), (20, "Grandiflora Rd", "", "Magnolia Greens Entrance", ""),
]
BAD = {"Waccamaw River": "Waccamaw", "Lockwood Folly River": "Lockwood", "Middle Swamp Creek": "Middle Swamp"}   # OSM often drops the type word or abbreviates; used only as extra name stems


def toks(s): return [t for t in re.split(r"[^a-z0-9]+", str(s).lower()) if t and t not in {"rd", "road", "st", "street", "hwy", "the", "at", "of"}]


def road_sel(R, road, route):
    """OSM road ways for a legend road: by name stem, or by ref (US 17 / US 17 Business / SR number / NC number)."""
    stem = road.lower().replace(" rd", "").replace(" hwy", "").replace(" st", "").strip()
    nm = R.name.fillna("").str.lower().str.contains(re.escape(stem), regex=True)
    ref = R.ref.fillna("").str.upper()
    if route == "17": rf = ref.str.contains(r"\bUS 17\b") & ~ref.str.contains("BUS")
    elif route == "17-B": rf = ref.str.contains(r"US 17 BUS|BUSINESS|17 BUS")
    elif route: rf = ref.str.contains(rf"\b{route}\b")
    else: rf = pd.Series(False, index=R.index)
    if route == "17": nm = nm & R.name.fillna("").str.lower().str.contains("ocean")
    return R[nm | rf]


def water_sel(W, names):
    ok = pd.Series(False, index=W.index)
    for n in names:
        if not n: continue
        stem = BAD.get(n, n).lower()
        ok |= W.name.fillna("").str.lower().str.contains(re.escape(stem), regex=True)
    return W[ok]


def main(explore=False):
    R = gpd.read_parquet("data/phase0/osm_roads.parquet").to_crs(M); W = gpd.read_parquet("data/phase0/osm_waterways.parquet").to_crs(M)
    C = gpd.read_parquet("data/phase0/crossings_v2.parquet").to_crs(M)
    cnt = gpd.read_file("data/phase0/counties.geojson").to_crs(M); poly = cnt[cnt.COUNTYFP == "019"].geometry.union_all(); cb = poly.buffer(2000)
    B = C[C.within(poly)].copy()   # amendment 2: Brunswick = inside the COUNTYFP 019 polygon
    R = R[R.intersects(cb)]; W = W[W.intersects(cb)]
    snap = pd.read_parquet("data/phase1b/crossing_snap.parquet").set_index("crossing_id")
    rows = []
    for pid, road, route, stream, alt in LEGEND:
        names = [stream, alt]; rr = road_sel(R, road, route); ww = water_sel(W, names); rec = dict(id=pid, road=road, route_no=route, stream=(stream + (f" [{alt}]" if alt else "")))
        rec.update(n_road_ways=len(rr), n_water_ways=len(ww), method="", lon=np.nan, lat=np.nan, crossing_id="", match_dist_m=np.nan, name_agrees="", note="")
        cand = []
        if len(rr) and len(ww):
            pts = rr.geometry.union_all().intersection(ww.geometry.union_all())
            pts = [g for g in (pts.geoms if hasattr(pts, "geoms") else [pts]) if g.geom_type == "Point"] if not pts.is_empty else []
            cand = pts
        rec["n_intersections"] = len(cand)
        # M1: crossing within RADIUS of an intersection; prefer name agreement, then nearest
        best = None
        for g in cand:
            d = B.geometry.distance(g); near = B[d <= RADIUS]
            for cid, row in near.iterrows():
                nmtxt = " ".join(str(row[c]) for c in ("road_carried", "feature_name", "nwm_name", "osm_waterway_type")).lower()
                ag = any(t in nmtxt for t in toks(road)) or (route and route in nmtxt); ag2 = any(t in nmtxt for t in itertools.chain(*[toks(n) for n in names if n]))
                key = (-(int(bool(ag)) + int(bool(ag2))), float(d[cid]))
                if best is None or key < best[0]: best = (key, row.crossing_id, g, float(d[cid]), bool(ag), bool(ag2))
        if best:
            rec.update(method="M1 OSM road x waterway", crossing_id=best[1], match_dist_m=round(best[3], 1), name_agrees=f"road={best[4]} stream={best[5]}")
            ll = gpd.GeoSeries([best[2]], crs=M).to_crs(4326).iloc[0]; rec.update(lon=round(ll.x, 6), lat=round(ll.y, 6))
        else:
            # M2: crossing in Brunswick whose road and stream tokens both appear in its names
            rtok = toks(road) + ([route] if route else []); stoks = list(itertools.chain(*[toks(n) for n in names if n]))
            hits = []
            for cid, row in B.iterrows():
                t = " ".join(str(row[c]) for c in ("road_carried", "feature_name", "nwm_name")).lower()
                if any(x in t for x in rtok) and any(x in t for x in stoks): hits.append((cid, row))
            if len(hits) == 1 and pid not in (2, 3, 20):
                cid, row = hits[0]; rec.update(method="M2 name-match", crossing_id=row.crossing_id, name_agrees="road+stream tokens")
                ll = gpd.GeoSeries([row.geometry], crs=M).to_crs(4326).iloc[0]
                dr = float(rr.geometry.distance(row.geometry).min()) if len(rr) else np.nan   # M2 has no intersection: log the crossing's distance to the named road instead
                rec.update(lon=round(ll.x, 6), lat=round(ll.y, 6), match_dist_m=round(dr, 1) if dr == dr else np.nan, note="M2: distance is crossing to nearest OSM way of the named road")
            else:
                rec["method"] = "unlocated"; rec["note"] = ("no OSM intersection of the named road and named feature" + (f"; {len(hits)} name-match candidates (ambiguous or none)" if hits else "; no name-match crossing")) if len(cand) == 0 else f"{len(cand)} OSM intersections but no crossing within {int(RADIUS)} m"
        if rec["crossing_id"]:
            s = snap.loc[rec["crossing_id"]]; rec["snap_seg"] = s.snap_seg; rec["hazard_threshold_ok"] = bool(s.hazard_threshold_ok)
        rows.append(rec); print(pid, road, route, "|", rec["stream"], "->", rec["method"], rec["crossing_id"], rec["match_dist_m"], rec["note"], flush=True)
    out = pd.DataFrame(rows)
    if not explore: out.to_csv("config/bcso_flood_points.csv", index=False); print("wrote config/bcso_flood_points.csv")
    return out


if __name__ == "__main__": main(explore=len(sys.argv) > 1 and sys.argv[1] == "explore")
