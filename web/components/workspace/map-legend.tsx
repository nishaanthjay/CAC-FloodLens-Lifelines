"use client";
import { Flame, Hospital } from "lucide-react";
import { InfoDot } from "@/components/workspace/how-to-read";
import { useWS } from "@/components/workspace/store";
import { LEVELS } from "@/lib/workspace/tiers";
import { t } from "@/content/copy";

/** Always-visible key: the four risk words (as drawn on the bubbles), the facility icons and the route line; what bubble size means on this tab. */
export function MapLegend() {
  const { tab, snap } = useWS();
  const size = tab === "consequence" ? t("legend.size.people") : tab === "water" ? t("legend.size.water") : null;
  return (
    <div role="group" aria-label={t("legend.aria")}
      className={`ws-glass absolute left-3 z-10 rounded-xl px-3 py-2 text-[13px] leading-tight text-ink/85 bottom-[calc(var(--sheet-h,0px)+136px)] lg:bottom-9 lg:left-[68px] ${snap === "full" ? "max-lg:hidden" : ""}`}>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {LEVELS.map((l) => (
          <li key={l.id} className="flex items-center gap-1.5">
            <span aria-hidden className="block h-3.5 w-3.5 rounded-full" style={{ background: `${l.fill}59`, boxShadow: `inset 0 0 0 ${Math.max(1, l.strokeW)}px ${l.stroke}` }} />
            {l.label}
          </li>
        ))}
        <li className="-my-1"><InfoDot panel="left" className="lg:inline-grid" /></li>
      </ul>
      <ul className="mt-1 hidden flex-wrap items-center gap-x-3 gap-y-1 lg:flex">
        <li className="flex items-center gap-1.5"><Hospital size={14} className="text-alert" aria-hidden />{t("legend.hospital")}</li>
        <li className="flex items-center gap-1.5"><Flame size={14} aria-hidden />{t("legend.fire")}</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="block h-[3px] w-5 rounded bg-blue" />{t("legend.route")}</li>
      </ul>
      {size && <p className="mt-1 text-muted">{size}</p>}
    </div>
  );
}
