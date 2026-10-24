"""Georeference the BCSO "Flood Event Service Islands" wall map and polygonize its fills (protocol I, section C).
GCPs are road intersections found on the 150 dpi render by eye (crops of 120 px, +-3 px) at positions predicted by a coarse bridge-marker fit (43b), paired with the same intersection computed from the
OSM road graph (EPSG:2264 feet, mean of the carriageway crossings). 6 GCPs fit a least-squares affine; 1 further intersection (B) is held out as a check point. Accepted only if GCP RMSE <= 100 m.
gdalwarp is not installed here, so the 150 dpi raster is not resampled: the fitted affine is the raster's geotransform and the polygons are traced from the raster pixels, then mapped.
Reads no flow, hazard or consequence data. Usage: python src/validation/43c_georef.py"""
import json, numpy as np, pandas as pd, geopandas as gpd, pymupdf, rasterio
from PIL import Image
from rasterio.features import shapes
from rasterio.transform import Affine
from scipy import ndimage as ndi
from shapely.geometry import shape
from shapely.ops import unary_union
PDF = "data/bcso_florence/wallmaps_flood_islands.pdf"; DPI = 150; OUT = "data/phase2/bcso_islands/"; CRS = "EPSG:2264"; FT = 0.3048
# name, pixel (x, y) on the 150 dpi render, OSM intersection (x, y) in EPSG:2264 feet
GCP = [("A US17 x NC904", (2044.5, 4259.6), (2150990, 71890)), ("C US17 x NC211", (3923.8, 3548.4), (2220275, 98076)), ("E US17 x NC87", (5370.2, 2400.0), (2273345, 140530)),
       ("F US17 x NC133", (6198.8, 1405.1), (2304040, 177063)), ("G NC179 x NC904", (2551.6, 4673.8), (2169539, 56483)), ("H NC211 x NC133", (5763.2, 4169.6), (2287996, 75233))]
CHECK = [("B US17 x NC130", (2845.0, 3961.3), (2180461, 82927))]
LEGEND_PX = {"Calabash": (272, 1432), "Leland": (272, 1492), "Royal Oak (sub-island)": (272, 1552), "Shallotte": (272, 1612), "Smithville": (272, 1672), "Town Creek": (272, 1732)}
BASE = {"water": (153, 217, 240), "white": (255, 255, 255)}


def fit(G):
    A = np.array([[p[0], p[1], 1] for _, p, _ in G]); X = np.array([w[0] for *_, w in G]); Y = np.array([w[1] for *_, w in G])
    cx = np.linalg.lstsq(A, X, rcond=None)[0]; cy = np.linalg.lstsq(A, Y, rcond=None)[0]; return Affine(cx[0], cx[1], cx[2], cy[0], cy[1], cy[2])


def resid_m(T, G):
    return [float(np.hypot(*(np.array(T * p) - np.array(w))) * FT) for _, p, w in G]


def main():
    import os; os.makedirs(OUT, exist_ok=True)
    img = np.array(Image.open("data/derived/bcso_render/islands_150.png").convert("RGB")) if os.path.exists("data/derived/bcso_render/islands_150.png") else None
    if img is None:
        pix = pymupdf.open(PDF)[0].get_pixmap(dpi=DPI); img = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3)
    T = fit(GCP); r = resid_m(T, GCP); rc = resid_m(T, CHECK); rmse = float(np.sqrt(np.mean(np.square(r))))
    rot = float(np.degrees(np.arctan2(T.b, T.a))); sx = float(np.hypot(T.a, T.d)); sy = float(np.hypot(T.b, T.e))
    info = dict(gcp_rmse_m=rmse, gcp_residuals_m={g[0]: round(v, 1) for g, v in zip(GCP, r)}, check_residual_m={g[0]: round(v, 1) for g, v in zip(CHECK, rc)}, ft_per_px=(sx, sy), shear_deg=rot, affine=list(T)[:6], accepted=rmse <= 100.0)
    print(json.dumps(info, indent=1)); json.dump(info, open(OUT + "georef.json", "w"), indent=1)
    if not info["accepted"]: raise SystemExit("georeference RMSE above 100 m: island test not run (protocol I section C)")
    # legend swatch colours -> classes; the map interior is checked against them
    cols = {k: tuple(int(v) for v in np.median(img[y - 4:y + 5, x - 4:x + 5].reshape(-1, 3), axis=0)) for k, (x, y) in LEGEND_PX.items()}; print("legend colours", cols)
    names = list(cols) + list(BASE); C = np.array(list(cols.values()) + list(BASE.values()), float)
    flat = img.reshape(-1, 3).astype(float); d = np.sqrt(((flat[:, None, :] - C[None, :, :]) ** 2).sum(-1)); lab = d.argmin(1); lab[d.min(1) > 14] = -1; lab = lab.reshape(img.shape[:2])
    # roads, text and outlines are unlabelled: give them the nearest class within 14 px
    dist, (iy, ix) = ndi.distance_transform_edt(lab == -1, return_indices=True); fill = lab[iy, ix]; fill[dist > 14] = -1
    px_area_km2 = abs(T.a * T.e - T.b * T.d) * FT * FT / 1e6; polys = []
    for k, nm in enumerate(list(cols)):
        m = (fill == k).astype(np.uint8); m = ndi.binary_opening(m, np.ones((5, 5))).astype(np.uint8)
        for g, v in shapes(m, mask=m.astype(bool), transform=T):
            geom = shape(g)
            if geom.area * FT * FT / 1e6 >= 0.25: polys.append((nm, geom))
    G = gpd.GeoDataFrame(pd.DataFrame(dict(island=[p[0] for p in polys])), geometry=[p[1] for p in polys], crs=CRS)
    cnt = gpd.read_file("data/phase0/counties.geojson").to_crs(CRS); G = G.clip(cnt[cnt.COUNTYFP == "019"].geometry.union_all().buffer(1500))   # drops the legend swatches, which sit outside the county
    G = G.dissolve("island").reset_index(); G["area_km2"] = G.geometry.area * FT * FT / 1e6; G["legend_rgb"] = G.island.map(lambda n: "%d,%d,%d" % cols[n])
    G = G.assign(geometry=G.geometry.simplify(40))   # 40 ft tolerance, about 4 px at 150 dpi
    os.makedirs("data/derived", exist_ok=True); G.to_crs(4326).to_file("data/derived/bcso_service_islands.geojson", driver="GeoJSON"); print(G[["island", "area_km2"]])
    G.to_crs(CRS).to_parquet(OUT + "islands_2264.parquet")


if __name__ == "__main__": main()
