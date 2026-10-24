"""Post-hoc description (not a protocol test): what each matched BCSO point does when it is the ONLY crossing closed. Same engine, graph, blocks and islands as 43_bcso_islands.py.
Output: data/phase2/bcso_islands/single_closures.csv (one row per matched crossing) and single_block_deltas.csv (blocks slowed by more than 1 minute, with the closing crossing)."""
import importlib.util, numpy as np, pandas as pd, geopandas as gpd
spec = importlib.util.spec_from_file_location("b", "src/validation/43_bcso_islands.py"); b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
OUT = "data/phase2/bcso_islands/"; E = b.load_engine(); net = E.Net(); sets, org, fac = E.inputs(); org = org[org.county == "Brunswick"].reset_index(drop=True); onode = org.node.values; pop = org.pop20.values.astype(float)
ed, fi = list(map(int, fac["hospital_ED_acute"]["nodes"])), list(map(int, fac["fire_station"]["nodes"])); b_ed = E.solve(net, set(), ed, 0)[0][onode]; b_fi = E.solve(net, set(), fi, 0)[0][onode]; ok = np.isfinite(b_ed) & np.isfinite(b_fi) & (pop > 0)
P = pd.read_csv("config/bcso_flood_points.csv"); P = P[P.crossing_id.notna() & (P.crossing_id.astype(str) != "")]
snap = pd.read_parquet("data/phase1b/crossing_snap.parquet").set_index("crossing_id"); rank = pd.read_csv("data/export/consequence_ranking.csv").set_index("id")
rows, blocks = [], []
for cid, g in P.groupby("crossing_id"):
    seg = int(snap.loc[cid, "snap_seg"]); de = b.target_delta(E, net, {seg}, onode, ed, b_ed); df = b.target_delta(E, net, {seg}, onode, fi, b_fi)
    sl = ok & np.isfinite(de) & (de > 1); lost = ok & ~np.isfinite(de)
    rows.append(dict(crossing_id=cid, legend_points=",".join(map(str, g.id)), road=g.road.iloc[0], stream=g.stream.iloc[0], snap_seg=seg, ranking_people_affected=rank.loc[cid, "people_affected"], pop_slowed_gt1min_ed=int(pop[sl].sum()), blocks_slowed_ed=int(sl.sum()),
                     pop_lost_ed=int(pop[lost].sum()), max_added_min_ed=float(np.nanmax(np.where(np.isfinite(de) & ok, de, np.nan))), pop_slowed_gt1min_fire=int(pop[ok & np.isfinite(df) & (df > 1)].sum())))
    for i in np.where(sl)[0]: blocks.append(dict(crossing_id=cid, geoid20=org.geoid20[i], pop20=int(pop[i]), base_ed_min=b_ed[i] / 60, added_ed_min=de[i], lon=org.lon[i], lat=org.lat[i]))
pd.DataFrame(rows).sort_values("pop_slowed_gt1min_ed", ascending=False).to_csv(OUT + "single_closures.csv", index=False); pd.DataFrame(blocks).to_csv(OUT + "single_block_deltas.csv", index=False)
print(pd.DataFrame(rows).sort_values("pop_slowed_gt1min_ed", ascending=False).to_string())
