"use client";
import { hourTime } from "@/lib/sample";

/** Floating step slider shared by the replay map and the route analysis map.
 * Replay (default): 18 replay hours from `start`. Live route view: pass `title`, `text` and `ticks` (Now, +3h, ...) instead. */
export function HourSlider({ hour, hours, start, onChange, title, text, ticks, dock }: {
  hour: number; hours: number; start?: string; onChange: (h: number) => void;
  title?: string; text?: string; ticks?: [number, string][]; dock?: boolean; // dock: sits under the map instead of covering it
}) {
  const shown = text ?? (start ? hourTime(start, hour) : "");
  const marks = ticks ?? [0, 3, 6, 12, hours - 1].map((h) => [h, h === 0 ? "START" : `+${h}H`] as [number, string]);
  const last = Math.max(1, hours - 1);
  return (
    <div className={dock ? "mx-auto mt-4 w-full max-w-2xl rounded-2xl border border-ink/10 bg-white p-4 shadow-panel" : "glass absolute inset-x-3 bottom-3 z-[2] rounded-2xl border border-white/60 p-4 shadow-float sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[min(34rem,calc(100%-2rem))] sm:-translate-x-1/2"}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <label htmlFor="hour" className="font-ui text-sm font-semibold">{title ?? "Step through 18 replay hours"}</label>
        <span key={hour} className="pop inline-block font-mono text-sm font-semibold text-blue" aria-live="polite">{shown}</span>
      </div>
      <input
        id="hour"
        type="range"
        min={0}
        max={hours - 1}
        step={1}
        value={hour}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={title ? shown : `Replay hour ${hour}, ${shown}`}
        className="min-h-11 w-full cursor-pointer"
      />
      <div aria-hidden className="relative h-4 font-mono text-xs text-muted">
        {marks.map(([h, label]) => (
          <span key={h} className="absolute" style={{ left: `${(h / last) * 100}%`, transform: `translateX(-${(h / last) * 100}%)` }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
