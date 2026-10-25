"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

export type Tab = "water" | "access" | "consequence";
export type Mode = "replay" | "nowcast" | "forecast";
export type LayerSel = "rivers" | "coastal" | "both";
export type Snap = "peek" | "half" | "full";

export const TABS: { id: Tab; label: string }[] = [
  { id: "water", label: "Water" },
  { id: "access", label: "Access" },
  { id: "consequence", label: "Consequence" },
];

/** Handle the map registers so controls outside it (zoom buttons, table rows) can drive the camera. */
export type MapApi = { zoomIn: () => void; zoomOut: () => void; reset: () => void; flyTo: (lon: number, lat: number, zoom?: number) => void };

type Ctx = {
  api: MutableRefObject<MapApi | null>;
  facilities: boolean; setFacilities: (v: boolean) => void;
  sheetPx: number; setSheetPx: (n: number) => void;
  tab: Tab; setTab: (t: Tab) => void;
  mode: Mode; setMode: (m: Mode) => void;
  layer: LayerSel; setLayer: (l: LayerSel) => void;
  hour: number; setHour: (h: number) => void;
  hours: number; setHours: (n: number) => void;
  playing: boolean; setPlaying: (p: boolean) => void;
  rightOpen: boolean; setRightOpen: (o: boolean) => void;
  snap: Snap; setSnap: (s: Snap) => void;
  menuOpen: boolean; setMenuOpen: (o: boolean) => void;
  unit: "people" | "blocks"; setUnit: (u: "people" | "blocks") => void;
};

const WS = createContext<Ctx | null>(null);
export const useWS = () => useContext(WS)!;

const isTab = (v: string | null): v is Tab => v === "water" || v === "access" || v === "consequence";
export const STEP_MS = 700;

/** UI state of the workspace. Data lives in data.tsx; this holds only what the controls change. */
export function WorkspaceState({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => { const t = params.get("tab"); return isTab(t) ? t : params.get("lat") || params.get("svc") ? "access" : "water"; });
  const [mode, setMode] = useState<Mode>(() => { const m = params.get("mode"); return m === "nowcast" ? "nowcast" : m === "forecast" ? "forecast" : "replay"; });
  const [layer, setLayer] = useState<LayerSel>("both");
  const [hour, setHourRaw] = useState(() => Math.max(0, Number(params.get("hour")) || 0));
  const [hours, setHours] = useState(18);
  const [playing, setPlaying] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [snap, setSnap] = useState<Snap>("half");
  const [menuOpen, setMenuOpen] = useState(false);
  const [unit, setUnit] = useState<"people" | "blocks">("people");
  const [facilities, setFacilities] = useState(true);
  const [sheetPx, setSheetPx] = useState(0);
  const api = useRef<MapApi | null>(null);

  const setHour = (h: number) => setHourRaw(Math.max(0, Math.min(h, hours - 1)));
  // The right panel starts closed on narrower desktops so the map keeps a usable centre.
  useEffect(() => { if (window.innerWidth < 1280) setRightOpen(false); }, []);
  // Keep the URL shareable: tab and mode only (an address never goes into the URL).
  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("tab", tab);
    u.searchParams.set("mode", mode);
    window.history.replaceState(null, "", u.pathname + u.search + u.hash);
  }, [tab, mode]);
  // Play: one step every 700 ms, stops on the last hour.
  const at = useRef({ hour, hours });
  at.current = { hour, hours };
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const { hour: h, hours: n } = at.current;
      if (h >= n - 1) setPlaying(false); else setHourRaw(h + 1);
    }, STEP_MS);
    return () => clearInterval(t);
  }, [playing]);
  useEffect(() => { if (hour > hours - 1) setHourRaw(Math.max(0, hours - 1)); }, [hours, hour]);
  // Pause when the tab is hidden; a background timer would keep stepping an animation nobody sees.
  useEffect(() => {
    const on = () => document.hidden && setPlaying(false);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const v = useMemo<Ctx>(() => ({ api, facilities, setFacilities, sheetPx, setSheetPx, tab, setTab, mode, setMode, layer, setLayer, hour, setHour, hours, setHours, playing, setPlaying, rightOpen, setRightOpen, snap, setSnap, menuOpen, setMenuOpen, unit, setUnit }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, mode, layer, hour, hours, playing, rightOpen, snap, menuOpen, unit, facilities, sheetPx]);
  return <WS.Provider value={v}>{children}</WS.Provider>;
}
