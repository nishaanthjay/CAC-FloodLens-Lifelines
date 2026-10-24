// Risk tiers shared by the map, the tables and the charts. Colour is never the only signal: every tier has a text label,
// a stroke width that grows with the tier, and an arrow glyph. No green anywhere: "not flagged" is a pale neutral, never a safe colour.
import type { ComponentType } from "react";

export type Tier = { id: 0 | 1 | 2 | 3 | 4; label: string; fill: string; stroke: string; strokeW: number; arrow: "dash" | "down" | "right" | "up" | "up2"; note: string };

// Sequential palette: cool blue (low) through warm sand to deep red (high).
export const TIERS: Tier[] = [
  { id: 0, label: "Not flagged", fill: "#CBD5E3", stroke: "#8A97AB", strokeW: 1, arrow: "dash", note: "Below the 2-year flow in this scenario. Not an all-clear." },
  { id: 1, label: "Low", fill: "#7FA7D6", stroke: "#4D78AA", strokeW: 1.5, arrow: "down", note: "Above the 2-year flow." },
  { id: 2, label: "Elevated", fill: "#E9B07C", stroke: "#B5773F", strokeW: 2, arrow: "right", note: "Above the 5-year flow." },
  { id: 3, label: "High", fill: "#D4694A", stroke: "#9E3F25", strokeW: 2.5, arrow: "up", note: "Above the 10-year flow: closed in this scenario." },
  { id: 4, label: "Very high", fill: "#C0392B", stroke: "#7F1D12", strokeW: 3, arrow: "up2", note: "Above the 25-year flow or more: closed in this scenario." },
];

/** Route-crossings level digit (index into RouteCrossings.levels: RL0, RL2, RL5, RL10, RL25, RL50) -> tier id. RL25 and RL50 both read "Very high". -1 = no model value (never shown as open). */
export const tierOfLevel = (lv: number): -1 | 0 | 1 | 2 | 3 | 4 => (Number.isNaN(lv) || lv < 0 ? -1 : (Math.min(lv, 4) as 0 | 1 | 2 | 3 | 4));

/** Same, from the level character of the per-step string ("-" or anything unreadable = -1). */
export const tierFromLevel = (ch: string) => tierOfLevel(parseInt(ch, 10));

/** Access states for the "people by access state" chart (replay, from the block lookup). Order = bottom to top of the stack. */
export type AccessState = { id: "lost" | "gt10" | "s1_10" | "none" | "na"; label: string; fill: string; pattern: "cross" | "diag" | "dots" | "plain" | "sparse" };
export const ACCESS_STATES: AccessState[] = [
  { id: "lost", label: "Lost access", fill: "#C0392B", pattern: "cross" },
  { id: "gt10", label: "Slowed more than 10 min", fill: "#E9B07C", pattern: "diag" },
  { id: "s1_10", label: "Slowed 1 to 10 min", fill: "#7FA7D6", pattern: "dots" },
  { id: "none", label: "Not flagged in this scenario", fill: "#DCE6F2", pattern: "plain" },
  { id: "na", label: "Not assessed", fill: "#C4C8CE", pattern: "sparse" },
];

export type Icon = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
