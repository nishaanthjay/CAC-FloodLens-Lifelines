"use client";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { LeftContent } from "@/components/workspace/left-panel";
import { RightContent } from "@/components/workspace/right-panel";
import { MODE_BADGE } from "@/components/workspace/top-bar";
import { useWS, type Snap } from "@/components/workspace/store";
import { t } from "@/content/copy";

const ORDER: Snap[] = ["peek", "half", "full"];
const snapPx = (s: Snap, vh: number) => (s === "peek" ? 148 : s === "half" ? Math.round(vh * 0.52) : vh - 64);

/** Mobile: both panels in one bottom sheet with three snap points (peek, half, full). Drag the handle, or press Enter on it to step through them. */
export function Sheet() {
  const { snap, setSnap, mode, setMenuOpen, setSheetPx } = useWS();
  const [vh, setVh] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ y: number; h: number; t: number } | null>(null);
  useEffect(() => { const on = () => setVh(window.innerHeight); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  const h = drag ?? snapPx(snap, vh);
  useEffect(() => { setSheetPx(h); }, [h, setSheetPx]);

  const down = (e: React.PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = { y: e.clientY, h: snapPx(snap, vh), t: performance.now() }; };
  const move = (e: React.PointerEvent) => { const s = start.current; if (s) setDrag(Math.max(snapPx("peek", vh), Math.min(snapPx("full", vh), s.h + s.y - e.clientY))); };
  const up = (e: React.PointerEvent) => {
    const s = start.current; start.current = null;
    if (!s) return;
    const dy = s.y - e.clientY, v = dy / Math.max(1, performance.now() - s.t); // px per ms, positive = up
    setDrag(null);
    if (Math.abs(dy) < 6) return setSnap(ORDER[(ORDER.indexOf(snap) + 1) % 3]);
    const target = Math.max(snapPx("peek", vh), Math.min(snapPx("full", vh), s.h + dy + v * 160)); // a flick carries it further
    setSnap(ORDER.reduce((a, b) => (Math.abs(snapPx(b, vh) - target) < Math.abs(snapPx(a, vh) - target) ? b : a)));
  };
  const key = (e: React.KeyboardEvent) => {
    const i = ORDER.indexOf(snap);
    if (e.key === "ArrowUp") { e.preventDefault(); setSnap(ORDER[Math.min(2, i + 1)]); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSnap(ORDER[Math.max(0, i - 1)]); }
  };
  return (
    <section aria-label={t("sheet.aria")} className={`ws-glass absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-b-none rounded-t-3xl bg-white/92 lg:hidden ${drag === null ? "transition-[height] duration-300 ease-out motion-reduce:transition-none" : ""}`} style={{ height: h }}>
      <div className="flex shrink-0 items-center gap-2 px-4 pb-1 pt-1.5">
        <button type="button" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
          aria-label={t("sheet.resize", { snap })} className="group -mx-4 flex min-h-11 flex-1 touch-none items-center gap-3 px-4">
          <span aria-hidden className="mx-0 h-1.5 w-10 shrink-0 rounded-full bg-ink/25 transition-colors group-hover:bg-ink/40" />
          <span className="rounded bg-ink px-1.5 py-0.5 text-[13px] font-semibold uppercase tracking-[0.02em] text-white">{MODE_BADGE[mode]}</span>
          <span className="min-w-0 text-[13px] font-medium text-ink/75">{t("sheet.notice")}</span>
        </button>
        <button type="button" onClick={() => setMenuOpen(true)} aria-label={t("sheet.menu")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-ink/5"><Menu size={19} aria-hidden /></button>
      </div>
      <div className={`ws-scroll min-h-0 flex-1 px-4 pb-8 ${snap === "peek" && drag === null ? "overflow-hidden" : "overflow-y-auto"}`}>
        <LeftContent />
        <div className="mt-5 border-t border-ink/10 pt-4"><RightContent /></div>
      </div>
    </section>
  );
}
