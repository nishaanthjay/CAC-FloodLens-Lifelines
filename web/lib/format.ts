// Display helpers: US units, Eastern time, tidy names and phones. Data stays in km / UTC / raw source strings; only the screen text changes.

const KM_PER_MI = 1.609344;
/** Distance for display: kilometres in, miles out ("0.2 mi"). */
export const mi = (km: number, digits = 1) => `${(km / KM_PER_MI).toFixed(digits)} mi`;

/** Drive time for display: under a minute reads "<1 min". */
export const mins = (s: number) => (s < 30 ? "<1 min" : `${Math.round(s / 60)} min`);

const ET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

/** "Sat Oct 24, 1:00 PM ET" (the year is added when it is not the current one). Unparseable input comes back unchanged. */
export function et(iso: string): string {
  const ms = Date.parse(/(Z|[+-]\d\d:?\d\d)$/.test(iso) ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(ms)) return iso;
  const p = Object.fromEntries(ET.formatToParts(ms).map((x) => [x.type, x.value]));
  const year = Number(p.year) === new Date().getFullYear() ? "" : `, ${p.year}`;
  return `${p.weekday} ${p.month} ${p.day}${year}, ${p.hour}:${p.minute} ${p.dayPeriod} ET`;
}

const ACRONYM = new Set(["US", "NC", "SR", "NE", "NW", "SE", "SW", "I", "N", "S", "E", "W", "II", "III"]);
const DIR: Record<string, string> = { N: "North", S: "South", E: "East", W: "West" };

/** Raw NCDOT strings to readable names: "US17,US76 over Bradley Creek" -> "US 17/76 over Bradley Creek", "HOLLY TREE RD." -> "Holly Tree Rd". */
export function tidyName(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/\b(US|NC|SR|I)[\s-]?(\d+)([NSEW])?\b\.?/gi, (_, r: string, n: string, d?: string) => `${r.toUpperCase()} ${n}${d ? " " + DIR[d.toUpperCase()] : ""}`);
  for (let i = 0; i < 3; i++) s = s.replace(/\b(US|NC|SR|I) (\d+)(?: (?:North|South|East|West))?\s*,\s*\1 (\d+)/g, "$1 $2/$3");
  return s.split(" ").map((w) => {
    const core = w.replace(/[.,]+$/, ""), tail = /,$/.test(w) ? "," : "";
    if (/^[A-Z]{2,}$/.test(core) && !ACRONYM.has(core)) return core[0] + core.slice(1).toLowerCase() + tail;
    return core + tail;
  }).join(" ");
}

/** Every phone shows as (910) 457-3800. Anything that is not a 10-digit US number is left alone. */
export function fmtPhone(p?: string): string | undefined {
  if (!p) return p;
  const d = p.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

// Towns used to name a Census block by where it is ("Census block near Oak Island") instead of a placeholder number.
const TOWNS: [string, number, number][] = [
  ["Wilmington", 34.2257, -77.9447], ["Carolina Beach", 34.0352, -77.8936], ["Kure Beach", 33.9979, -77.9072], ["Wrightsville Beach", 34.2085, -77.7964],
  ["Leland", 34.2563, -78.0447], ["Southport", 33.9218, -78.0197], ["Oak Island", 33.9157, -78.1583], ["Boiling Spring Lakes", 34.0332, -78.07],
  ["Bolivia", 34.0657, -78.1425], ["Supply", 34.0102, -78.2833], ["Shallotte", 33.9741, -78.3892], ["Holden Beach", 33.9157, -78.2991],
  ["Ocean Isle Beach", 33.8949, -78.4286], ["Sunset Beach", 33.8741, -78.5067], ["Burgaw", 34.5521, -77.9261], ["Surf City", 34.4271, -77.5456],
  ["Topsail Beach", 34.3693, -77.635], ["Hampstead", 34.3702, -77.7155], ["Rocky Point", 34.4388, -77.8975], ["Atkinson", 34.533, -78.1736],
  ["Winnabow", 34.1004, -78.0997], ["Castle Hayne", 34.361, -77.8955],
];
export function placeName(lat: number, lon: number): string {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
  let best = TOWNS[0][0], bd = Infinity;
  for (const [n, a, o] of TOWNS) { const d = Math.hypot((o - lon) * kx, (a - lat) * 110.57); if (d < bd) { bd = d; best = n; } }
  return best;
}
