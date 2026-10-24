// Emergency / critical-care services (services.json, written by lifeline/src/pipeline/01_build_world/inventory/build_services.py).
// Hospitals with an emergency department and fire stations come from the pipeline's own lists; the rest are federal / HHS lists topped up with
// OpenStreetMap, so every list is incomplete. The UI states that next to each list and never implies a place is open.
import { getJSON } from "./sample";
import { fmtPhone } from "./format";

export type Kind = "hospital_ed" | "hospital" | "urgent_care" | "dialysis" | "nursing_home" | "fire" | "ems" | "police" | "pharmacy";
export type Svc = { id: string; k: Kind; name: string; lat: number; lon: number; sub?: string; src: string; phone?: string; addr?: string; hours?: string };
export type ServicesDoc = { generated_at: string; counts: Record<string, number>; caveats: string[]; items: Svc[] };

/** Display order, label, map color. */
export const KINDS: { id: Kind; label: string; one: string; fill: string }[] = [
  { id: "hospital_ed", label: "Emergency rooms", one: "Emergency room", fill: "#CC0000" },
  { id: "hospital", label: "Other hospitals", one: "Hospital (ER not confirmed)", fill: "#E07B7B" },
  { id: "urgent_care", label: "Urgent care", one: "Urgent care", fill: "#D9822B" },
  { id: "dialysis", label: "Dialysis", one: "Dialysis center", fill: "#2D5DA1" },
  { id: "nursing_home", label: "Nursing homes", one: "Nursing home / assisted living", fill: "#6B4FA0" },
  { id: "fire", label: "Fire stations", one: "Fire station", fill: "#111111" },
  { id: "ems", label: "EMS stations", one: "EMS station", fill: "#444444" },
  { id: "police", label: "Police and sheriff", one: "Police / sheriff", fill: "#1F6E5C" },
  { id: "pharmacy", label: "Pharmacies", one: "Pharmacy", fill: "#7A7F87" },
];
export const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k])) as Record<Kind, (typeof KINDS)[number]>;

// Source-list clean-up applied on load: facilities that are duplicates, outdated or not general ERs are dropped, names and phones are made uniform.
const DROP = [/^Kerr Drug/i, /Behavioral Health/i, /^Novant Health$/i, /^Brunswick Medical Center$/i]; // Kerr Drug closed/merged (2019 list); behavioral hospitals are not ERs; the last two duplicate Novant Health Brunswick Medical Center
const tidy = (s: Svc): Svc => ({
  ...s,
  name: (s.k === "pharmacy" ? s.name.replace(/^Wal-?Mart(?: Supercenter)?\s*-\s*\d+$/i, "Walmart Pharmacy") : s.name).replace(/\s*\(unnamed in source\)/i, ""),
  sub: s.sub?.replace(/\s*\(unnamed in source\)/i, ""),
  phone: fmtPhone(s.phone),
});
export const loadServices = () => getJSON<ServicesDoc>("services.json").then((d) => ({ ...d, items: d.items.filter((s) => !DROP.some((r) => r.test(s.name))).map(tidy) }));

/** Beyond this straight-line distance a listing is not useful in an emergency (ERs are kept at any distance). */
export const MAX_KM: Partial<Record<Kind, number>> = { hospital_ed: Infinity };
export const DEFAULT_MAX_KM = 40;

export const flatKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
  Math.hypot((a.lon - b.lon) * 111.32 * Math.cos((a.lat * Math.PI) / 180), (a.lat - b.lat) * 110.57);

/** `tel:` link from a free-text phone number; null when there are no digits. */
export const telHref = (p?: string) => { const d = (p ?? "").replace(/[^\d+]/g, ""); return d.length >= 7 ? `tel:${d}` : null; };

/** The `n` nearest services of each kind by straight line (fast, no network). Drive times are fetched separately for these only. */
export function nearestByKind(items: Svc[], here: { lat: number; lon: number }, n = 5, kinds: Kind[] = KINDS.map((k) => k.id)) {
  const by = new Map<Kind, { s: Svc; straightKm: number }[]>();
  for (const s of items) {
    if (!kinds.includes(s.k)) continue;
    const km = flatKm(here, s);
    if (km > (MAX_KM[s.k] ?? DEFAULT_MAX_KM)) continue;
    const a = by.get(s.k) ?? []; a.push({ s, straightKm: km }); by.set(s.k, a);
  }
  return KINDS.flatMap(({ id }) => (by.get(id) ?? []).sort((a, b) => a.straightKm - b.straightKm).slice(0, n));
}

/** Directions link that opens the visitor's own map app; nothing is sent from this site. */
export const directionsHref = (from: { lat: number; lon: number } | null, to: { lat: number; lon: number }) =>
  `https://www.openstreetmap.org/directions?engine=fossgis_valhalla_car&route=${from ? `${from.lat},${from.lon}` : ""}%3B${to.lat},${to.lon}`;
