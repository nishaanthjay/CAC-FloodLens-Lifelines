"use client";
import { useEffect, useRef, useState } from "react";
import { useWS } from "@/components/workspace/store";
import { t } from "@/content/copy";

export const TOUR_KEY = "lifelines.tour";
type Step = { find: () => HTMLElement | null; text: () => string };
const visible = (el: HTMLElement | null) => !!el && el.getClientRects().length > 0;
const q = (sel: string) => () => [...document.querySelectorAll<HTMLElement>(sel)].find(visible) ?? null; // the desktop and phone tab bars both exist; take the one on screen

// 1 address box (or the Access tab when the address box is not on screen), 2 the tabs, 3 the time bar, 4 "How to read this".
const STEPS: Step[] = [
  { find: () => (visible(document.getElementById("ws-addr")) ? document.getElementById("ws-addr")!.parentElement : q("[role=tab][id=tab-access]")()), text: () => (visible(document.getElementById("ws-addr")) ? t("tour.addr") : t("tour.addr.tab")) },
  { find: q("[role=tablist]"), text: () => t("tour.tabs") },
  { find: q("[role=group][aria-label='Time control']"), text: () => t("tour.time") },
  { find: () => document.getElementById("ws-how-left") ?? document.getElementById("ws-how-right"), text: () => t("tour.how") },
];

/** A four-step tooltip tour. Starts once after the welcome card, never repeats on its own; the "?" in the rail runs it again. */
export function Tour() {
  const { tour, setTour, setSnap } = useWS();
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [steps, setSteps] = useState<number[]>([]); // indexes of the steps that have something on screen
  const next = useRef<HTMLButtonElement>(null);

  const finish = () => { try { localStorage.setItem(TOUR_KEY, "done"); } catch { /* ignore */ } setTour(null); };
  const pos = tour === null ? -1 : tour;
  const at = steps[pos] ?? -1;

  useEffect(() => { if (tour === 0) setSnap("half"); }, [tour, setSnap]); // phone: open the sheet so the targets are on screen

  useEffect(() => {
    if (tour === null) return;
    const measure = () => {
      const ok = STEPS.map((s, i) => (visible(s.find()) ? i : -1)).filter((i) => i >= 0);
      setSteps((old) => (old.join() === ok.join() ? old : ok));
      const el = at >= 0 ? STEPS[at].find() : null;
      if (!el) { setBox(null); return; }
      const r = el.getBoundingClientRect();
      setBox((b) => (b && Math.abs(b.x - r.left) < 1 && Math.abs(b.y - r.top) < 1 && Math.abs(b.w - r.width) < 1 && Math.abs(b.h - r.height) < 1 ? b : { x: r.left, y: r.top, w: r.width, h: r.height }));
    };
    measure();
    const id = window.setInterval(measure, 250);
    window.addEventListener("resize", measure);
    return () => { window.clearInterval(id); window.removeEventListener("resize", measure); };
  }, [tour, at]);

  useEffect(() => { if (at >= 0) STEPS[at].find()?.scrollIntoView({ block: "nearest" }); }, [at]);
  useEffect(() => { if (box) next.current?.focus({ preventScroll: true }); }, [at, !!box]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tour === null) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && finish();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (tour === null || at < 0 || !box) return null;
  const last = pos >= steps.length - 1;
  const W = 300, vw = typeof window === "undefined" ? 1200 : window.innerWidth, vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const below = box.y + box.h + 170 < vh;
  const left = Math.max(12, Math.min(vw - W - 12, box.x + box.w / 2 - W / 2));
  const top = below ? box.y + box.h + 12 : Math.max(12, box.y - 12 - 150);
  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div aria-hidden className="absolute rounded-xl ring-4 ring-blue/60" style={{ left: box.x - 4, top: box.y - 4, width: box.w + 8, height: box.h + 8, boxShadow: "0 0 0 9999px rgb(17 17 17 / 0.28)" }} />
      <div role="dialog" aria-label={t("tour.aria")} className="pointer-events-auto absolute rounded-2xl bg-white p-4 shadow-float" style={{ left, top, width: W }}>
        <p className="text-[13px] text-muted">{t("tour.step", { n: pos + 1, total: steps.length })}</p>
        <p className="mt-1 text-sm leading-snug text-ink">{STEPS[at].text()}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={finish} className="min-h-11 rounded-full px-3 text-sm font-medium text-muted hover:text-ink">{t("tour.skip")}</button>
          <button ref={next} type="button" onClick={() => (last ? finish() : setTour(pos + 1))} className="min-h-11 rounded-full bg-blue px-5 text-sm font-semibold text-white hover:bg-[#244d86]">{last ? t("tour.done") : t("tour.next")}</button>
        </div>
      </div>
    </div>
  );
}
