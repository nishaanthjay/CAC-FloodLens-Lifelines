"""Build export/sample/services.json: every emergency / critical-care service the website can route to (read-only on its inputs).
Run from the repo root (after fetch_services.py):  python src/pipeline/01_build_world/inventory/build_services.py
Kinds: hospital_ed (CMS ED list, pipeline), hospital (other hospitals, ED not confirmed), urgent_care, dialysis, nursing_home (incl. assisted living),
fire (pipeline list), ems, police, pharmacy. Dialysis / nursing homes / urgent care / police / pharmacies come from the federal and HHS facility lists
fetched by fetch_services.py (each entry carries its dataset label); OpenStreetMap (data/raw/nc.osm.pbf, Geofabrik) tops them up and is the only source
for EMS stations and non-ED hospitals. Every list is incomplete and can be out of date, and the site says so next to it. Phone numbers appear only where a source has one.
No shelter list: shelters are not mapped consistently and no official inventory is in the pipeline (stated in the site's known gaps)."""
import json, os, re, sys, math, datetime as dt
import pyogrio, pandas as pd

PBF = "data/raw/nc.osm.pbf"
BOX = (-78.75, 33.65, -77.45, 34.85)   # pilot box (lib/geocode.ts) plus ~0.1 deg so edge addresses still see the nearest service
OUT = "export/sample/services.json"
KM = lambda a, b: math.hypot((a[0] - b[0]) * 111.32 * math.cos(math.radians(a[1])), (a[1] - b[1]) * 110.57)
tag = lambda s, k: (m.group(1) if (m := re.search(r'"%s"=>"((?:[^"\\]|\\.)*)"' % re.escape(k), s if isinstance(s, str) else "")) else None)
DIAL = re.compile(r"dialysis|davita|fresenius|renal|kidney|nephrol", re.I)
URGENT = re.compile(r"urgent|walk-?in|immediate care|express care|prompt care|minute ?clinic", re.I)


def kind(t, name):
    """t: dict of the OSM tags we use -> service kind or None. Order matters: a dialysis clinic is not an urgent-care clinic."""
    a, h, sf, sp = t.get("amenity"), t.get("healthcare"), t.get("social_facility"), t.get("healthcare:speciality") or ""
    nm = name or ""
    if h == "dialysis" or "nephrology" in sp or (a in ("clinic", "doctors", "hospital") and DIAL.search(nm)): return "dialysis"
    if a == "hospital" or h == "hospital": return "hospital"
    if a == "nursing_home" or sf in ("nursing_home", "assisted_living") or h == "nursing_home": return "nursing_home"
    if a == "fire_station": return "fire"
    if a == "police": return "police"
    if t.get("emergency") == "ambulance_station" or a == "ambulance_station": return "ems"
    if h == "urgent_care" or "emergency" in sp or "urgent" in sp or (a in ("clinic", "doctors") and URGENT.search(nm)): return "urgent_care"
    if a == "pharmacy" or h == "pharmacy": return "pharmacy"
    return None


def read():
    rows = []
    for lay, where in (("points", "other_tags LIKE '%amenity%' OR other_tags LIKE '%healthcare%' OR other_tags LIKE '%emergency%' OR other_tags LIKE '%social_facility%'"),
                       ("multipolygons", "amenity IS NOT NULL OR other_tags LIKE '%healthcare%' OR other_tags LIKE '%\"emergency\"%' OR other_tags LIKE '%social_facility%'")):
        g = pyogrio.read_dataframe(PBF, layer=lay, bbox=BOX, where=where, use_arrow=False)
        print(lay, len(g), flush=True)
        if lay == "multipolygons": g["geometry"] = g.geometry.representative_point()
        for r in g.itertuples():
            o = r.other_tags; nm = r.name if isinstance(r.name, str) and r.name else None   # unnamed features read back as NaN
            t = {k: tag(o, k) for k in ("amenity", "healthcare", "social_facility", "healthcare:speciality", "emergency", "disused:amenity", "abandoned:amenity", "was:amenity")}
            if getattr(r, "amenity", None): t["amenity"] = r.amenity
            if any(t[k] for k in ("disused:amenity", "abandoned:amenity", "was:amenity")): continue
            if t.get("amenity") in ("clinic", "doctors") and not t.get("healthcare") and not URGENT.search(nm or "") and not DIAL.search(nm or ""): continue
            k = kind(t, nm)
            if not k: continue
            street = " ".join(x for x in (tag(o, "addr:housenumber"), tag(o, "addr:street")) if x)
            addr = ", ".join(x for x in (street, tag(o, "addr:city")) if x) or None
            rows.append(dict(kind=k, name=nm or tag(o, "operator") or None, lat=round(r.geometry.y, 5), lon=round(r.geometry.x, 5), phone=tag(o, "phone") or tag(o, "contact:phone"),
                             addr=addr, hours=tag(o, "opening_hours"), emergency=tag(o, "emergency"), beds=tag(o, "beds")))
    return pd.DataFrame(rows)


