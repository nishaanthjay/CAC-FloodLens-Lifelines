"""Visual check of the georeferenced BCSO service islands against the road graph (protocol I, section C). Draws polygons, graph segments, matched BCSO points. Check can only reject the georeference."""
import numpy as np, pandas as pd, geopandas as gpd, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
CRS = "EPSG:2264"; OUT = "data/phase2/bcso_islands/"
I = gpd.read_parquet(OUT + "islands_2264.parquet"); S = gpd.read_parquet("data/phase1b/graph_segments.parquet").to_crs(CRS)
cnt = gpd.read_file("data/phase0/counties.geojson").to_crs(CRS); B = cnt[cnt.COUNTYFP == "019"]
P = pd.read_csv("config/bcso_flood_points.csv"); P = P[P.crossing_id.notna() & (P.crossing_id != "")]
C = gpd.read_parquet("data/phase0/crossings_v2.parquet").to_crs(CRS).set_index("crossing_id"); P = P.assign(geometry=[C.geometry[c] for c in P.crossing_id]); P = gpd.GeoDataFrame(P, geometry="geometry", crs=CRS)
fig, ax = plt.subplots(figsize=(13, 10)); cols = dict(zip(I.island, ["#f9b4cc", "#b9cdf5", "#a9f0c5", "#f7ecaa", "#f7bea4", "#eaa0f3"]))
for _, r in I.iterrows(): gpd.GeoSeries([r.geometry], crs=CRS).plot(ax=ax, color=cols[r.island], edgecolor="#555", lw=0.8, alpha=0.75)
S[S.within(B.geometry.union_all().buffer(3000))].plot(ax=ax, color="#333", lw=0.25); B.boundary.plot(ax=ax, color="k", lw=1)
P.plot(ax=ax, color="red", markersize=45, edgecolor="k", zorder=5)
for _, r in P.iterrows(): ax.annotate(str(r.id), (r.geometry.x, r.geometry.y), xytext=(4, 4), textcoords="offset points", fontsize=9, weight="bold")
for _, r in I.iterrows(): c = r.geometry.representative_point(); ax.annotate(r.island, (c.x, c.y), ha="center", fontsize=10, weight="bold", color="#222")
ax.set_axis_off(); ax.set_title("BCSO service islands (georeferenced, RMSE 31 m) over the road graph; red = matched BCSO known flood points"); fig.savefig(OUT + "island_overlay.png", dpi=110, bbox_inches="tight")
