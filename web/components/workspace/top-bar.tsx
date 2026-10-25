"use client";
import { useRef } from "react";
import { MenuChip } from "@/components/workspace/ui";
import { TABS, useWS, type LayerSel, type Mode } from "@/components/workspace/store";
import { t } from "@/content/copy";

export const MODE_BADGE: Record<Mode, string> = { replay: t("topbar.mode.replay.badge"), nowcast: t("topbar.mode.nowcast.badge"), forecast: t("topbar.mode.forecast.badge") };
const MODE_TEXT: Record<Mode, string> = { replay: t("topbar.mode.replay.value"), nowcast: t("topbar.mode.nowcast.value"), forecast: t("topbar.mode.forecast.value") };

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
    <div ref={ref} role="tablist" aria-label={t("tabs.label")} className="ws-glass inline-flex shrink-0 rounded-full p-1">
      {TABS.map((t, i) => (
        <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="ws-panel" tabIndex={tab === t.id ? 0 : -1}
          onClick={() => setTab(t.id)} onKeyDown={(e) => key(e, i)}
          className={`min-h-9 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors duration-200 ${tab === t.id ? "bg-ink font-semibold text-white" : "text-muted hover:text-ink"}`}>
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
      <MenuChip<Mode> label={t("topbar.mode.label")} value={mode} valueText={MODE_TEXT[mode]} onChange={setMode}
        badge={<span className="rounded bg-ink px-1.5 py-0.5 text-[13px] font-semibold uppercase tracking-[0.02em] text-white">{MODE_BADGE[mode]}</span>}
        options={[{ id: "replay", label: t("topbar.mode.replay.label"), sub: t("topbar.mode.replay.sub") }, { id: "nowcast", label: t("topbar.mode.nowcast.label"), sub: t("topbar.mode.nowcast.sub") }, { id: "forecast", label: t("topbar.mode.forecast.label"), sub: t("topbar.mode.forecast.sub") }]} />
      <MenuChip<LayerSel> label={t("topbar.layer.label")} value={layer} valueText={layer === "rivers" ? t("topbar.layer.rivers.label") : layer === "coastal" ? t("topbar.layer.coastal.label") : t("topbar.layer.both.label")} onChange={setLayer}
        options={[{ id: "rivers", label: t("topbar.layer.rivers.label"), sub: t("topbar.layer.rivers.sub") }, { id: "coastal", label: t("topbar.layer.coastal.label"), sub: t("topbar.layer.coastal.sub") }, { id: "both", label: t("topbar.layer.both.label"), sub: t("topbar.layer.both.sub") }]} />
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
