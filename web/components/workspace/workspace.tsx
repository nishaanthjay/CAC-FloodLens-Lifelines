"use client";
import { useEffect, useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { MapControls } from "@/components/workspace/map-controls";
import { MapView } from "@/components/workspace/map-view";
import { LeftPanel } from "@/components/workspace/left-panel";
import { MenuSheet, Rail } from "@/components/workspace/rail";
import { RightPanel } from "@/components/workspace/right-panel";
import { Sheet } from "@/components/workspace/sheet";
import { RouteAnalysis } from "@/components/route/route-analysis";
import { RoutingProvider, useRouting } from "@/components/workspace/routing";
import { WorkspaceData, useData } from "@/components/workspace/data";
import { WorkspaceState, useWS } from "@/components/workspace/store";
import { TimePill } from "@/components/workspace/time-pill";
import { TopBar } from "@/components/workspace/top-bar";
import { Welcome } from "@/components/workspace/welcome";
import { t } from "@/content/copy";

function useDesktop() {
  const [d, setD] = useState<boolean | null>(null);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)"), on = () => setD(q.matches);
    on(); q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return d;
}

/** Printed address check: only the route analysis, in plain type. The map and panels are hidden in print. */
function PrintSheet() {
  const r = useRouting(), d = useData(), { mode } = useWS();
  if (!r.origin || !r.ranked.length || !d.X) return null;
  const live = mode !== "replay";
  return (
    <div className="hidden bg-white px-6 py-4 text-black print:block">
      <h1 className="font-display text-3xl font-bold">{t("workspace.print.title")}</h1>
      <p className="mt-2 text-xs font-semibold text-alert">{live ? t("workspace.print.live") : t("workspace.print.replay")} {t("workspace.print.warning")}</p>
      <p className="mt-3 text-sm"><b>{t("access.starting")}</b> {r.origin.label}</p>
      <div className="mt-4">
        <RouteAnalysis groups={r.groups} focusId={r.focus} onFocus={r.setFocusId} hour={r.hh} hours={d.X.hours} timeText={d.timeText} live={live}
          names={r.names} fastest={r.fastest} block={r.block} noRoute={r.noRoute} noBackup={r.noBackup} inlineNotes />
      </div>
    </div>
  );
}

function Shell() {
  const { sheetPx, hour, mode } = useWS();
  const d = useData();
  const desktop = useDesktop();
  return (
    <>
    <main id="content" className="fixed inset-0 print:hidden overflow-hidden bg-[#E9EEF4] text-ink" style={{ "--sheet-h": `${desktop === false ? sheetPx : 0}px` } as React.CSSProperties}>
      <h1 className="sr-only">{t("workspace.heading")}</h1>
      <Rail />
      <TopBar />
      {desktop === true && <><LeftPanel /><RightPanel /></>}
      {desktop === false && <Sheet />}
      <TimePill caption={d.base ? d.caption(hour) : undefined} disabled={mode === "nowcast"} />
      <MapControls />
      <MenuSheet />
      <Welcome />
      {/* Last in the DOM so keyboard users reach the controls before the map; z-0 keeps it underneath. */}
      <MapView />
    </main>
    <PrintSheet />
    </>
  );
}

/** The map workspace: a full-screen map with glass panels floating over it. */
export function Workspace() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <WorkspaceState><WorkspaceData><RoutingProvider><Shell /></RoutingProvider></WorkspaceData></WorkspaceState>
      </LazyMotion>
    </MotionConfig>
  );
}
