"use client";
import { X } from "lucide-react";
import { tidyName } from "@/lib/format";
import { utc } from "@/lib/sample";
import { TIERS } from "@/lib/workspace/tiers";
import { tierOfCrossing } from "@/lib/workspace/stats";
import { TierTag } from "@/components/workspace/ui";
import { useData } from "@/components/workspace/data";
import { useWS } from "@/components/workspace/store";

/** Card for the selected crossing: current tier and flow, people behind it, and its tier at every step so the hour slider has context. */
export function CrossingCard() {
  const d = useData();
  const { hour, mode, setHour } = useWS();
  const x = d.selectedId ? d.byId.get(d.selectedId) : null;
  if (!x || !d.X) return null;
  const h = Math.min(hour, d.X.hours - 1), t = tierOfCrossing(x, h), ratio = x.ratio_q10[h];
  const parts = tidyName(x.name).split(/ over /i);
  const steps = Array.from({ length: d.X.hours }, (_, i) => tierOfCrossing(x, i));
  return (
    <section aria-label="Selected crossing" className="mb-3 rounded-xl border border-ink/10 bg-white/80 p-3 [animation:rise-sm_0.2s_ease-out]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="ws-label">Selected crossing · <span className="font-mono normal-case tracking-normal">{x.id}</span></p>
          <h3 className="mt-0.5 font-display text-lg font-bold leading-snug">{parts[0]}</h3>
          {parts[1] && <p className="font-ui text-xs text-muted">over {parts[1]}</p>}
        </div>
        <button type="button" onClick={() => d.setSelectedId(null)} aria-label="Close crossing card" className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-ink/5"><X size={16} aria-hidden /></button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {t < 0 ? <span className="rounded-md bg-ink/5 px-1.5 py-0.5 font-ui text-xs font-medium">No model value this step (not assumed open)</span> : <TierTag tier={t} />}
        <span className="font-mono text-xs tabular-nums text-ink/80">{ratio === null || ratio === undefined ? "no flow value" : `${ratio.toFixed(2)}× the 10-year flow`}</span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-ui text-xs">
        <dt className="text-muted">People affected</dt><dd className="text-right font-mono tabular-nums">{x.people_affected.toLocaleString("en-US")}</dd>
        <dt className="text-muted">County</dt><dd className="text-right">{x.county}</dd>
        <dt className="text-muted">FEMA zone</dt><dd className="text-right font-mono">{x.fema_zone}</dd>
        {mode === "replay" && <><dt className="text-muted">First above 10-year flow</dt><dd className="text-right font-mono">{x.first_above_RL10_utc ? utc(x.first_above_RL10_utc) : "not in replay"}</dd></>}
      </dl>
      <div className="mt-2" role="group" aria-label="Tier at each step; select a step to move the time control">
        <div className="flex gap-[2px]">
          {steps.map((s, i) => (
            <button key={i} type="button" onClick={() => setHour(i)} aria-label={`H+${i}: ${s < 0 ? "no model value" : TIERS[s].label}`} title={`H+${i}: ${s < 0 ? "no model value" : TIERS[s].label}`}
              className={`h-5 min-w-0 flex-1 rounded-[3px] ${i === h ? "ring-2 ring-ink ring-offset-1" : ""}`}
              style={{ background: s < 0 ? "#fff" : TIERS[s].fill, boxShadow: `inset 0 0 0 ${s < 0 ? 1 : Math.max(1, TIERS[s].strokeW - 1)}px ${s < 0 ? "#8A97AB" : TIERS[s].stroke}`, backgroundImage: s >= 3 ? "repeating-linear-gradient(135deg, rgb(255 255 255 / .5) 0 2px, transparent 2px 5px)" : undefined }} />
          ))}
        </div>
        <p className="mt-1 flex justify-between font-mono text-[10px] text-muted"><span>H+0</span><span>H+{steps.length - 1}</span></p>
      </div>
      {x.tidal && <p className="mt-2 font-ui text-[11px] leading-snug text-ink/75">Tidal-influenced: river flow may not capture its flooding.</p>}
      {x.basis === "osm" && <p className="mt-1 font-ui text-[11px] leading-snug text-ink/75">OpenStreetMap road-stream intersection: may not be a bridge.</p>}
    </section>
  );
}
