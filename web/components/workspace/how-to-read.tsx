"use client";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { useWS } from "@/components/workspace/store";
import { reducedMotion } from "@/lib/workspace/camera";
import { t } from "@/content/copy";

export type HowPanel = "left" | "right";

/** The one collapsible at the bottom of a panel: every caveat, source note and definition lives here. Nothing is deleted, only tucked away. */
export function HowToRead({ panel, children }: { panel: HowPanel; children: ReactNode }) {
  const { how, setHow } = useWS();
  return (
    <details id={`ws-how-${panel}`} open={how[panel]} onToggle={(e) => setHow(panel, (e.currentTarget as HTMLDetailsElement).open)} className="mt-4 border-t border-ink/10 pt-1">
      <summary className="disclose flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
        <Info size={16} aria-hidden className="shrink-0 text-blue" />{t("howto.title")}
      </summary>
      <div className="space-y-3 pb-2 text-[13px] leading-snug text-ink/80">{children}</div>
    </details>
  );
}

/** A small (i) next to a number: opens "How to read this" and scrolls to it. */
export function InfoDot({ panel, className = "" }: { panel: HowPanel; className?: string }) {
  const { setHow } = useWS();
  const go = () => {
    setHow(panel, true);
    window.setTimeout(() => document.getElementById(`ws-how-${panel}`)?.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" }), 60);
  };
  return (
    <button type="button" onClick={go} aria-label={t("howto.info")} title={t("howto.info")}
      className={`${className.includes("absolute") ? "" : "relative"} inline-grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted hover:text-ink after:absolute after:-inset-2.5 after:content-[''] ${className}`}>
      <Info size={15} aria-hidden />
    </button>
  );
}
