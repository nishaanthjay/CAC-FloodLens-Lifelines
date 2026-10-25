"use client";
import { useRef } from "react";
import { MenuChip } from "@/components/workspace/ui";
import { TABS, useWS, type Mode } from "@/components/workspace/store";
import { useData } from "@/components/workspace/data";
import { ageH, hoursText } from "@/lib/live";
import { t } from "@/content/copy";

export const MODE_BADGE: Record<Mode, string> = { replay: t("topbar.mode.replay.badge"), nowcast: t("topbar.mode.nowcast.badge"), forecast: t("topbar.mode.forecast.badge") };
const MODE_TEXT: Record<Mode, string> = { replay: t("topbar.mode.replay.value"), nowcast: t("topbar.mode.nowcast.value"), forecast: t("topbar.mode.forecast.value") };

function TabBar({ short = false }: { short?: boolean }) {
  const { tab, setTab } = useWS();
  const ref = useRef<HTMLDivElement>(null);
  const key = (e: React.KeyboardEvent, i: number) => {
    const j = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (j < 0) return;
    e.preventDefault(); setTab(TABS[j].id);
    (ref.current?.querySelectorAll("button")[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <div ref={ref} role="tablist" aria-label={t("tabs.label")} className="ws-glass inline-flex shrink-0 rounded-full p-1">
      {TABS.map((tb, i) => (
        <button key={tb.id} type="button" role="tab" id={`tab-${tb.id}`} aria-selected={tab === tb.id} aria-controls="ws-panel" tabIndex={tab === tb.id ? 0 : -1}
          onClick={() => setTab(tb.id)} onKeyDown={(e) => key(e, i)}
          className={`min-h-9 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors duration-200 ${tab === tb.id ? "bg-ink font-semibold text-white" : "text-muted hover:text-ink"}`}>
          {short ? tb.short : tb.label}
        </button>
      ))}
    </div>
  );
}

/** The live options say how old their data is when it is stale; the replay is the default and never stale. */
function useStormOptions() {
  const d = useData();
  const ncAge = d.nc.data ? ageH(d.nc.data.generated_at, d.now) : null, fcAge = d.fc.data ? ageH(d.fc.data.cycle_issue_time, d.now) : null;
  const ncStale = !!d.nc.data && (d.nc.data.stale || (ncAge !== null && ncAge > 3));
  const fcStale = !!d.fc.data && (d.fc.data.stale || !!d.win?.expired || (fcAge !== null && fcAge > 6));
  return [
    { id: "replay" as const, label: t("topbar.mode.replay.label"), sub: t("topbar.mode.replay.sub") },
    { id: "nowcast" as const, label: t("topbar.mode.nowcast.label"), sub: ncStale ? t("topbar.stale", { age: hoursText(ncAge) }) : t("topbar.mode.nowcast.sub") },
    { id: "forecast" as const, label: t("topbar.mode.forecast.label"), sub: fcStale ? t("topbar.stale", { age: hoursText(fcAge) }) : t("topbar.mode.forecast.sub") },
  ];
}

export function TopBar() {
  const { mode, setMode } = useWS();
  const options = useStormOptions();
  const chips = (
    <MenuChip<Mode> label={t("topbar.mode.label")} value={mode} valueText={MODE_TEXT[mode]} onChange={setMode}
      badge={<span className="rounded bg-ink px-1.5 py-0.5 text-[13px] font-semibold uppercase tracking-[0.02em] text-white">{MODE_BADGE[mode]}</span>} options={options} />
  );
  return (
    <>
      <div className="pointer-events-none absolute left-[68px] right-3 top-3 z-20 hidden items-start gap-3 lg:flex">
        <div className="pointer-events-auto"><TabBar /></div>
        <div className="pointer-events-auto mx-auto flex gap-2">{chips}</div>
      </div>
      <div className="absolute inset-x-0 top-0 z-20 lg:hidden">
        <div className="flex px-3 pt-3"><TabBar short /></div>
        <div className="flex gap-2 px-3 pt-2 [&_.ws-label]:hidden sm:[&_.ws-label]:block">{chips}</div>
      </div>
    </>
  );
}