def dedupe(df, ref, kind_, within_km):
    """Drop OSM rows of `kind_` that sit within `within_km` of a pipeline-list facility (the curated list wins)."""
    if not len(ref): return df
    keep = [not (r.kind == kind_ and any(KM((r.lon, r.lat), (f["lon"], f["lat"])) < within_km for f in ref)) for r in df.itertuples()]
    return df[keep]


RAW = "data/raw_new/services/"
# key -> (kind, name field, address field, city field, phone field, status field, label)
FED = {
    "dialysis_open": ("dialysis", "FacilityName", "Address", "City", "Phone", "Status", "HIFLD Open, Sep 2025"),
    "dialysis_rx": ("dialysis", "Name", "Address", "City_Upper", "Phone", "Status", "HHS Rx Open, 2025"),
    "nursing_open": ("nursing_home", "FacilityName", "ADDRESS", "CITY", "TELEPHONE", "Status", "HIFLD Open, Sep 2025"),
    "urgent_care": ("urgent_care", "name", "address", "city", "telephone", "status", "HIFLD, Aug 2025"),
    "police": ("police", "NAME", "ADDRESS", "CITY", "TELEPHONE", "STATUS", "HIFLD, Aug 2025"),
    "pharmacy": ("pharmacy", "NAME", "ADDRESS", "CITY", "TELEPHONE", "STATUS", "HIFLD, 2019 snapshot (may be out of date)"),
}
SUB = {"NURSING HOME": "Nursing home", "ASSISTED LIVING": "Assisted living", "SHERIFF'S OFFICE": "Sheriff's office", "LOCAL POLICE DEPARTMENT": "Police department",
       "PRIMARY STATE AGENCY": "State agency (highway patrol)", "SPECIAL JURISDICTION": "Special jurisdiction police"}
nice = lambda v: v.title() if isinstance(v, str) and v.isupper() else v
clean = lambda v: v.strip() if isinstance(v, str) and v.strip() and v.strip().upper() not in ("NOT AVAILABLE", "NONE", "NULL") else None


def read_fed():
    """Federal / HHS layers fetched by fetch_services.py. Closed facilities are dropped; names and addresses are title-cased."""
    rows = []
    for key, (kind_, fn, fa, fc, fp, fs, label) in FED.items():
        path = RAW + key + ".json"
        if not os.path.exists(path): print("missing", path, "- run fetch_services.py first"); continue
        d = json.load(open(path, encoding="utf-8"))
        for f in d["features"]:
            p, g = f["properties"], f.get("geometry")
            if not g or str(p.get(fs) or "open").lower() in ("closed", "inactive", "not available"): continue
            street, city = clean(p.get(fa)), clean(p.get(fc))
            rows.append(dict(kind=kind_, name=nice(clean(p.get(fn))), lat=round(g["coordinates"][1], 5), lon=round(g["coordinates"][0], 5), phone=clean(p.get(fp)),
                             addr=", ".join(x for x in (nice(street), nice(city)) if x) or None, sub=SUB.get(str(p.get("FacilityType") or p.get("TYPE") or "").upper()),
                             src=label, hours=None))
    return pd.DataFrame(rows)


def merge(primary, extra, within_km=0.15):
    """Rows of `extra` are kept only when no same-kind row of `primary` is within `within_km`; a duplicate donates its phone to the primary row if that has none."""
    out = primary.to_dict("records")
    for r in extra.to_dict("records"):
        same_addr = lambda o: bool(o.get("addr")) and bool(r.get("addr")) and str(o["addr"]).lower() == str(r["addr"]).lower()   # two lists, one street address
        hit = next((o for o in out if o["kind"] == r["kind"] and (KM((o["lon"], o["lat"]), (r["lon"], r["lat"])) < within_km or same_addr(o))), None)
        if hit is None: out.append(r)
        elif not clean(hit.get("phone")) and clean(r.get("phone")): hit["phone"] = r["phone"]
    return pd.DataFrame(out)


