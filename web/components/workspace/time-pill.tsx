"use client";
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useWS } from "@/components/workspace/store";
import { t } from "@/content/copy";

export const HINT_KEY = "lifelines.hint";

/** Bottom-centre time control: play/pause, H+0 to H+n ticks, a draggable thumb, the hour in mono, and a Now chip. */
export function TimePill({ caption, disabled }: { caption?: string; disabled?: boolean }) {
  const { hour, hours, setHour, playing, setPlaying, snap, rightOpen } = useWS();
  const track = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(false); // "Drag to watch the storm": only until the visitor has moved the time once
  useEffect(() => { try { if (localStorage.getItem(HINT_KEY) !== "1") setHint(true); } catch { /* storage blocked: no nagging hint */ } }, []);
  const used = () => { if (!hint) return; setHint(false); try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ } };
  const last = Math.max(1, hours - 1);
  const pos = (i: number) => (i / last) * 100;
  const from = (e: React.PointerEvent) => {
    used();
    const r = track.current!.getBoundingClientRect();
    setHour(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * last));
  };
  const key = (e: React.KeyboardEvent) => {
    used();
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (d) { e.preventDefault(); setHour(hour + d); }
    else if (e.key === "Home") { e.preventDefault(); setHour(0); }
    else if (e.key === "End") { e.preventDefault(); setHour(last); }
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); setPlaying(!playing); }
  };
  const labels = [...Array(Math.floor(last / 3) + 1).keys()].map((k) => k * 3).filter((h) => last - h >= 3).concat(last);
  return (
    <div className={`pointer-events-none absolute inset-x-3 bottom-[calc(var(--sheet-h,0px)+8px)] z-20 lg:bottom-3 lg:left-[460px] ${rightOpen ? "lg:right-[436px]" : "lg:right-[64px]"} ${snap === "full" ? "max-lg:hidden" : ""}`}>
    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16, ease: "easeOut" }} className="pointer-events-auto mx-auto max-w-[520px]">
      <div className="ws-glass rounded-3xl px-3 pb-1.5 pt-2.5" role="group" aria-label={t("timepill.group")}>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => { used(); setPlaying(!playing); }} disabled={disabled || hours < 2} aria-label={playing ? t("timepill.pause") : t("timepill.play")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40">
            {playing ? <Pause size={15} fill="currentColor" aria-hidden /> : <Play size={15} fill="currentColor" aria-hidden className="translate-x-px" />}
          </button>
          <button type="button" onClick={() => { setPlaying(false); setHour(0); }} disabled={disabled} aria-label={t("timepill.jump")}
            className={`min-h-8 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-40 ${hour === 0 ? "border-ink bg-ink/5 text-ink" : "border-ink/15 text-ink/75 hover:border-ink/40"}`}>{t("timepill.now")}</button>
          <div ref={track} className="relative mx-1.5 h-9 flex-1 touch-none select-none" onPointerDown={(e) => { if (disabled) return; e.currentTarget.setPointerCapture(e.pointerId); setPlaying(false); from(e); }} onPointerMove={(e) => e.buttons && !disabled && from(e)}>
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink/12" />
            <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink/70" style={{ width: `${pos(hour)}%` }} />
            {Array.from({ length: hours }, (_, i) => <span key={i} aria-hidden className={`absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 ${i % 3 === 0 ? "h-3 bg-ink/45" : "h-2 bg-ink/25"}`} style={{ left: `${pos(i)}%` }} />)}
            <div role="slider" tabIndex={disabled ? -1 : 0} aria-label={t("timepill.slider")} aria-valuemin={0} aria-valuemax={last} aria-valuenow={hour} aria-valuetext={caption ? t("timepill.valuetext.caption", { hour, caption }) : t("common.hour", { hour })} aria-disabled={disabled}
              onKeyDown={key} className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-ink bg-white shadow-md transition-[left] duration-150 ease-out active:cursor-grabbing motion-reduce:transition-none" style={{ left: `${pos(hour)}%` }} />
          </div>
          <span className="w-[46px] shrink-0 text-right tabular-nums text-sm font-semibold tabular-nums" aria-live="off">{hours < 2 ? t("timepill.now") : t("common.hour", { hour })}</span>
        </div>
        <div aria-hidden className="relative ml-[92px] mr-[62px] mt-0.5 h-4 tabular-nums text-[13px] text-muted max-sm:ml-[84px] max-sm:mr-[56px]">
          {hours > 1 && labels.map((h) => <span key={h} className="absolute -translate-x-1/2" style={{ left: `${pos(h)}%` }}>{t("common.hour", { hour: h })}</span>)}
        </div>
        {caption && <p className="pb-1 text-center tabular-nums text-[13px] text-ink/80">{caption}</p>}
        {hint && !disabled && hours > 1 && <p role="note" className="pb-1.5 text-center text-[13px] font-medium text-blue">{t("timepill.hint")}</p>}
      </div>
    </m.div>
    </div>
  );
}
