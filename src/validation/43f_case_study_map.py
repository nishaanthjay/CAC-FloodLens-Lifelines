"""Map for the /about case study: NC 211 bridge over Lockwoods Folly River (BCSO known flood point 10, crossing V2_0056) closed, with all other matched BCSO points also closed as in 43_bcso_islands.py.
Blocks shown = the 128 Census blocks this bridge alone slows by more than 1 minute (single_block_deltas.csv); colour = added minutes in the all-points-closed run (block_deltas.csv). Writes web/public/case-study-brunswick.png."""
import numpy as np, pandas as pd, geopandas as gpd, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
OUT = "data/phase2/bcso_islands/"; CID = "V2_0056"
S = pd.read_csv(OUT + "single_block_deltas.csv", dtype={"geoid20": "int64"}); S = S[S.crossing_id == CID]
BD = pd.read_csv(OUT + "block_deltas.csv", dtype={"geoid20": "int64"}).set_index("geoid20"); x = BD.loc[S.geoid20].reset_index()
seg = gpd.read_parquet("data/phase0/osm_roads.parquet").to_crs(4326); box = (-78.33, 33.89, -78.00, 34.05)   # OSM way geometry (the routing graph's segments are straight chords)
seg = seg.cx[box[0]:box[2], box[1]:box[3]]; major = seg[seg.highway.isin(["motorway", "trunk", "primary", "secondary", "motorway_link", "trunk_link", "primary_link"])]; seg = seg[seg.highway.isin(["tertiary", "residential", "unclassified"])]
C = gpd.read_parquet("data/phase0/crossings_v2.parquet"); b = C[C.crossing_id == CID].iloc[0]
fig, ax = plt.subplots(figsize=(11, 8), dpi=110); seg.plot(ax=ax, color="#dde1e6", lw=0.35); major.plot(ax=ax, color="#8c96a1", lw=1.4)
sc = ax.scatter(x.lon, x.lat, c=x.delta_ed_min, s=np.clip(x.pop20 / 4, 12, 160), cmap="YlOrRd", vmin=0, vmax=18, edgecolor="#333", linewidth=0.3, zorder=4)
cb = plt.colorbar(sc, ax=ax, shrink=0.65, pad=0.01); cb.set_label("added minutes to the nearest ER"); cb.ax.tick_params(labelsize=8)
ax.scatter([b.lon], [b.lat], marker="X", s=260, c="#0a50ff", edgecolor="w", linewidth=1.5, zorder=6); ax.annotate("NC 211 bridge over\nLockwoods Folly River (closed)", (b.lon, b.lat), xytext=(-150, 38), textcoords="offset points", fontsize=9.5, weight="bold", arrowprops=dict(arrowstyle="-", color="#0a50ff"))
for nm, lat, lon, off in (("Novant Health Brunswick\nMedical Center (nearest ER now)", 34.009978, -78.291465, (-165, -42)), ("J. Arthur Dosher Memorial\nHospital, Southport (ER after)", 33.928789, -78.022083, (-175, -18))):
    ax.scatter([lon], [lat], marker="P", s=170, c="#cc0000", edgecolor="w", zorder=6); ax.annotate(nm, (lon, lat), xytext=off, textcoords="offset points", fontsize=9, weight="bold")
ax.set_xlim(box[0], box[2]); ax.set_ylim(box[1], box[3]); ax.set_axis_off(); ax.set_aspect(1 / np.cos(np.radians(34)))
ax.text(0.01, 0.01, "Dot size = people in the block. Roads: OpenStreetMap. Scenario: roads only, no flow input.", transform=ax.transAxes, fontsize=8, color="#444")
fig.savefig("web/public/case-study-brunswick.png", bbox_inches="tight", dpi=100); print("ok")
