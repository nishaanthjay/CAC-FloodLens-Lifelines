// Risk tiers shared by the map, the tables and the charts. Colour is never the only signal: every tier has a text label,
// a stroke width that grows with the tier, and an arrow glyph. No green anywhere: "not flagged" is a pale neutral, never a safe colour.
import type { ComponentType } from "react";
import { t } from "../../content/copy";

export type Tier = { id: 0 | 1 | 2 | 3 | 4; label: string; fill: string; stroke: string; strokeW: number; arrow: "dash" | "down" | "right" | "up" | "up2"; note: string };

// Sequential palette: cool blue (watch) through warm sand to deep red (likely closed). Four words for the reader; the model still has five steps
// (flows above the 25-year level share the style of the 10-year level, since both mean "closed in this scenario").
export const TIERS: Tier[] = [
  { id: 0, label: t("tier.normal"), fill: "#CBD5E3", stroke: "#8A97AB", strokeW: 1, arrow: "dash", note: t("tier.normal.note") },
  { id: 1, label: t("tier.watch"), fill: "#7FA7D6", stroke: "#4D78AA", strokeW: 1.5, arrow: "right", note: t("tier.watch.note") },
  { id: 2, label: t("tier.high"), fill: "#E9B07C", stroke: "#B5773F", strokeW: 2, arrow: "up", note: t("tier.high.note") },
  { id: 3, label: t("tier.closed"), fill: "#C0392B", stroke: "#7F1D12", strokeW: 3, arrow: "up2", note: t("tier.closed.note") },
  { id: 4, label: t("tier.closed"), fill: "#C0392B", stroke: "#7F1D12", strokeW: 3, arrow: "up2", note: t("tier.closed.note") },
];

/** What the reader sees: four levels. Model tiers 3 and 4 both read "Likely closed". */
export type Level = { id: 0 | 1 | 2 | 3; tiers: number[]; label: string; fill: string; stroke: string; strokeW: number; arrow: Tier["arrow"]; note: string };
const level = (id: Level["id"], tiers: number[]): Level => { const { label, fill, stroke, strokeW, arrow, note } = TIERS[tiers[tiers.length - 1]]; return { id, tiers, label, fill, stroke, strokeW, arrow, note }; };
export const LEVELS: Level[] = [level(0, [0]), level(1, [1]), level(2, [2]), level(3, [3, 4])];
export const levelOfTier = (tier: number) => (tier < 0 ? -1 : Math.min(tier, 3));
/** Counts per model tier -> counts per level. */
export const levelSum = (perTier: number[]) => LEVELS.map((l) => l.tiers.reduce((a, k) => a + (perTier[k] ?? 0), 0));

export { tierOfLevel } from "./stats";
import { tierOfLevel } from "./stats";

/** Same, from the level character of the per-step string ("-" or anything unreadable = -1). */
export const tierFromLevel = (ch: string) => tierOfLevel(parseInt(ch, 10));

/** Access states for the "people by access state" chart (replay, from the block lookup). Order = bottom to top of the stack. */
export type AccessState = { id: "lost" | "gt10" | "s1_10" | "none" | "na"; label: string; fill: string; pattern: "cross" | "diag" | "dots" | "plain" | "sparse" };
export const ACCESS_STATES: AccessState[] = [
  { id: "lost", label: t("access.state.lost"), fill: "#C0392B", pattern: "cross" },
  { id: "gt10", label: t("access.state.gt10"), fill: "#E9B07C", pattern: "diag" },
  { id: "s1_10", label: t("access.state.s1_10"), fill: "#7FA7D6", pattern: "dots" },
  { id: "none", label: t("access.state.none"), fill: "#DCE6F2", pattern: "plain" },
  { id: "na", label: t("access.state.na"), fill: "#C4C8CE", pattern: "sparse" },
];

export type Icon = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
