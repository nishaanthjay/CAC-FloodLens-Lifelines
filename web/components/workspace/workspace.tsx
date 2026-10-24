"use client";
import { useEffect, useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { MapControls } from "@/components/workspace/map-controls";
import { MapView } from "@/components/workspace/map-view";
import { LeftPanel } from "@/components/workspace/left-panel";
import { MenuSheet, Rail } from "@/components/workspace/rail";
import { RightPanel } from "@/components/workspace/right-panel";
import { Sheet } from "@/components/workspace/sheet";
import { WorkspaceData, useData } from "@/components/workspace/data";
import { WorkspaceState, useWS } from "@/components/workspace/store";
import { TimePill } from "@/components/workspace/time-pill";
import { TopBar } from "@/components/workspace/top-bar";

function useDesktop() {
  const [d, setD] = useState<boolean | null>(null);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)"), on = () => setD(q.matches);
    on(); q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return d;
}

function Shell() {
  const { sheetPx, hour, mode } = useWS();
  const d = useData();
  const desktop = useDesktop();
  return (
    <div id="content" className="fixed inset-0 overflow-hidden bg-[#E9EEF4] font-ui text-ink" style={{ "--sheet-h": `${desktop === false ? sheetPx : 0}px` } as React.CSSProperties}>
      <MapView />
      <Rail />
      <TopBar />
      {desktop === true && <><LeftPanel /><RightPanel /></>}
      {desktop === false && <Sheet />}
      <TimePill caption={d.base ? d.caption(hour) : undefined} disabled={mode === "nowcast"} />
      <MapControls />
      <MenuSheet />
    </div>
  );
}

/** The map workspace: a full-screen map with glass panels floating over it. */
export function Workspace() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <WorkspaceState><WorkspaceData><Shell /></WorkspaceData></WorkspaceState>
      </LazyMotion>
    </MotionConfig>
  );
}
