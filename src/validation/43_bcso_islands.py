"""Protocol I (docs/validation_protocol_bcso_islands.md): do the BCSO 2018 known flood points and service islands agree with the crossing -> route-impact mechanism?
No NWM / recurrence-flow / hazard input anywhere: closures are the BCSO points (or random crossings for the baseline). ONE run; thresholds, radii, seeds and sets are fixed by the protocol.
Run from the repo root:  python src/validation/43_bcso_islands.py   (I2 first, then I1)    Outputs: data/phase2/bcso_islands/ and results.json"""
import sys, os, json, time, hashlib, importlib.util, numpy as np, pandas as pd, geopandas as gpd
from scipy.stats import rankdata
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components
CRS = "EPSG:2264"; OUT = "data/phase2/bcso_islands/"; SEED = 20261024; SEED_BASE = 20261025; NBOOT = 2000; NPAIRS = 200000; MIN_BLOCKS = 10
PROTOCOL = "docs/validation_protocol_bcso_islands.md"


def load_engine():
    spec = importlib.util.spec_from_file_location("engine2", "src/pipeline/02_routing/engine2.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m


def auc(pos, ctl):
    """P(pos > ctl) + 0.5 P(tie) by mid-ranks."""
    x = np.r_[pos, ctl]; r = rankdata(x); n1, n0 = len(pos), len(ctl)
    return float((r[:n1].sum() - n1 * (n1 + 1) / 2) / (n1 * n0))


def wauc(inv, cross, w):
    """Weighted AUC of cross-island (cross=1) over same-island (cross=0) separations; `inv` indexes the sorted unique separation values."""
    k = inv.max() + 1; wc = np.bincount(inv, weights=w * cross, minlength=k); ws = np.bincount(inv, weights=w * (1 - cross), minlength=k)
    den = wc.sum() * ws.sum()
    return float((wc * (np.cumsum(ws) - ws + 0.5 * ws)).sum() / den) if den > 0 else np.nan


def ci(x): x = np.array(x, float); x = x[~np.isnan(x)]; return [float(np.percentile(x, 2.5)), float(np.percentile(x, 97.5)), int(len(x))]


def i2(rank, cl, P_ids, rng, label):
    """Ranking test. Unit = assessed Brunswick crossing; positives = matched points' crossings; bootstrap clusters = graph_segment_id."""
    d = rank.assign(pos=rank.id.isin(P_ids)); a = auc(d.people_affected[d.pos].values, d.people_affected[~d.pos].values)
    groups = [g for _, g in d.groupby("graph_segment_id")]; vals = [g.people_affected.values for g in groups]; flags = [g.pos.values for g in groups]; bs = []
    for _ in range(NBOOT):
        pick = rng.integers(0, len(groups), len(groups)); v = np.concatenate([vals[i] for i in pick]); f = np.concatenate([flags[i] for i in pick])
        bs.append(auc(v[f], v[~f]) if f.any() and (~f).any() else np.nan)
    lo, hi, n = ci(bs)
    return dict(label=label, n_pos=int(d.pos.sum()), n_ctl=int((~d.pos).sum()), auc=a, ci95=[lo, hi], n_valid_resamples=n, pass_=bool(lo > 0.5), pos_people_affected=sorted(d.people_affected[d.pos].astype(int).tolist(), reverse=True),
                median_ctl=float(d.people_affected[~d.pos].median()), median_pos=float(d.people_affected[d.pos].median()))


def target_delta(E, net, closed, org_nodes, fnodes, base):
    """Added minutes to the nearest target for each origin after closing `closed`; inf when no path remains."""
    d, _, _ = E.solve(net, closed, fnodes, 0); t = d[org_nodes]; return np.where(np.isfinite(t), (t - base) / 60.0, np.inf)


def separation(delta_i, delta_j):
    li, lj = ~np.isfinite(delta_i), ~np.isfinite(delta_j)
    with np.errstate(invalid="ignore"): s = np.abs(np.where(li, 0, delta_i) - np.where(lj, 0, delta_j))
    return np.where(li != lj, np.inf, np.where(li & lj, 0.0, s))


def pair_sep(D_ed, D_fire, a, b): return np.maximum(separation(D_ed[a], D_ed[b]), separation(D_fire[a], D_fire[b]))


def main():
    t0 = time.time(); os.makedirs(OUT, exist_ok=True); res = dict(protocol=PROTOCOL, protocol_sha256=hashlib.sha256(open(PROTOCOL, "rb").read()).hexdigest(), seed=SEED, seed_baseline=SEED_BASE)
    print("protocol sha256", res["protocol_sha256"])
    cnt = gpd.read_file("data/phase0/counties.geojson").to_crs(CRS); bpoly = cnt[cnt.COUNTYFP == "019"].geometry.union_all()
    C = gpd.read_parquet("data/phase0/crossings_v2.parquet").to_crs(CRS); C["brunswick"] = C.within(bpoly)
    snap = pd.read_parquet("data/phase1b/crossing_snap.parquet")[["crossing_id", "snap_seg"]]; C = C.merge(snap, on="crossing_id", how="left")
    rank = pd.read_csv("data/export/consequence_ranking.csv"); R = rank.merge(C[["crossing_id", "brunswick", "snap_seg"]], left_on="id", right_on="crossing_id")
    A = R[(R.consequence_status == "assessed") & R.brunswick].copy()
    P = pd.read_csv("config/bcso_flood_points.csv"); located = P[P.crossing_id.notna() & (P.crossing_id.astype(str) != "")]
    m1 = located[located.method.str.startswith("M1")]
    res["coverage"] = dict(legend_points=int(len(P)), matched_points=int(len(located)), matched_M1=int(len(m1)), matched_M2=int(len(located) - len(m1)), unmatched=P[~P.index.isin(located.index)][["id", "road", "stream", "note"]].to_dict("records"),
                           unique_matched_crossings=int(located.crossing_id.nunique()), assessed_brunswick_crossings=int(len(A)), matched_and_assessed=int(A.id.isin(located.crossing_id).sum()),
                           matched_not_assessed=sorted(set(located.crossing_id) - set(A.id)), brunswick_crossings=int(C.brunswick.sum()))
    rng = np.random.default_rng(SEED)
    # ---------------- I2
    res["I2"] = i2(A, C, set(located.crossing_id), rng, "primary: all matched points"); res["I2_M1_only"] = i2(A, C, set(m1.crossing_id), np.random.default_rng(SEED), "secondary: M1-matched points only")
    print("I2", {k: res["I2"][k] for k in ("n_pos", "n_ctl", "auc", "ci95", "pass_")}, flush=True)
    # ---------------- I1
    E = load_engine(); net = E.Net(); sets, org, fac = E.inputs(); org = org[org.county == "Brunswick"].reset_index(drop=True); onode = org.node.values; pop = org.pop20.values.astype(float)
    ed_nodes = list(map(int, fac["hospital_ED_acute"]["nodes"])); fi_nodes = list(map(int, fac["fire_station"]["nodes"]))
    d_ed0, _, _ = E.solve(net, set(), ed_nodes, 0); d_fi0, _, _ = E.solve(net, set(), fi_nodes, 0); b_ed, b_fi = d_ed0[onode], d_fi0[onode]
    ok = np.isfinite(b_ed) & np.isfinite(b_fi) & (pop > 0)
    segs_of = lambda ids: sorted({int(s) for s in C[C.crossing_id.isin(ids)].snap_seg.dropna().unique()})
    closed = set(segs_of(set(located.crossing_id))); res["I1_closed_segments"] = len(closed)
    res["coverage"]["matched_with_closable_segment"] = int(C[C.crossing_id.isin(located.crossing_id)].snap_seg.notna().sum())
    islands = gpd.read_parquet(OUT + "islands_2264.parquet"); Bk = gpd.GeoDataFrame(org[["geoid20", "pop20", "lon", "lat"]].copy(), geometry=gpd.points_from_xy(org.lon, org.lat), crs=4326).to_crs(CRS)
    j = gpd.sjoin(Bk, islands[["island", "geometry"]], how="left", predicate="within"); j = j[~j.index.duplicated()]; org["island"] = j.island.values
    cnts = org[ok].groupby("island").size(); keep = cnts[cnts >= MIN_BLOCKS].index.tolist()
    res["I1_islands"] = dict(blocks_per_island=cnts.to_dict(), kept=keep, excluded_small=[i for i in cnts.index if i not in keep], blocks_outside_islands=int((org.island.isna() & ok).sum()), brunswick_blocks=int(len(org)), usable_blocks=int(ok.sum()))
    use = ok & org.island.isin(keep).values; idx = np.where(use)[0]
    delta_ed = target_delta(E, net, closed, onode, ed_nodes, b_ed); delta_fi = target_delta(E, net, closed, onode, fi_nodes, b_fi)
    # connected components (undirected) of the road graph after closure, and of the baseline graph, for each block's node
    def comps(cl):
        k = ~np.isin(net.arc_s, list(cl)) if cl else np.ones(len(net.arc_s), bool); M = csr_matrix((np.ones(k.sum()), (net.arc_a[k], net.arc_b[k])), shape=(net.n, net.n)); return connected_components(M, directed=False)[1]
    cc0, cc1 = comps(set()), comps(closed); sz1 = np.bincount(cc1)
    BD = org.assign(base_ed_min=b_ed / 60, base_fire_min=b_fi / 60, delta_ed_min=delta_ed, delta_fire_min=delta_fi, lost_ed=~np.isfinite(delta_ed) & np.isfinite(b_ed), lost_fire=~np.isfinite(delta_fi) & np.isfinite(b_fi), used_in_pairs=use,
                    comp_closed=cc1[onode], comp_baseline=cc0[onode], comp_closed_size_nodes=sz1[cc1[onode]])
    BD.drop(columns=["index_right", "node", "snap_m"], errors="ignore").to_csv(OUT + "block_deltas.csv", index=False)
    comp = BD[use].groupby(["island", "comp_closed"]).agg(blocks=("geoid20", "size"), pop=("pop20", "sum"), comp_nodes=("comp_closed_size_nodes", "first")).reset_index().sort_values("pop", ascending=False); comp.to_csv(OUT + "components.csv", index=False)
    # pairs: probability proportional to population, 200,000 draws, fixed seed
    prng = np.random.default_rng(SEED); p = pop[idx] / pop[idx].sum(); a = idx[prng.choice(len(idx), NPAIRS, p=p)]; b = idx[prng.choice(len(idx), NPAIRS, p=p)]; v = a != b; a, b = a[v], b[v]
    isl = org.island.values; cross = (isl[a] != isl[b]).astype(float); kmap = {k: i for i, k in enumerate(keep)}; ia = np.array([kmap[x] for x in isl[a]]); ib = np.array([kmap[x] for x in isl[b]])
    sep = pair_sep(delta_ed, delta_fi, a, b); uv, inv = np.unique(sep, return_inverse=True); a_real = wauc(inv, cross, np.ones(len(a)))
    brng = np.random.default_rng(SEED); bs = []
    for _ in range(NBOOT):
        m = np.bincount(brng.integers(0, len(keep), len(keep)), minlength=len(keep)); bs.append(wauc(inv, cross, (m[ia] * m[ib]).astype(float)))
    lo, hi, nv = ci(bs)
    ed_only = wauc(np.unique(separation(delta_ed[a], delta_ed[b]), return_inverse=True)[1], cross, np.ones(len(a))); fi_only = wauc(np.unique(separation(delta_fi[a], delta_fi[b]), return_inverse=True)[1], cross, np.ones(len(a)))
    fin = lambda x: x[np.isfinite(x)]
    res["I1"] = dict(auc=a_real, ci95=[lo, hi], n_valid_resamples=nv, pass_=bool(lo > 0.5), n_pairs=int(len(a)), n_cross=int(cross.sum()), n_same=int((1 - cross).sum()), frac_pairs_with_break=float(np.isinf(sep).mean()), auc_ed_only=ed_only, auc_fire_only=fi_only,
                     people=dict(lost_ed=int(pop[BD.lost_ed.values].sum()), lost_fire=int(pop[BD.lost_fire.values].sum()), blocks_lost_ed=int(BD.lost_ed.sum()), blocks_lost_fire=int(BD.lost_fire.sum()),
                                 delta_ed_min=dict(median=float(np.median(fin(delta_ed[ok]))), p90=float(np.percentile(fin(delta_ed[ok]), 90)), max=float(fin(delta_ed[ok]).max())),
                                 delta_fire_min=dict(median=float(np.median(fin(delta_fi[ok]))), p90=float(np.percentile(fin(delta_fi[ok]), 90)), max=float(fin(delta_fi[ok]).max())),
                                 slowed_gt1min_ed_pop=int(pop[ok & np.isfinite(delta_ed) & (delta_ed > 1)].sum()), slowed_gt1min_fire_pop=int(pop[ok & np.isfinite(delta_fi) & (delta_fi > 1)].sum())))
    print("I1", {k: res["I1"][k] for k in ("auc", "ci95", "pass_", "n_pairs")}, round(time.time() - t0), "s", flush=True)
    # secondary: M1-only closures (point estimate and CI, same pairs)
    cl1 = set(segs_of(set(m1.crossing_id))); de1 = target_delta(E, net, cl1, onode, ed_nodes, b_ed); df1 = target_delta(E, net, cl1, onode, fi_nodes, b_fi); sp1 = pair_sep(de1, df1, a, b); inv1 = np.unique(sp1, return_inverse=True)[1]
    brng = np.random.default_rng(SEED); bs1 = [wauc(inv1, cross, ((lambda m: m[ia] * m[ib])(np.bincount(brng.integers(0, len(keep), len(keep)), minlength=len(keep)))).astype(float)) for _ in range(NBOOT)]
    res["I1_M1_only"] = dict(auc=wauc(inv1, cross, np.ones(len(a))), ci95=ci(bs1)[:2], closed_segments=len(cl1))
    # random-closure baseline: 200 draws of 20 assessed Brunswick crossings (same pairs, same islands)
    pool = A.snap_seg.dropna().astype(int).unique(); brng = np.random.default_rng(SEED_BASE); rand = []
    for k in range(200):
        cl = set(map(int, brng.choice(pool, 20, replace=False))); de = target_delta(E, net, cl, onode, ed_nodes, b_ed); df = target_delta(E, net, cl, onode, fi_nodes, b_fi)
        rand.append(wauc(np.unique(pair_sep(de, df, a, b), return_inverse=True)[1], cross, np.ones(len(a))))
        if k % 40 == 39: print("baseline", k + 1, round(time.time() - t0), "s", flush=True)
    rand = np.array(rand); res["baseline"] = dict(draws=200, size=20, median=float(np.nanmedian(rand)), p5=float(np.nanpercentile(rand, 5)), p95=float(np.nanpercentile(rand, 95)), real_auc=a_real,
                                                   percentile_of_real=float(np.mean(rand[~np.isnan(rand)] <= a_real)), p_one_sided=float((1 + np.sum(rand >= a_real)) / 201), n_nan=int(np.isnan(rand).sum()))
    json.dump(res, open(OUT + "results.json", "w"), indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)); print(json.dumps({k: res[k] for k in ("I2", "I1", "baseline")}, indent=1, default=str)[:3000])
    make_map(BD, islands, closed, C, located)


