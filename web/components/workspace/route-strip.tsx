"use client";
import { Home, MapPin } from "lucide-react";
import type { OnRoute, RouteOption } from "@/lib/route";
import { mi } from "@/lib/format";
import { crossingLine, crossingName } from "@/lib/workspace/names";
import { tierOfCrossing } from "@/lib/workspace/stats";
import { TIERS } from "@/lib/workspace/tiers";
import { useData } from "@/components/workspace/data";
import { usePick } from "@/components/workspace/derived";
import { TierTag } from "@/components/workspace/ui";
import { t, tn } from "@/content/copy";

type Dot = { c: OnRoute; tier: number }; // tier: 0..4 a model tier, -1 assessed but no value this hour, -2 not assessed

/** A line from home to the destination with a dot at every crossing. Only Watch and above (and "no data") are named; the normal ones are folded away. */
export function RouteStrip({ o, hour }: { o: RouteOption; hour: number }) {
  const d = useData(), pick = usePick();
  const all = d.X?.assessed ?? [];
  const dots: Dot[] = o.on.map((c) => ({ c, tier: c.x ? tierOfCrossing(c.x, hour) : -2 }));
  const named = dots.filter((x) => x.tier >= 1 || x.tier === -1);
  const normal = dots.filter((x) => x.tier === 0);
  const unassessed = dots.filter((x) => x.tier === -2).length;
  const total = Math.max(o.km, 0.1);
  const go = (id: string) => {
    pick(id);
    window.setTimeout(() => document.getElementById("ws-crossing-card")?.scrollIntoView({ block: "nearest" }), 80);
  };
  const label = (x: Dot) => crossingLine(crossingName(x.c.x!, all));

  return (
    <div>
      <h3 className="text-sm font-semibold">{t("strip.title")}</h3>
      <div className="mt-3 flex items-center gap-2">
        <Home size={18} className="shrink-0 text-ink" aria-label={t("strip.home")} />
        <div className="relative h-8 flex-1" role="group" aria-label={t("strip.aria")}>
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded bg-ink/25" aria-hidden />
          {dots.filter((x) => x.tier !== -2).map((x) => {
            const left = `${Math.min(97, Math.max(3, (x.c.km / total) * 100))}%`;
            const tt = x.tier >= 0 ? TIERS[x.tier] : null;
            return (
              <button key={x.c.id} type="button" onClick={() => go(x.c.id)} aria-label={`${label(x)}: ${tt ? tt.label : t("strip.nodata")}`}
                className="absolute top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center after:absolute after:-inset-3.5 after:content-['']" style={{ left }}>
                <span className="block rounded-full" style={tt
                  ? { width: x.tier === 0 ? 9 : 16, height: x.tier === 0 ? 9 : 16, background: tt.fill, boxShadow: `inset 0 0 0 ${Math.max(1, tt.strokeW)}px ${tt.stroke}`, backgroundImage: x.tier >= 3 ? "repeating-linear-gradient(135deg, rgb(255 255 255 / .5) 0 2px, transparent 2px 5px)" : undefined }
                  : { width: 14, height: 14, background: "#fff", boxShadow: "inset 0 0 0 2px #6F7680", borderStyle: "dashed" }} />
              </button>
            );
          })}
        </div>
        <MapPin size={18} className="shrink-0 text-alert" aria-label={t("strip.dest")} />
      </div>

      {named.length > 0 && (
        <ul className="mt-2 space-y-1">
          {named.map((x) => (
            <li key={x.c.id}>
              <button type="button" onClick={() => go(x.c.id)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-ink/5">
                {x.tier >= 0 ? <TierTag tier={x.tier} className="shrink-0" /> : <span className="shrink-0 rounded-md bg-yellow px-1.5 py-0.5 text-[13px] font-medium">{t("strip.nodata")}</span>}
                <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink">{label(x)}</span>
                <span className="shrink-0 tabular-nums text-[13px] text-muted">{mi(x.c.km)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {named.length === 0 && dots.length > 0 && <p className="mt-2 text-[13px] text-muted">{t("strip.none")}</p>}
      {dots.length === 0 && <p className="mt-2 text-[13px] text-muted">{t("route.crossings.none", { n: all.length.toLocaleString() })}</p>}

      {normal.length > 0 && (
        <details className="mt-1">
          <summary className="disclose flex min-h-11 cursor-pointer items-center text-[13px] font-medium text-blue">{t("strip.normal", { n: normal.length })}</summary>
          <ul className="space-y-1 pb-1">
            {normal.map((x) => (
              <li key={x.c.id}>
                <button type="button" onClick={() => go(x.c.id)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-[13px] hover:bg-ink/5">
                  <span className="min-w-0 flex-1 text-ink/85">{label(x)}</span><span className="shrink-0 tabular-nums text-muted">{mi(x.c.km)}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {unassessed > 0 && <p className="mt-1 text-[13px] leading-snug text-muted">{tn("route.unassessed", unassessed)}</p>}
    </div>
  );
}
