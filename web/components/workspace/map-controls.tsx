"use client";
import { m } from "framer-motion";
import { Cross, Maximize, Minus, Plus } from "lucide-react";
import { useWS } from "@/components/workspace/store";

/** Bottom-right glass stack: zoom, reset view, and a facilities toggle. */
export function MapControls() {
  const { api, facilities, setFacilities, snap, rightOpen } = useWS();
  const btn = "grid h-10 w-10 place-items-center text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink";
  return (
    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24, ease: "easeOut" }}
      className={`absolute right-3 bottom-[calc(var(--sheet-h,0px)+96px)] z-20 lg:bottom-3 ${rightOpen ? "lg:right-[384px]" : "lg:right-3"} ${snap === "full" ? "max-lg:hidden" : ""}`}>
      <div className="ws-glass flex flex-col divide-y divide-ink/8 overflow-hidden rounded-xl" role="group" aria-label="Map controls">
        <button type="button" className={btn} aria-label="Zoom in" onClick={() => api.current?.zoomIn()}><Plus size={17} aria-hidden /></button>
        <button type="button" className={btn} aria-label="Zoom out" onClick={() => api.current?.zoomOut()}><Minus size={17} aria-hidden /></button>
        <button type="button" className={btn} aria-label="Reset view to Cape Fear" onClick={() => api.current?.reset()}><Maximize size={16} aria-hidden /></button>
        <button type="button" className={`${btn} ${facilities ? "bg-blue/10 text-blue" : ""}`} aria-label="Hospitals and fire stations" aria-pressed={facilities} onClick={() => setFacilities(!facilities)}><Cross size={16} aria-hidden /></button>
      </div>
    </m.div>
  );
}
