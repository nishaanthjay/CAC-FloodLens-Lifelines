// Emergency / critical-care services (services.json, written by lifeline/src/pipeline/01_build_world/inventory/build_services.py).
// Hospitals with an emergency department and fire stations come from the pipeline's own lists; the rest are federal / HHS lists topped up with
// OpenStreetMap, so every list is incomplete. The UI states that next to each list and never implies a place is open.
import { getJSON } from "./sample";

export type Kind = "hospital_ed" | "hospital" | "urgent_care" | "dialysis" | "nursing_home" | "fire" | "ems" | "police" | "pharmacy";
export type Svc = { id: string; k: Kind; name: string; lat: number; lon: number; sub?: string; src: string; phone?: string; addr?: string; hours?: string };
export type ServicesDoc = { generated_at: string; counts: Record<string, number>; caveats: string[]; items: Svc[] };

/** Display order, label, map colour. */
export const KINDS: { id: Kind; label: string; one: string; fill: string }[] = [
  { id: "hospital_ed", label: "Emergency rooms", one: "Emergency room", fill: "#CC0000" },
  { id: "hospital", label: "Other hospitals", one: "Hospital (ED not confirmed)", fill: "#E07B7B" },
  { id: "urgent_care", label: "Urgent care", one: "Urgent care", fill: "#D9822B" },
  { id: "dialysis", label: "Dialysis", one: "Dialysis centre", fill: "#2D5DA1" },
  { id: "nursing_home", label: "Nursing homes", one: "Nursing home / assisted living", fill: "#6B4FA0" },
  { id: "fire", label: "Fire stations", one: "Fire station", fill: "#111111" },
  { id: "ems", label: "EMS stations", one: "EMS station", fill: "#444444" },
  { id: "police", label: "Police and sheriff", one: "Police / sheriff", fill: "#1F6E5C" },
  { id: "pharmacy", label: "Pharmacies", one: "Pharmacy", fill: "#7A7F87" },
];
export const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k])) as Record<Kind, (typeof KINDS)[number]>;

export const loadServices = () => getJSON<ServicesDoc>("services.json");

export const flatKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
  Math.hypot((a.lon - b.lon) * 111.32 * Math.cos((a.lat * Math.PI) / 180), (a.lat - b.lat) * 110.57);

/** `tel:` link from a free-text phone number; null when there are no digits. */
export const telHref = (p?: string) => { const d = (p ?? "").replace(/[^\d+]/g, ""); return d.length >= 7 ? `tel:${d}` : null; };

/** The `n` nearest services of each kind by straight line (fast, no network). Drive times are fetched separately for these only. */
export function nearestByKind(items: Svc[], here: { lat: number; lon: number }, n = 5, kinds: Kind[] = KINDS.map((k) => k.id)) {
  const by = new Map<Kind, { s: Svc; straightKm: number }[]>();
  for (const s of items) {
    if (!kinds.includes(s.k)) continue;
    const a = by.get(s.k) ?? []; a.push({ s, straightKm: flatKm(here, s) }); by.set(s.k, a);
  }
  return KINDS.flatMap(({ id }) => (by.get(id) ?? []).sort((a, b) => a.straightKm - b.straightKm).slice(0, n));
}

/** Directions link that opens the visitor's own map app; nothing is sent from this site. */
export const directionsHref = (from: { lat: number; lon: number } | null, to: { lat: number; lon: number }) =>
  `https://www.openstreetmap.org/directions?engine=fossgis_valhalla_car&route=${from ? `${from.lat},${from.lon}` : ""}%3B${to.lat},${to.lon}`;
