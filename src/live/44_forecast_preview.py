"""FORECAST preview (river), one command:  python src/live/44_forecast_preview.py   (selftest: ... selftest)   -> export/sample/forecast_latest.json
"NWM short-range forecast, unvalidated; river flow only." NOT a closure probability, not a validated forecast; no skill claimed. Not fed into any ML placeholder value.
Source: NOAA operational NWM short-range channel_rt, 18 hourly leads per cycle (AWS -> GCS -> NOMADS, the same fetcher as the hourly archiver, src/live/nwm_fc.py).
Crossings: every assessed crossing in route_crossings.json (reach + 2/5/10/25/50-year flows), not only the 33 shown in the replay table. Their reaches are not in the gauge archive (config/reaches.csv), so they are fetched directly for the latest cycle.
Compact format: top-level valid_times (18) and, per crossing, ratio_q10[18] (flow / 10-year flow, null = model had no value) and level[18 chars] (one digit per lead, index into levels = RL0 RL2 RL5 RL10 RL25 RL50, "-" = no value; same digits as the replay in route_crossings.json).
Cycle choice: newest cycle (starting 2 h before the current hour; f018 appears ~1h45 after issue) with ALL 18 leads on one source; if the newest is incomplete the previous complete cycle is used and the skipped ones are listed in "fallback".
RL10 scenario state: flow > the crossing's q10_cfs (crossings.json) -> "scenario: flagged". A scenario level, not a probability; "not flagged" is never an assurance.
ML hook: friend's ML outputs (ShreyasT-1/CAC-Flood-Risk-Model-Updated) are not in this repo; nothing is wired. Any future wiring must sit behind a flag with its own synthetic flag and validation status.
If everything fails the previous forecast_latest.json is left untouched and the exit code is 1; the Florence REPLAY files are independent."""
import sys, json
from datetime import datetime, timedelta, timezone
import numpy as np
LABEL = "NWM short-range forecast, unvalidated; river flow only"
MAX_BACK = 12   # cycles to walk back


LEVELS = ["RL0", "RL2", "RL5", "RL10", "RL25", "RL50"]


def level(f, q):
    """Digit of the highest recurrence flow strictly exceeded (q = [q2, q5, q10, q25, q50]); "-" when the model gave no value or no threshold."""
    if f is None or f != f or not q or any(v is None for v in q): return "-"
    return str(sum(f > v for v in q))


def build(cycle, df, crossings, fallback, now, version):
    """df: long frame feature_id, valid_time, lead_hours, streamflow_cfs for ONE complete cycle."""
    rows = []; vt = {int(l): t.strftime("%Y-%m-%dT%H:%MZ") for l, t in zip(df.lead_hours, df.valid_time)}
    leads = list(range(1, 19)); by = {k: g.set_index("lead_hours").streamflow_cfs for k, g in df.groupby("feature_id")}
    for c in crossings:
        s = by.get(c["nwm_feature_id"]); flows = [None if s is None or l not in s.index or s[l] != s[l] else float(s[l]) for l in leads]   # NaN / absent = model had no value; never filled
        q10 = c["q"][2]
        rows.append(dict(id=c["id"], name=c["name"], nwm_feature_id=c["nwm_feature_id"], q10_cfs=q10, in_model_output=any(f is not None for f in flows),
                         ratio_q10=[round(f / q10, 3) if f is not None and q10 else None for f in flows], level="".join(level(f, c["q"]) for f in flows)))
    age_h = round((now - cycle).total_seconds() / 3600, 1)
    return dict(sample=False, mode="FORECAST", label=LABEL, source=f"NOAA National Water Model operational short-range forecast ({version}), channel_rt, 18 hourly leads",
                caveats=["Unvalidated: no forecast skill is claimed for this layer.", "River flow only: no storm surge, tide, wave run-up, or rain/drainage flooding.", "Not a closure probability. 'Scenario: flagged' means modeled flow above the reach's 10-year flow; 'not flagged' is never an all-clear.", "The 10-year flows are recurrence flows of unverified provenance; the replay uses a different model version (v3.0 retrospective), so ratios are not directly comparable."], not_a_closure_probability=True, validated=False, river_flow_only=True, nwm_version=version,
                cycle_issue_time=cycle.strftime("%Y-%m-%dT%H:00Z"), cycle_age_hours=age_h, stale=age_h > 6, generated_at=now.strftime("%Y-%m-%dT%H:%MZ"), leads=18, fallback=fallback,
                scenario_rule="RL10: flow > q10_cfs of the crossing's reach => 'scenario: flagged'. A flow level, not a probability; excludes surge, tide, wave run-up, rain/drainage flooding.",
                ml=dict(enabled=False, reason="no ML outputs in this repo; any wiring needs its own synthetic flag and validation status"), levels=LEVELS, valid_times=[vt.get(l) for l in leads], crossings=rows)


