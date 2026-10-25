// Plain-language wording for numbers: a human sentence first, the technical figure second. Wording lives in content/site-copy.md.
import { t } from "../../content/copy";

/** "1 in 3" for shares between 5% and 50%, otherwise a percentage; used as "<share> Brunswick neighborhoods ...". */
export function shareOf(share: number): string {
  if (share > 0 && share < 0.01) return t("plain.share.under1");
  const pct = Math.round(share * 100);
  if (share >= 0.5 || share < 0.05) return t("plain.share.pct", { pct });
  return t("plain.share.oneIn", { n: Math.round(1 / share) });
}

const times = (r: number) => (r >= 3 ? String(Math.round(r)) : r.toFixed(1));

/** How high the water is, against a typical big flood (the 10-year flow). null = no model value. */
export function waterSentence(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return t("plain.water.none");
  if (ratio >= 1.5) return t("plain.water.high", { x: times(ratio) });
  if (ratio >= 1) return t("plain.water.near", { x: times(ratio) });
  const pct = Math.round(ratio * 100);
  return pct >= 5 ? t("plain.water.part", { pct }) : t("plain.water.low");
}
/** Short form for tooltips. */
export const waterShort = (ratio: number | null | undefined) => (ratio === null || ratio === undefined || Number.isNaN(ratio) ? t("plain.water.none") : t("plain.water.short", { x: ratio >= 3 ? Math.round(ratio) : ratio.toFixed(1) }));
/** The technical figure that goes with it, in small type. */
export const waterFigure = (ratio: number | null | undefined) => (ratio === null || ratio === undefined || Number.isNaN(ratio) ? "" : t("plain.water.figure", { ratio: ratio.toFixed(2) }));
