"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { t } from "@/content/copy";
import { useRouting } from "@/components/workspace/routing";
import { useWS } from "@/components/workspace/store";
import { TOUR_KEY } from "@/components/workspace/tour";

export const WELCOME_KEY = "lifelines.welcome";
const DEEP = ["tab", "mode", "lat", "lon", "svc", "hour"]; // a shared or in-site link already says what to show: no card

/** First-load card over the dimmed map: one question, one address box. Remembers its dismissal; skipped for deep links. */
export function Welcome() {
  const r = useRouting(), { setTab, setTour } = useWS();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(WELCOME_KEY) === "1"; } catch { /* storage blocked: the card shows each visit */ }
    const sp = new URLSearchParams(window.location.search);
    const linked = DEEP.some((k) => sp.has(k)) || /(^|[#&])q=/.test(window.location.hash);
    if (!seen && !linked) setOpen(true);
  }, []);
  useEffect(() => { if (open) box.current?.focus(); }, [open]);

  const close = () => {
    try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    let toured = false;
    try { toured = localStorage.getItem(TOUR_KEY) === "done"; } catch { /* ignore */ }
    if (!toured) window.setTimeout(() => setTour(0), 700); // the quick tour, once, right after the card
  };
  const explore = () => { close(); setTab("water"); };
  const check = (text: string) => { const a = text.trim(); if (!a) return; close(); setTab("access"); r.setQuery(a); r.search(a); };
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && explore();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/35 px-4 py-6 backdrop-blur-[2px]">
      <div className="w-full max-w-lg">
        <section role="dialog" aria-modal="true" aria-labelledby="welcome-h" className="ws-glass rounded-3xl bg-white/95 p-6 shadow-float sm:p-8">
          <h2 id="welcome-h" className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">{t("welcome.title")}</h2>
          <form role="search" className="mt-6" onSubmit={(e) => { e.preventDefault(); check(q); }}>
            <label htmlFor="welcome-addr" className="sr-only">{t("welcome.label")}</label>
            <div className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-white p-1 pl-4 focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15">
              <Search size={18} className="shrink-0 text-blue" aria-hidden />
              <input ref={box} id="welcome-addr" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("welcome.placeholder")} autoComplete="street-address"
                className="min-h-11 w-full min-w-0 bg-transparent text-base focus-visible:outline-none" />
              <button type="submit" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-blue px-5 text-sm font-semibold text-white hover:bg-[#244d86]">{t("welcome.submit")} <ArrowRight size={16} aria-hidden /></button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <button type="button" onClick={() => check(t("welcome.example.address"))} className="min-h-11 font-medium text-blue underline underline-offset-4 hover:text-ink">{t("welcome.example")}</button>
            <button type="button" onClick={explore} className="min-h-11 text-muted underline underline-offset-4 hover:text-ink">{t("welcome.explore")}</button>
          </div>
        </section>
        <p role="note" className="ws-glass mx-auto mt-3 max-w-md rounded-xl bg-white/90 px-4 py-2.5 text-center text-sm text-ink/85">{t("welcome.notice")}</p>
      </div>
    </div>
  );
}
