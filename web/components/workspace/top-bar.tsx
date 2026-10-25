"use client";
import { useRef } from "react";
import { MenuChip } from "@/components/workspace/ui";
import { TABS, useWS, type LayerSel, type Mode } from "@/components/workspace/store";

export const MODE_BADGE: Record<Mode, string> = { replay: "REPLAY", nowcast: "NOWCAST", forecast: "FORECAST" };
const MODE_TEXT: Record<Mode, string> = { replay: "Florence 2018", nowcast: "Observed now", forecast: "Preview" };

function TabBar() {
  const { tab, setTab } = useWS();
  const ref = useRef<HTMLDivElement>(null);
  const key = (e: React.KeyboardEvent, i: number) => {
    const j = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (j < 0) return;
    e.preventDefault(); setTab(TABS[j].id);
    (ref.current?.querySelectorAll("button")[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <div ref={ref} role="tablist" aria-label="Map view" className="ws-glass inline-flex shrink-0 rounded-full p-1">
      {TABS.map((t, i) => (
        <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="ws-panel" tabIndex={tab === t.id ? 0 : -1}
          onClick={() => setTab(t.id)} onKeyDown={(e) => key(e, i)}
          className={`min-h-9 whitespace-nowrap rounded-full px-4 font-ui text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 ${tab === t.id ? "bg-ink text-white" : "text-ink/70 hover:text-ink"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TopBar() {
  const { mode, setMode, layer, setLayer } = useWS();
  const chips = (
    <>
      <MenuChip<Mode> label="Mode" value={mode} valueText={MODE_TEXT[mode]} onChange={setMode}
        badge={<span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white">{MODE_BADGE[mode]}</span>}
        options={[{ id: "replay", label: "Replay · Florence 2018", sub: "Past storm, fixed data" }, { id: "nowcast", label: "Nowcast", sub: "Observed gauges and tide stations" }, { id: "forecast", label: "Forecast preview", sub: "NWM short-range, unvalidated" }]} />
      <MenuChip<LayerSel> label="Layer" value={layer} valueText={layer === "rivers" ? "Rivers" : layer === "coastal" ? "Coastal" : "Both"} onChange={setLayer}
        options={[{ id: "rivers", label: "Rivers", sub: "Crossings on non-tidal streams" }, { id: "coastal", label: "Coastal", sub: "Tidal-influenced crossings" }, { id: "both", label: "Both", sub: "All assessed crossings" }]} />
    </>
  );
  return (
    <>
      <div className="pointer-events-none absolute left-[68px] right-3 top-3 z-20 hidden items-start gap-3 lg:flex">
        <div className="pointer-events-auto"><TabBar /></div>
        <div className="pointer-events-auto mx-auto flex gap-2">{chips}</div>
      </div>
      <div className="absolute inset-x-0 top-0 z-20 lg:hidden">
        <div className="no-scrollbar flex overflow-x-auto px-3 pt-3 [scrollbar-width:none]"><TabBar /></div>
        <div className="flex gap-2 px-3 pt-2 [&_.ws-label]:hidden sm:[&_.ws-label]:block">{chips}</div>
      </div>
    </>
  );
}
