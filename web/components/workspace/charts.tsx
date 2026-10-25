"use client";
import { useId, useRef } from "react";
import type { AccessState } from "@/lib/workspace/tiers";
import { t } from "@/content/copy";

/** Monotone cubic path through (x, y) points: smooth, and never overshoots the data (a stacked band must not cross its neighbour). */
function smooth(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [], m: number[] = [], t: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); m.push((pts[i + 1][1] - pts[i][1]) / dx[i]); }
  t.push(m[0]);
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  t.push(m[n - 2]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

export type Series = { id: string; label: string; fill: string; pattern: AccessState["pattern"]; values: number[] };

/** Pattern fills shared by the chart and the legend, so a state reads by texture as well as colour. */
function Patterns({ uid }: { uid: string }) {
  const ink = "rgb(17 17 17 / .55)";
  return (
    <defs>
      <pattern id={`${uid}-cross`} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="#fff" strokeOpacity=".55" strokeWidth="1" /></pattern>
      <pattern id={`${uid}-diag`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke={ink} strokeOpacity=".5" strokeWidth="1.2" /></pattern>
      <pattern id={`${uid}-dots`} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#fff" fillOpacity=".85" /></pattern>
      <pattern id={`${uid}-sparse`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0V8" stroke={ink} strokeOpacity=".35" strokeWidth=".8" /></pattern>
    </defs>
  );
}

export function Swatch({ fill, pattern, uid, size = 12 }: { fill: string; pattern: AccessState["pattern"]; uid: string; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden className="shrink-0 rounded-[3px]">
      <Patterns uid={uid} />
      <rect width={size} height={size} fill={fill} />
      {pattern !== "plain" && <rect width={size} height={size} fill={`url(#${uid}-${pattern})`} />}
      <rect width={size} height={size} fill="none" stroke="rgb(17 17 17 / .25)" />
    </svg>
  );
}

const fmt = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${Math.round(v)}`);

/** Hand-written stacked area chart: smooth curves, a vertical marker at the current hour; click or drag to move it, arrow keys when focused. */
export function StackedArea({ series, hour, onHour, unitLabel, ariaLabel, hourLabel = (h) => t("common.hour", { hour: h }), emptyText }: {
  series: Series[]; hour: number; onHour: (h: number) => void; unitLabel: string; ariaLabel: string; hourLabel?: (h: number) => string; emptyText?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const W = 320, H = 190, L = 42, R = 10, T = 22, B = 28; // 13px labels at the chart's ~1:1 scale
  const n = series[0]?.values.length ?? 0;
  const tot = Array.from({ length: n }, (_, i) => series.reduce((a, s) => a + s.values[i], 0));
  const empty = Math.max(0, ...tot) === 0;
  const max = Math.max(1, ...tot);
  const nice = (() => { const p = 10 ** Math.floor(Math.log10(max)); const f = max / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; })();
  const x = (i: number) => L + (n < 2 ? 0 : (i / (n - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / nice) * (H - T - B);
  const cum: number[][] = []; // upper edge of each band
  series.forEach((s, k) => cum.push(s.values.map((v, i) => v + (k ? cum[k - 1][i] : 0))));
  const bands = n < 2 ? [] : series.map((_, k) => { // one step has no area to draw (the curve helper needs two points)
    const top = cum[k].map((v, i) => [x(i), y(v)] as [number, number]);
    const bot = (k ? cum[k - 1] : cum[0].map(() => 0)).map((v, i) => [x(i), y(v)] as [number, number]).reverse();
    return `${smooth(top)}L${bot[0][0].toFixed(1)},${bot[0][1].toFixed(1)}${smooth(bot).replace(/^M[^C]*/, "")}Z`;
  });
  const svg = useRef<SVGSVGElement>(null);
  const at = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    onHour(Math.round(Math.max(0, Math.min(1, (((e.clientX - r.left) / r.width) * W - L) / (W - L - R))) * (n - 1)));
  };
  if (!n) return null;
  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="slider" tabIndex={0} aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={hour}
      aria-valuetext={`${hourLabel(hour)}: ${fmt(tot[hour] ?? 0)} ${unitLabel}`}
      className="block h-auto w-full cursor-ew-resize touch-none select-none rounded-md" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); at(e); }}
      onPointerMove={(e) => e.buttons && at(e)}
      onKeyDown={(e) => { const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0; if (d) { e.preventDefault(); onHour(hour + d); } }}>
      <Patterns uid={uid} />
      {(empty ? [0] : [0, 0.5, 1]).map((f) => { const v = f * nice; return (
        <g key={f}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgb(17 17 17 / .1)" strokeDasharray={v ? "2 3" : undefined} />
          <text x={L - 5} y={y(v) + 3} textAnchor="end" className="fill-muted tabular-nums" fontSize="12.5">{fmt(v)}</text></g>); })}
      {bands.map((d, k) => (
        <g key={series[k].id}><path d={d} fill={series[k].fill} />{series[k].pattern !== "plain" && <path d={d} fill={`url(#${uid}-${series[k].pattern})`} />}
          <path d={d} fill="none" stroke="#fff" strokeWidth=".8" /></g>))}
      {[...new Set([0, Math.round((n - 1) / 2), n - 1])].map((i) => ( // a set: with one or two steps the ticks would repeat and share a key
        <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-muted tabular-nums" fontSize="12.5">{hourLabel(i)}</text>))}
      {empty && emptyText && <text x={(L + W - R) / 2} y={(T + H - B) / 2 - 6} textAnchor="middle" className="fill-ink/80" fontSize="12.5">{emptyText.split(". ").map((line, i, a) => <tspan key={i} x={(L + W - R) / 2} dy={i ? 17 : 0}>{i < a.length - 1 && !line.endsWith(".") ? `${line}.` : line}</tspan>)}</text>}
      <line x1={x(hour)} x2={x(hour)} y1={T - 2} y2={H - B} stroke="#111" strokeWidth="1.2" />
      <text x={Math.min(Math.max(x(hour), L + 12), W - R - 12)} y={T - 3} textAnchor="middle" className="fill-ink tabular-nums" fontSize="12.5" fontWeight="600">{hourLabel(hour)}</text>
      <circle cx={x(hour)} cy={y(tot[hour] ?? 0)} r="3.2" fill="#fff" stroke="#111" strokeWidth="1.4" />
    </svg>
  );
}

export function Legend({ items }: { items: { id: string; label: string; fill: string; pattern: AccessState["pattern"]; value?: string }[] }) {
  const uid = useId().replace(/:/g, "");
  return (
    <ul className="mt-2 grid gap-y-1 text-xs text-ink/85">
      {items.map((s) => (
        <li key={s.id} className="flex items-center gap-2"><Swatch fill={s.fill} pattern={s.pattern} uid={uid} /><span className="min-w-0 flex-1">{s.label}</span>{s.value && <span className="tabular-nums">{s.value}</span>}</li>
      ))}
    </ul>
  );
}

export type BarRow = { key: string; label: string; fill: string; stroke: string; strokeW: number; value: number };

/** Horizontal bars with a percent and a count; the fill carries a stroke weight, so rows differ by more than hue. */
export function Bars({ rows, unitLabel }: { rows: BarRow[]; unitLabel: string }) {
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => {
        const p = (r.value / total) * 100;
        return (
          <li key={r.key} className="grid grid-cols-[88px_1fr_auto] items-center gap-2 text-xs">
            <span className="font-medium leading-tight text-ink">{r.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden>
              <span className="block h-full rounded-full" style={{ width: `${Math.max(p, r.value ? 2 : 0)}%`, background: r.fill, boxShadow: `inset 0 0 0 ${Math.min(r.strokeW, 2.5)}px ${r.stroke}` }} />
            </span>
            <span className="min-w-[70px] text-right tabular-nums text-ink"><b className="font-semibold">{p < 10 && p > 0 ? p.toFixed(1) : Math.round(p)}%</b> <span className="text-muted">{r.value.toLocaleString("en-US")}</span><span className="sr-only"> {unitLabel}</span></span>
          </li>
        );
      })}
    </ul>
  );
}
