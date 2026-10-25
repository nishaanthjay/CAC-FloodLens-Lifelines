"use client";
import { useState } from "react";
import { Droplets, Menu, X } from "lucide-react";
import { t } from "@/content/copy";

const links = [
  [t("masthead.link.emergency"), "/emergency"],
  [t("masthead.link.workspace"), "/"],
  [t("masthead.link.address"), "/?tab=access"],
  [t("masthead.link.breaks"), "/?tab=consequence"],
  [t("masthead.link.how"), "/about#how"],
  [t("masthead.link.limits"), "/about#limits"],
];

export function Masthead() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-40 border-b border-ink/10 print:static">
      <p role="note" className="bg-yellow px-4 py-1.5 text-center text-xs text-ink sm:text-sm">
        <strong className="font-semibold">{t("masthead.notice.strong")}</strong>
        <span className="opacity-70 sm:hidden"> {t("masthead.notice.short")}</span>
        <span className="hidden opacity-70 sm:inline"> {t("masthead.notice.long")}</span>
      </p>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <div className="flex min-h-[56px] items-center justify-between gap-6">
          <a href="/" className="inline-flex min-h-11 items-center gap-2.5" aria-label={t("masthead.home.label")}>
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-blue text-white">
              <Droplets size={18} strokeWidth={1.8} aria-hidden />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              <span className="text-blue">{t("site.brand.second")}</span>
            </span>
          </a>

          <nav aria-label={t("masthead.nav.primary")} className="hidden items-center gap-1 text-sm md:flex">
            {links.map(([text, href]) => (
              <a
                key={href}
                href={href}
                className="flex min-h-11 items-center rounded-full px-4 text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {text}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="grid min-h-11 min-w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5 md:hidden"
            aria-label={open ? t("masthead.menu.close") : t("masthead.menu.open")}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
          </button>
        </div>

        {open && (
          <nav aria-label={t("masthead.nav.mobile")} className="flex animate-[rise-sm_0.3s_cubic-bezier(0.16,1,0.3,1)] flex-col border-t border-ink/10 py-2 text-base md:hidden">
            {links.map(([text, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-xl px-3 text-ink/80 hover:bg-ink/5"
              >
                {text}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
