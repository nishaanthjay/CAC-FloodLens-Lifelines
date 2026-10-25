"use client";
import { useEffect, useRef } from "react";
import { Activity, Droplets, Info, ListOrdered, Map as MapIcon, MapPinned, X } from "lucide-react";
import { useWS, type Tab } from "@/components/workspace/store";
import type { Icon } from "@/lib/workspace/tiers";
import { t } from "@/content/copy";

type Item = { id: string; label: string; icon: Icon; tab?: Tab; href?: string };
export const NAV: Item[] = [
  { id: "map", label: t("rail.map"), icon: MapIcon, tab: "water" },
  { id: "address", label: t("rail.address"), icon: MapPinned, tab: "access" },
  { id: "breaks", label: t("rail.breaks"), icon: ListOrdered, tab: "consequence" },
  { id: "status", label: t("rail.status"), icon: Activity, href: "/status" },
  { id: "about", label: t("rail.about"), icon: Info, href: "/about" },
];

/** Slim icon rail (desktop). The three workspace items switch tabs; Status and About are pages. */
export function Rail() {
  const { tab, setTab } = useWS();
  return (
    <nav aria-label={t("rail.nav")} className="ws-glass absolute inset-y-0 left-0 z-30 hidden w-14 flex-col items-center gap-1 rounded-none border-y-0 border-l-0 bg-white/90 py-3 lg:flex">
      <a href="/about" aria-label={t("rail.logo")} className="mb-3 grid h-9 w-9 place-items-center rounded-[10px] bg-blue text-white">
        <Droplets size={18} strokeWidth={1.8} aria-hidden />
      </a>
      {NAV.map((n) => {
        const on = n.tab === tab, I = n.icon;
        const cls = `group relative grid h-10 w-10 place-items-center rounded-xl transition-colors ${on ? "bg-blue/12 text-blue" : "text-ink/65 hover:bg-ink/5 hover:text-ink"}`;
        const tip = <span role="presentation" aria-hidden className="pointer-events-none absolute left-full top-1/2 z-40 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#1F2329] px-2 py-1 font-ui text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{n.label}</span>;
        const mark = on && <span aria-hidden className="absolute -left-2 h-5 w-1 rounded-full bg-blue" />;
        return n.href
          ? <a key={n.id} href={n.href} aria-label={n.label} className={cls}>{mark}<I size={19} strokeWidth={1.8} />{tip}</a>
          : <button key={n.id} type="button" aria-label={n.label} aria-current={on ? "page" : undefined} onClick={() => setTab(n.tab!)} className={cls}>{mark}<I size={19} strokeWidth={1.8} />{tip}</button>;
      })}
    </nav>
  );
}

/** Mobile: the same destinations as a bottom-sheet menu. */
export function MenuSheet() {
  const { menuOpen, setMenuOpen, tab, setTab } = useWS();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    first.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [menuOpen, setMenuOpen]);
  if (!menuOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("rail.menu.title")}>
      <button type="button" aria-label={t("rail.menu.close")} className="absolute inset-0 bg-ink/30" onClick={() => setMenuOpen(false)} tabIndex={-1} />
      <div className="ws-glass absolute inset-x-0 bottom-0 rounded-t-3xl bg-white/95 px-4 pb-6 pt-3 [animation:rise-sm_0.2s_ease-out]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/20" aria-hidden />
        <div className="mb-1 flex items-center justify-between"><h2 className="ws-label">{t("rail.menu.title")}</h2>
          <button ref={first} type="button" aria-label={t("rail.menu.close")} onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5"><X size={18} aria-hidden /></button></div>
        <ul>
          {NAV.map((n) => {
            const I = n.icon, on = n.tab === tab;
            const cls = `flex min-h-12 w-full items-center gap-3 rounded-xl px-3 font-ui text-[15px] font-medium ${on ? "bg-blue/10 text-blue" : "text-ink hover:bg-ink/5"}`;
            return <li key={n.id}>{n.href
              ? <a href={n.href} className={cls}><I size={19} strokeWidth={1.8} aria-hidden />{n.label}</a>
              : <button type="button" className={cls} onClick={() => { setTab(n.tab!); setMenuOpen(false); }}><I size={19} strokeWidth={1.8} aria-hidden />{n.label}</button>}</li>;
          })}
        </ul>
      </div>
    </div>
  );
}
