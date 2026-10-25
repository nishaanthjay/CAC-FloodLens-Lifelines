// Human names for crossings. The ID (V2_0420) belongs in the detail card only; everywhere else a crossing is a road, a stream or a place.
import { t } from "../../content/copy";
import { crossingRoad, tidyName } from "../format";
import type { XAssessed } from "../route";

export type CrossingName = { title: string; over?: string };
const named = (x: XAssessed) => !!x.name && x.name !== x.id;
const KY = 110570;
const CACHE = new WeakMap<XAssessed[], { named: XAssessed[]; byId: Map<string, CrossingName> }>();

/** "Pine Road" -> "Pine Road stream crossing"; "NC 87 over Allen Creek" -> title "NC 87", over "Allen Creek"; an ID-only crossing -> "Small stream crossing near <nearest named road>". */
export function crossingName(x: XAssessed, all: XAssessed[]): CrossingName {
  let c = CACHE.get(all);
  if (!c) CACHE.set(all, (c = { named: all.filter(named), byId: new Map() }));
  const hit = c.byId.get(x.id);
  if (hit) return hit;
  let out: CrossingName;
  if (named(x)) {
    const [road, ...rest] = tidyName(x.name).split(/ over /i);
    out = rest.length ? { title: road, over: rest.join(" over ") } : { title: t("names.road", { road }) };
  } else {
    const kx = 111320 * Math.cos((x.lat * Math.PI) / 180);
    let best: XAssessed | null = null, bd = 3000;
    for (const o of c.named) { const d = Math.hypot((o.lon - x.lon) * kx, (o.lat - x.lat) * KY); if (d < bd) { bd = d; best = o; } }
    out = { title: best ? t("names.near", { road: crossingRoad(best.name) }) : t("names.small") };
  }
  c.byId.set(x.id, out);
  return out;
}
/** One line: "NC 87 over Allen Creek". */
export const crossingLine = (n: CrossingName) => (n.over ? t("names.over", { road: n.title, stream: n.over }) : n.title);
