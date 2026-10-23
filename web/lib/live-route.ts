// Now + forecast time axis for the route page, built from route_crossings.json (static fields) and forecast_latest.json (NWM short-range).
// Pure (type-only import) so scripts/route-check.mjs can run it under Node. The Florence replay never passes through here: it keeps its own axis.
import type { RouteCrossings, XAssessed } from "./route";

export type RouteForecast = {
  mode: string; label: string; stale: boolean; generated_at: string; cycle_issue_time: string; cycle_age_hours: number; nwm_version: string;
  caveats: string[]; valid_times: (string | null)[];
  fallback: { used: boolean; skipped_newer_cycles: { cycle: string; reason: string }[]; note: string };
  crossings: { id: string; name: string; q10_cfs: number | null; in_model_output: boolean; ratio_q10: (number | null)[]; level: string }[];
};

export type LiveWindow = {
  X: RouteCrossings; // step 0 = the modelled hour standing in for now, then one step per forecast hour
  times: string[]; // valid time of each step (ISO)
  expired: boolean; // the forecast ended before now: every step is unknown, never shown as open
  withData: number; // assessed crossings that have a value at step 0
};

const HOUR = 3600e3;
/** A forecast whose last valid hour is more than 90 minutes old no longer covers now. */
export const EXPIRED_AFTER_MS = 1.5 * HOUR;

export function liveWindow(base: RouteCrossings, f: RouteForecast, nowMs: number): LiveWindow {
  const ms = f.valid_times.map((t) => (t ? Date.parse(t) : NaN));
  let nowIdx = -1;
  ms.forEach((t, i) => { if (!Number.isNaN(t) && t <= nowMs) nowIdx = i; });
  const lastIdx = ms.reduce((a, t, i) => (Number.isNaN(t) ? a : i), -1);
  const expired = lastIdx < 0 || nowMs - ms[lastIdx] > EXPIRED_AFTER_MS;
  const from = Math.max(0, nowIdx), n = lastIdx < 0 ? 1 : lastIdx - from + 1;
  const by = new Map(f.crossings.map((c) => [c.id, c]));
  const pad = (s: string) => (expired ? "-".repeat(n) : s.slice(from, from + n).padEnd(n, "-"));
  const assessed: XAssessed[] = base.assessed.map((x) => {
    const c = by.get(x.id);
    return { ...x, first_above_RL10_utc: null, p_pct: Array(n).fill(0),
      level: pad(c?.level ?? ""), ratio_q10: expired || !c ? Array(n).fill(null) : Array.from({ length: n }, (_, k) => c.ratio_q10[from + k] ?? null) };
  });
  return {
    X: { hours: n, levels: base.levels, assessed, not_assessed: base.not_assessed },
    times: Array.from({ length: n }, (_, k) => f.valid_times[from + k] ?? ""),
    expired, withData: assessed.filter((x) => x.level[0] !== "-").length,
  };
}

/** Plain-language label of a step: the first is the modelled hour covering now, the rest are forecast hours ahead of it. */
export const stepLabel = (k: number) => (k === 0 ? "Now" : `+${k} h`);
