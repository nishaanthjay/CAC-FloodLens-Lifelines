"use client";
import { X } from "lucide-react";
import { tidyName } from "@/lib/format";
import { utc } from "@/lib/sample";
import { TIERS } from "@/lib/workspace/tiers";
import { tierOfCrossing } from "@/lib/workspace/stats";
import { TierTag } from "@/components/workspace/ui";
import { useData } from "@/components/workspace/data";
import { useWS } from "@/components/workspace/store";
import { t } from "@/content/copy";

/** Card for the selected crossing: current tier and flow, people behind it, and its tier at every step so the hour slider has context. */
export function CrossingCard() {
  const d = useData();
  const { hour, mode, setHour } = useWS();
  const x = d.selectedId ? d.byId.get(d.selectedId) : null;
  if (!x || !d.X) return null;
  const h = Math.min(hour, d.X.hours - 1), tier = tierOfCrossing(x, h), ratio = x.ratio_q10[h];
  const parts = tidyName(x.name).split(/ over /i);
  const steps = Array.from({ length: d.X.hours }, (_, i) => tierOfCrossing(x, i));
  return (
    <section aria-label={t("crossing.aria")} className="mb-3 rounded-xl border border-ink/10 bg-white/80 p-3 [animation:rise-sm_0.2s_ease-out]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="ws-label">{t("crossing.label")} · <span className="font-mono normal-case tracking-normal">{x.id}</span></p>
          <h3 className="mt-0.5 font-display text-lg font-bold leading-snug">{parts[0]}</h3>
          {parts[1] && <p className="font-ui text-xs text-muted">{t("crossing.over", { name: parts[1] })}</p>}
        </div>
        <button type="button" onClick={() => d.setSelectedId(null)} aria-label={t("crossing.close")} className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-ink/5"><X size={16} aria-hidden /></button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {tier < 0 ? <span className="rounded-md bg-ink/5 px-1.5 py-0.5 font-ui text-xs font-medium">{t("crossing.novalue")}</span> : <TierTag tier={tier} />}
        <span className="font-mono text-xs tabular-nums text-ink/80">{ratio === null || ratio === undefined ? t("crossing.noflow") : t("crossing.ratio", { ratio: ratio.toFixed(2) })}</span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-ui text-xs">
        <dt className="text-muted">{t("crossing.people")}</dt><dd className="text-right font-mono tabular-nums">{x.people_affected.toLocaleString("en-US")}</dd>
        <dt className="text-muted">{t("crossing.county")}</dt><dd className="text-right">{x.county}</dd>
        <dt className="text-muted">{t("crossing.fema")}</dt><dd className="text-right font-mono">{x.fema_zone}</dd>
        {mode === "replay" && <><dt className="text-muted">{t("crossing.first")}</dt><dd className="text-right font-mono">{x.first_above_RL10_utc ? utc(x.first_above_RL10_utc) : t("crossing.notinreplay")}</dd></>}
      </dl>
      <div className="mt-2" role="group" aria-label={t("crossing.steps")}>
        <div className="flex gap-[2px]">
          {steps.map((s, i) => (
            <button key={i} type="button" onClick={() => setHour(i)} aria-label={t("crossing.step", { hour: i, tier: s < 0 ? t("crossing.step.novalue") : TIERS[s].label })} title={t("crossing.step", { hour: i, tier: s < 0 ? t("crossing.step.novalue") : TIERS[s].label })}
              className={`h-5 min-w-0 flex-1 rounded-[3px] ${i === h ? "ring-2 ring-ink ring-offset-1" : ""}`}
              style={{ background: s < 0 ? "#fff" : TIERS[s].fill, boxShadow: `inset 0 0 0 ${s < 0 ? 1 : Math.max(1, TIERS[s].strokeW - 1)}px ${s < 0 ? "#8A97AB" : TIERS[s].stroke}`, backgroundImage: s >= 3 ? "repeating-linear-gradient(135deg, rgb(255 255 255 / .5) 0 2px, transparent 2px 5px)" : undefined }} />
          ))}
        </div>
        <p className="mt-1 flex justify-between font-mono text-[10px] text-muted"><span>{t("common.hour", { hour: 0 })}</span><span>{t("common.hour", { hour: steps.length - 1 })}</span></p>
      </div>
      {x.tidal && <p className="mt-2 font-ui text-[11px] leading-snug text-ink/75">{t("crossing.tidal")}</p>}
      {x.basis === "osm" && <p className="mt-1 font-ui text-[11px] leading-snug text-ink/75">{t("crossing.osm")}</p>}
    </section>
  );
}
