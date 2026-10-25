// MapLibre style expressions for the crossing bubbles. Per-hour values live in two string properties on each feature, so changing the hour
// only swaps a constant inside these expressions: no setData, no feature-state writes, and hover/selection survive the swap.
//   lv: one level digit per step ("0".."5", "-" = no model value)        read with slice(lv, h, h+1)
//   rt: flow / 10-year flow x100, 3 characters per step ("042", "---")   read with slice(rt, 3h, 3h+3)
import { TIERS } from "./tiers";

export type Expr = unknown[];
export const NO_VALUE = { fill: "#B8BCC2", stroke: "#6F7680" }; // "no model value": hollow grey, never read as open

export const levelAt = (h: number): Expr => ["to-number", ["slice", ["get", "lv"], h, h + 1], -1];
/** Tier id 0..4 for step h, or -1 when there is no model value. */
export const tierAt = (h: number): Expr => ["min", 4, levelAt(h)];
export const ratioAt = (h: number): Expr => ["to-number", ["slice", ["get", "rt"], 3 * h, 3 * h + 3], -1];

const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const byTier = (h: number, vals: (string | number)[], none: string | number): Expr => ["match", tierAt(h), 0, vals[0], 1, vals[1], 2, vals[2], 3, vals[3], 4, vals[4], none];
const hover: Expr = ["coalesce", ["feature-state", "grow"], 0]; // 0..1, eased in JS on hover

// Opacity is a layer constant (0.35 fill, 0.12 halo, so tabs can fade it with a paint transition); per-feature dimming lives in the colour alpha.
export const FILL_OPACITY = 0.35, HALO_OPACITY = 0.12;
export const fillAt = (h: number): Expr => byTier(h, TIERS.map((t) => t.fill), rgba(NO_VALUE.fill, 0.3)); // no model value: hollow-ish grey
export const haloFillAt = (h: number): Expr => byTier(h, TIERS.map((t, i) => (i === 0 ? rgba(t.fill, 0.4) : t.fill)), rgba(NO_VALUE.fill, 0)); // the pale "not flagged" tier gets almost no halo
export const strokeAt = (h: number): Expr => ["interpolate", ["linear"], hover, 0, byTier(h, TIERS.map((t) => rgba(t.stroke, 0.88)), rgba(NO_VALUE.stroke, 0.7)), 1, byTier(h, TIERS.map((t) => t.stroke), NO_VALUE.stroke)]; // full opacity while hovered
export const strokeWAt = (h: number, tab?: string): Expr => byTier(h, TIERS.map((t) => (tab === "access" ? Math.min(t.strokeW, 1.5) : t.strokeW)), 1); // Access: context dots, thinner outlines so the route reads first

/** Zoom factor shared by all bubbles: smaller when zoomed out, larger up close. */
const zoomed = (px: Expr | number): Expr => ["interpolate", ["linear"], ["zoom"], 8, ["*", 0.8, px], 12, px, 15, ["*", 1.6, px]];
const grow: Expr = ["+", 1, ["*", 0.25, hover]]; // the bubble swells 1.25x on hover

/** Base radius in px (before zoom and hover) for each tab. WATER: sqrt of flow ratio. CONSEQUENCE: sqrt of people. ACCESS: small context dots. */
export function baseRadius(tab: "water" | "access" | "consequence", h: number, maxPeople: number): Expr | number {
  if (tab === "water") return ["+", 5, ["*", 15, ["sqrt", ["/", ["min", 3, ["max", 0, ["/", ratioAt(h), 100]]], 3]]]];
  if (tab === "consequence") return ["+", 4, ["*", 24, ["sqrt", ["/", ["get", "ppl"], Math.max(1, maxPeople)]]]];
  return ["case", [">=", tierAt(h), 3], 4.5, 3];
}
export const radiusExpr = (tab: "water" | "access" | "consequence", h: number, maxPeople: number): Expr => zoomed(["*", baseRadius(tab, h, maxPeople), grow]);
export const haloRadiusExpr = (tab: "water" | "access" | "consequence", h: number, maxPeople: number): Expr => zoomed(["+", 4, ["*", 1.9, baseRadius(tab, h, maxPeople)]]);

export const selRadiusExpr = (tab: "water" | "access" | "consequence", h: number, maxPeople: number): Expr => zoomed(["+", 6, baseRadius(tab, h, maxPeople)]);

// Clusters (zoom < 10): neutral fill, so a count is never read as a risk level; the outline carries the worst tier in the group at the current hour.
export const MAX_STEPS = 18;
export const clusterProps = (): Record<string, Expr> => {
  const o: Record<string, Expr> = { pp: ["+", ["get", "ppl"]] };
  for (let h = 0; h < MAX_STEPS; h++) o[`mx${h}`] = ["max", tierAt(h)];
  return o;
};
export const clusterTier = (h: number): Expr => ["coalesce", ["get", `mx${Math.min(h, MAX_STEPS - 1)}`], -1];
/** Cluster bubble: worst tier in the group at this hour, tinted like a bubble (the count is the label; the tier is also named in the tooltip). */
export const clusterFillAt = (h: number): Expr => ["match", clusterTier(h), 0, rgba(TIERS[0].fill, 0.5), 1, rgba(TIERS[1].fill, 0.4), 2, rgba(TIERS[2].fill, 0.4), 3, rgba(TIERS[3].fill, 0.4), 4, rgba(TIERS[4].fill, 0.4), rgba(NO_VALUE.fill, 0.3)];
export const clusterHaloAt = (h: number): Expr => ["match", clusterTier(h), 0, rgba(TIERS[0].fill, 0.5), 1, TIERS[1].fill, 2, TIERS[2].fill, 3, TIERS[3].fill, 4, TIERS[4].fill, rgba(NO_VALUE.fill, 0)];
