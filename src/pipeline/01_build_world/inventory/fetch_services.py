"""Fetch emergency / critical-care service layers for the pilot box from public ArcGIS feature services (FEMA-hosted copies of the
HHS/HIFLD Open datasets) into data/raw_new/services/<key>.json (GeoJSON, as served, plus fetched_utc). Run from the repo root:
  python src/pipeline/01_build_world/inventory/fetch_services.py
No key needed. Re-run to refresh; build_services.py reads these files. Dataset dates are printed (layer lastEditDate) and kept in the file."""
import json, os, sys, datetime as dt
import requests

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
BASE = "https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/"
BOX = "-78.75,33.65,-77.45,34.85"   # same box as build_services.py
LAYERS = {   # key -> (service, layer id)
    "dialysis_open": ("Open_DialysisCenters", 20),            # HIFLD Open re-issue, Sep 2025, QA notes
    "dialysis_rx": ("RXopen_040623_Dialysis_Centers", 36),    # HHS Rx Open list, Apr 2023, has phone
    "nursing_open": ("Open_NursingHomes", 30),                # HIFLD Open re-issue, Sep 2025
    "urgent_care": ("Urgent_Care_Facilities_RAPT", 11),
    "police": ("Local_Law_Enforcement_Locations_RAPT", None),
    "pharmacy": ("Pharmacies", None),
}


def layer_id(svc):
    j = requests.get(f"{BASE}{svc}/FeatureServer", params={"f": "json"}, timeout=40).json()
    return j["layers"][0]["id"]


def main():
    out = os.path.join(ROOT, "data", "raw_new", "services"); os.makedirs(out, exist_ok=True)
    for key, (svc, lid) in LAYERS.items():
        lid = layer_id(svc) if lid is None else lid
        url = f"{BASE}{svc}/FeatureServer/{lid}"
        meta = requests.get(url, params={"f": "json"}, timeout=40).json()
        feats, off = [], 0
        while True:
            r = requests.get(url + "/query", params={"where": "1=1", "geometry": BOX, "geometryType": "esriGeometryEnvelope", "inSR": 4326, "spatialRel": "esriSpatialRelIntersects",
                             "outFields": "*", "outSR": 4326, "f": "geojson", "resultOffset": off, "resultRecordCount": 1000}, timeout=90).json()
            fs = r.get("features", []); feats += fs; off += len(fs)
            if not fs or not r.get("exceededTransferLimit"): break
        edited = meta.get("editingInfo", {}).get("dataLastEditDate")
        doc = dict(key=key, service=url, layer_name=meta.get("name"), data_last_edit=dt.datetime.fromtimestamp(edited / 1000, dt.timezone.utc).strftime("%Y-%m-%d") if edited else None,
                   fetched_utc=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), features=feats)
        json.dump(doc, open(os.path.join(out, key + ".json"), "w", encoding="utf-8"))
        print(key, len(feats), "features | layer edited", doc["data_last_edit"], "|", sorted(feats[0]["properties"])[:16] if feats else "-", flush=True)


if __name__ == "__main__":
    main()
