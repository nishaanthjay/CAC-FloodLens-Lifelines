"use client";
import { m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Cross, Maximize, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { useWS, type LayerSel } from "@/components/workspace/store";
import { t } from "@/content/copy";

/** Bottom-right glass stack: zoom, reset view, and a facilities toggle. */
export function MapControls() {
  const { api, facilities, setFacilities, snap, rightOpen, layer, setLayer } = useWS();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", esc); };
  }, [open]);
  const layers: { id: LayerSel; label: string; sub: string }[] = [
    { id: "rivers", label: t("topbar.layer.rivers.label"), sub: t("topbar.layer.rivers.sub") },
    { id: "coastal", label: t("topbar.layer.coastal.label"), sub: t("topbar.layer.coastal.sub") },
    { id: "both", label: t("topbar.layer.both.label"), sub: t("topbar.layer.both.sub") },
  ];
  const btn = "grid h-10 w-10 place-items-center text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink";
  return (
    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24, ease: "easeOut" }}
      ref={box} className={`absolute right-3 bottom-[calc(var(--sheet-h,0px)+96px)] z-20 lg:bottom-3 ${rightOpen ? "lg:right-[384px]" : "lg:right-3"} ${snap === "full" ? "max-lg:hidden" : ""}`}>
      <div className="ws-glass flex flex-col divide-y divide-ink/8 overflow-hidden rounded-xl" role="group" aria-label={t("mapcontrols.group")}>
        <button type="button" className={btn} aria-label={t("mapcontrols.zoomin")} onClick={() => api.current?.zoomIn()}><Plus size={17} aria-hidden /></button>
        <button type="button" className={btn} aria-label={t("mapcontrols.zoomout")} onClick={() => api.current?.zoomOut()}><Minus size={17} aria-hidden /></button>
        <button type="button" className={btn} aria-label={t("mapcontrols.reset")} onClick={() => api.current?.reset()}><Maximize size={16} aria-hidden /></button>
        <button type="button" className={`${btn} ${open ? "bg-blue/10 text-blue" : ""}`} aria-label={t("mapcontrols.options")} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)}><SlidersHorizontal size={16} aria-hidden /></button>
        <button type="button" className={`${btn} ${facilities ? "bg-blue/10 text-blue" : ""}`} aria-label={t("mapcontrols.facilities")} aria-pressed={facilities} onClick={() => setFacilities(!facilities)}><Cross size={16} aria-hidden /></button>
      </div>
      {open && (
        <div role="dialog" aria-label={t("mapcontrols.options")} className="ws-glass absolute bottom-0 right-full mr-2 w-64 rounded-xl p-3 [animation:rise-sm_0.18s_ease-out]">
          <p className="ws-label">{t("topbar.layer.label")}</p>
          <div role="radiogroup" aria-label={t("topbar.layer.label")} className="mt-1">
            {layers.map((l) => (
              <label key={l.id} className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-ink/5">
                <input type="radio" name="ws-layer" checked={layer === l.id} onChange={() => setLayer(l.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#2D5DA1]" />
                <span><span className="block text-sm font-semibold text-ink">{l.label}</span><span className="block text-[13px] text-muted">{l.sub}</span></span>
              </label>
            ))}
          </div>
        </div>
      )}
    </m.div>
  );
}