def latest_complete(ids, now):
    import pandas as pd
    sys.path.insert(0, "src/live"); import nwm_fc
    top = now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=2); skipped = []
    for k in range(MAX_BACK):
        cyc = top - timedelta(hours=k); why = "lead 18 not available on any source"
        for s in ("aws", "gcs", "nomads"):
            last, ver, err = nwm_fc.fetch_lead(s, cyc, 18, ids, tries=2)   # f018 first: cheapest completeness probe
            if last is None: continue
            got = {18: last}; miss = []
            for f in range(1, 18):
                d, v, e = nwm_fc.fetch_lead(s, cyc, f, ids)
                if d is None: miss.append(f)
                else: got[f] = d
            if not miss: return cyc, pd.concat(got.values(), ignore_index=True), ver, skipped
            why = f"{s}: leads {miss} missing"
        skipped.append(dict(cycle=cyc.strftime("%Y-%m-%dT%HZ"), reason=why))
    return None, None, None, skipped


def run():
    now = datetime.now(timezone.utc); C = [dict(id=a["id"], name=a["name"], nwm_feature_id=a["reach"], q=a["q"]) for a in json.load(open("export/sample/route_crossings.json"))["assessed"]]
    ids = np.sort(np.unique([c["nwm_feature_id"] for c in C])).astype("int64")
    cyc, df, ver, skipped = latest_complete(ids, now)
    if cyc is None: print("no complete cycle in the last", MAX_BACK, "cycles; forecast_latest.json NOT updated:", skipped); sys.exit(1)
    fb = dict(used=bool(skipped), skipped_newer_cycles=skipped, note="newest cycle(s) incomplete; the previous complete cycle is shown" if skipped else "")
    doc = build(cyc, df, C, fb, now, ver); json.dump(doc, open("export/sample/forecast_latest.json", "w"), separators=(",", ":"))
    fl = sum(ch >= "3" and ch != "-" for c in doc["crossings"] for ch in c["level"])
    print("wrote export/sample/forecast_latest.json cycle", doc["cycle_issue_time"], "fallback" if fb["used"] else "newest", "| crossings", len(doc["crossings"]), "| flagged crossing-hours", fl)


def selftest():
    import pandas as pd
    cyc = datetime(2026, 10, 14, 12, tzinfo=timezone.utc); rows = [dict(feature_id=1, valid_time=pd.Timestamp(cyc + timedelta(hours=h)), lead_hours=h, streamflow_cfs=100.0 * h) for h in range(1, 19)]
    rows.append(dict(feature_id=2, valid_time=pd.Timestamp(cyc + timedelta(hours=1)), lead_hours=1, streamflow_cfs=float("nan")))
    Q = [100.0, 300.0, 500.0, 900.0, 1500.0]   # q2 q5 q10 q25 q50
    C = [dict(id="a", name="A", nwm_feature_id=1, q=Q), dict(id="b", name="B", nwm_feature_id=2, q=Q), dict(id="c", name="C", nwm_feature_id=3, q=Q)]
    d = build(cyc, pd.DataFrame(rows), C, dict(used=False), cyc + timedelta(hours=7), "NWM 3.1"); a, b, c = d["crossings"]
    assert d["mode"] == "FORECAST" and d["stale"] and d["cycle_age_hours"] == 7.0 and len(a["ratio_q10"]) == 18 == len(a["level"]) == len(d["valid_times"])
    # flow 100*h vs Q: h=1 -> 100 (not > 100) = 0; h=2 -> 200 = 1; h=3 -> 300 (not > 300) = 1; h=4 -> 400 = 2; h=5 -> 500 (not > 500) = 2; h=6 -> 600 = 3
    assert a["level"][:6] == "011223" and a["ratio_q10"][5] == 1.2 and a["ratio_q10"][4] == 1.0
    assert b["level"] == "-" * 18 and b["ratio_q10"][0] is None and b["in_model_output"] is False and c["in_model_output"] is False and c["level"] == "-" * 18
    print("selftest OK (synthetic fixture)")


if __name__ == "__main__": dict(selftest=selftest)[sys.argv[1]]() if len(sys.argv) > 1 else run()