def main():
    fac = json.load(open("export/sample/facilities.json", encoding="utf-8"))
    osm = read().assign(src="OpenStreetMap (volunteer data)", sub=None)
    # an ED hospital from the CMS list must not also appear as an unconfirmed OSM hospital
    osm = dedupe(osm, fac["hospitals"], "hospital", 0.4); osm = osm[osm.kind != "fire"]   # fire stations come only from the pipeline list (OSFM + OSM, already de-duplicated)
    osm = osm.drop_duplicates(["kind", "lat", "lon"]) if len(osm) else osm
    fed = read_fed()
    if len(fed): fed = merge(fed.iloc[:0], fed)   # collapses the HIFLD Open / Rx Open duplicates (same kind within 150 m or at the same address); first listed wins
    both = merge(fed, osm) if len(fed) else osm
    items = [dict(k="hospital_ed", name=h["name"], lat=h["lat"], lon=h["lon"], sub=f"{h['type'].replace(' Hospitals', '')} · {h['county']} County", src="CMS ED list") for h in fac["hospitals"]]
    # The CMS list has no phone numbers: borrow one from the HIFLD hospital mirror (data/raw_new/hifld_hospitals_mirror, 2021 snapshot) when a hospital sits within 500 m.
    mirror = "data/raw_new/hifld_hospitals_mirror/hifld_hospitals_mirror_NC_2021snapshot.parquet"
    if os.path.exists(mirror):
        hm = pd.read_parquet(mirror, columns=["NAME", "TELEPHONE", "LATITUDE", "LONGITUDE", "STATUS"])
        for d in items:
            near = [(KM((d["lon"], d["lat"]), (m.LONGITUDE, m.LATITUDE)), m) for m in hm.itertuples() if str(m.STATUS).upper() != "CLOSED" and clean(m.TELEPHONE)]
            near = [x for x in near if x[0] < 0.5]
            if near: d["phone"] = clean(min(near, key=lambda x: x[0])[1].TELEPHONE); d["src"] = "CMS ED list; phone from HIFLD 2021 snapshot"
    items += [dict(k="fire", name=f["name"], lat=f["lat"], lon=f["lon"], sub="Fire station", src="NC OSFM + OSM") for f in fac["fire_stations"]]
    unnamed = {"hospital": "Hospital", "urgent_care": "Urgent care", "dialysis": "Dialysis centre", "nursing_home": "Nursing home", "police": "Police / sheriff", "ems": "EMS station", "pharmacy": "Pharmacy"}
    for r in both.itertuples():
        d = dict(k=r.kind, name=(r.name if isinstance(r.name, str) else None) or f"{unnamed[r.kind]} (unnamed in source)", lat=r.lat, lon=r.lon, src=r.src)
        for a, b in (("phone", r.phone), ("addr", r.addr), ("hours", r.hours), ("sub", r.sub)):
            if isinstance(b, str) and b: d[a] = b
        if r.kind == "hospital": d.setdefault("sub", "Hospital, emergency department not confirmed")
        items.append(d)
    for i, d in enumerate(items): d["id"] = f"{d['k'][:2].upper()}{i:04d}"
    counts = pd.Series([d["k"] for d in items]).value_counts().to_dict()
    doc = dict(generated_at=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), osm_extract="Geofabrik NC extract, data/raw/nc.osm.pbf (read 2026-10-09)",
               counts=counts, caveats=["Hospitals with an emergency department and fire stations come from the pipeline's lists. Dialysis, nursing homes, urgent care, police and pharmacies come from federal / HHS facility lists (dated per entry), topped up with OpenStreetMap; EMS stations and other hospitals are OpenStreetMap only.",
               "Lists are incomplete and can be out of date: a place may have closed, moved or changed hours. A listing is not a statement that it is open, staffed or reachable. Call ahead; call 911 in an emergency.",
               "No shelter list: no official inventory is in the pipeline."], items=items)
    json.dump(doc, open(OUT, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    print(counts, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    os.chdir(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))
    main()