def make_map(BD, islands, closed, C, located):
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(13, 10)); islands.boundary.plot(ax=ax, color="#333", lw=1.2)
    for _, r in islands.iterrows(): c = r.geometry.representative_point(); ax.annotate(r.island, (c.x, c.y), ha="center", fontsize=10, color="#555", weight="bold")
    g = gpd.GeoDataFrame(BD, geometry=gpd.points_from_xy(BD.lon, BD.lat), crs=4326).to_crs(CRS); g = g[g.used_in_pairs]; lost = g.lost_ed | g.lost_fire
    val = np.where(np.isfinite(g.delta_ed_min), g.delta_ed_min, np.nan); ok = g[~lost & (g.delta_ed_min <= 1)]; sl = g[~lost & (g.delta_ed_min > 1)]
    ax.scatter(ok.geometry.x, ok.geometry.y, s=3, c="#cfd8e3", label="added <= 1 min"); sc = ax.scatter(sl.geometry.x, sl.geometry.y, s=9, c=sl.delta_ed_min, cmap="YlOrRd", vmax=max(10, float(np.nanpercentile(sl.delta_ed_min, 95))), label="slowed")
    ax.scatter(g[lost].geometry.x, g[lost].geometry.y, s=14, c="k", label="no route after closure"); plt.colorbar(sc, ax=ax, shrink=0.6, label="added minutes to nearest ED hospital")
    pts = C[C.crossing_id.isin(located.crossing_id)]; ax.scatter(pts.geometry.x, pts.geometry.y, s=90, marker="X", c="#0a50ff", edgecolor="w", zorder=5, label="closed BCSO point")
    ax.set_axis_off(); ax.legend(loc="lower left"); ax.set_title("All matched BCSO known flood points closed at once: added minutes to nearest ED hospital (Brunswick Census blocks)"); fig.savefig(OUT + "bcso_islands_map.png", dpi=110, bbox_inches="tight")


if __name__ == "__main__": main()
