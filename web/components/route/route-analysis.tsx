"use client";
import { AlertTriangle, CircleSlash, Clock, Route as RouteIcon } from "lucide-react";
import { blockedHours, routeAtHour, routeFlags, type HourStatus, type RouteOption } from "@/lib/route";
import type { LocationView } from "@/lib/sample";
import { mi, tidyName } from "@/lib/format";
import { RouteStrip } from "@/components/workspace/route-strip";
import { t, tn } from "@/content/copy";

type Ranked = { o: RouteOption; s: HourStatus }[];
export type Group = { kind: string; title: string; ranked: Ranked };
type Copy = { label: string; cls: string; note: string };
const CLS = ["border-blue/30 bg-soft-blue text-blue", "border-alert/40 bg-softred text-alert", "border-[#7A0000] bg-[#7A0000] text-white"];
// The same three words as the map: no crossing flagged / Watch / Likely closed.
const REPLAY: Copy[] = [
  { label: t("route.badge.replay.open"), cls: CLS[0], note: t("route.note.replay.open") },
  { label: t("route.badge.replay.risk"), cls: CLS[1], note: t("route.note.replay.risk") },
  { label: t("route.badge.replay.blocked"), cls: CLS[2], note: t("route.note.replay.blocked") },
];
const LIVE: Copy[] = [
  { label: t("route.badge.live.open"), cls: CLS[0], note: t("route.note.live.open") },
  { label: t("route.badge.live.risk"), cls: CLS[1], note: t("route.note.live.risk") },
  { label: t("route.badge.live.blocked"), cls: CLS[2], note: t("route.note.live.blocked") },
];
export const routeMins = (s: number) => (s < 30 ? t("route.time.under") : s < 5400 ? t("route.time.min", { n: Math.round(s / 60) }) : t("route.time.hours", { h: Math.floor(s / 3600), m: Math.round((s % 3600) / 60) }));
const mins = routeMins;
const KIND = { fastest: t("route.kind.fastest"), alternate: t("route.kind.alternate"), backup: t("route.kind.backup"), detour: t("route.kind.detour") };
const BADGE = { fastest: t("route.badge.kind.fastest"), alternate: t("route.badge.kind.alternate"), backup: t("route.badge.kind.backup"), detour: t("route.badge.kind.detour") };

export function StatusBadge({ state, live }: { state: 0 | 1 | 2; live?: boolean }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[13px] font-semibold ${(live ? LIVE : REPLAY)[state].cls}`}>{(live ? LIVE : REPLAY)[state].label}</span>;
}

/** The caveats of the route view (ranking rule, the model's own road cross-check, the data disclaimer). They live under "How to read this". */
export function RouteNotes({ live, block, hour, hours }: { live: boolean; block: LocationView | null; hour: number; hours: number }) {
  return (
    <>
      <p>{live ? t("route.ranking.live") : t("route.ranking.replay")}</p>
      {block && !live && (
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink"><RouteIcon size={15} aria-hidden /> {t("route.block.title")}</p>
          {!block.assessed ? (
            <p className="mt-1">{t("route.block.unassessed")}</p>
          ) : (
            <p className="mt-1 leading-relaxed">
              {t("route.block.intro", { dist: mi(block.distanceKm ?? 0) })}{" "}
              {block.hours.some((h) => h.lost) ? t("route.block.lost", { lost: block.hours.filter((h) => h.lost).length, hours }) : t("route.block.always")}
              {block.hours[hour].lost ? t("route.block.thislost") : block.hours[hour].detour ? t("route.block.thisdetour", { detour: Number(block.hours[hour].detour) }) : ""}.{" "}
              {t("route.block.outro")}
            </p>
          )}
        </div>
      )}
      <p className="flex gap-2 leading-relaxed">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
        {live ? t("route.disclaimer.live") : t("route.disclaimer.replay")}
      </p>
    </>
  );
}

export function RouteAnalysis({ groups, focusId, onFocus, hour, hours, timeText, live, names, fastest, block, noRoute, noBackup = {}, inlineNotes = false }: {
  groups: Group[]; focusId: string | null; onFocus: (id: string) => void; hour: number; hours: number; timeText: (h: number) => string; live: boolean;
  names: Record<string, string>; fastest: Record<string, number>; block: LocationView | null; noRoute: { name: string; reason: string }[]; noBackup?: Record<string, boolean>;
  inlineNotes?: boolean; // the printed sheet has no "How to read this", so its notes are printed in place
}) {
  const live_ = groups.filter((g) => g.ranked.length);
  if (!live_.length) return null;
  const COPY = live ? LIVE : REPLAY;
  const all = live_.flatMap((g) => g.ranked);
  const cur = all.find((r) => r.o.id === focusId) ?? all[0];
  const group = live_.find((g) => g.ranked.includes(cur))!;
  const ranked = group.ranked, best = ranked[0];
  const { o, s } = cur;
  const bh = blockedHours(o.on, hours);
  const assessed = o.on.filter((c) => c.x);
  const extra = o.timeS - (fastest[o.serviceId] ?? o.timeS);
  const allBlocked = best.s.state === 2;
  const flags = routeFlags(o, group.kind, fastest[o.serviceId], s);

  return (
    <section aria-labelledby="ra" className="space-y-5">
      <div className={`rounded-2xl border p-4 ${allBlocked ? "border-[#7A0000] bg-softred" : "border-ink/10 bg-white"}`}>
        <p className="label">{cur === best ? (allBlocked ? (live ? t("route.label.allflagged", { kind: group.title.toLowerCase() }) : t("route.label.noopen", { kind: group.title.toLowerCase() })) : t("route.label.best", { kind: group.title.toLowerCase() })) : t("route.label.selected")}</p>
        <h2 id="ra" className="mt-1 font-display text-2xl font-bold leading-tight tracking-[-0.02em]">{names[o.serviceId]}</h2>
        <p className="mt-1 text-sm text-muted">{t("route.via", { kind: KIND[o.kind], road: tidyName(o.via) })}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge state={s.state} live={live} />
          <span className="tabular-nums text-[13px] text-muted">{timeText(hour)}</span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/80">{COPY[s.state].note}</p>
        {cur === best && (
          <p className="mt-2 text-sm leading-relaxed text-ink/85">
            {allBlocked
              ? (live
                ? (noRoute.length ? t("route.blocked.live.nodetour", { kind: group.title.toLowerCase() }) : t("route.blocked.live", { kind: group.title.toLowerCase() }))
                : (noRoute.length ? t("route.blocked.replay.nodetour", { kind: group.title.toLowerCase() }) : t("route.blocked.replay", { kind: group.title.toLowerCase() })))
              : live
                ? tn("route.first.live", ranked.length, { time: mins(o.timeS) })
                : tn("route.first.replay", ranked.length, { time: mins(o.timeS) })}
          </p>
        )}
      </div>

      {flags.length > 0 && (
        <ul className="space-y-2" aria-label={t("route.flags.aria")}>
          {flags.map((f) => (
            <li key={f.code} className={`flex gap-2 rounded-xl border px-3 py-2 text-sm ${f.level === "alert" ? "border-[#7A0000] bg-softred text-[#7A0000]" : "border-[#E6DFA3] bg-yellow text-ink"}`}>
              <Clock size={15} className="mt-0.5 shrink-0" aria-hidden /> <span><b className="font-semibold">{f.code === "slow" ? t("route.flag.slow") : f.code === "detour" ? t("route.flag.detour") : f.code === "unknown" ? t("route.flag.unknown") : t("route.flag.unassessed")}</b>{" "}{f.text}</span>
            </li>
          ))}
        </ul>
      )}

      <RouteStrip o={o} hour={hour} />

      <div>
        <h3 className="text-sm font-semibold">{live ? t("route.timeline.live") : t("route.timeline.replay")}</h3>
        <div className="mt-3 flex h-14 items-end gap-[3px]" aria-label={live ? t("route.timeline.aria.live") : t("route.timeline.aria.replay")}>
          {Array.from({ length: hours }, (_, h) => {
            const st = routeAtHour(o.on, h);
            return (
              <span key={h} title={t("route.timeline.bar", { time: timeText(h), status: COPY[st.state].label })}
                className={`flex-1 rounded-t-sm ${["bg-blue/70", "bg-alert", "bg-[#7A0000] hatch"][st.state]} ${h === hour ? "outline outline-2 outline-offset-1 outline-ink" : ""}`}
                style={{ height: ["30%", "62%", "100%"][st.state] }} />
            );
          })}
        </div>
        <p className="mt-2 text-[13px] text-muted">{live ? t("route.timeline.note.live") : t("route.timeline.note.replay")}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("route.options.title", { n: all.length })}</h3>
        {live_.map((g) => (
          <div key={g.kind} className="mt-3">
            <p className="label">{g.title}</p>
            <ol className="mt-1 divide-y divide-ink/10 border-y border-ink/10">
              {g.ranked.map(({ o: r, s: st }, i) => {
                const fl = routeFlags(r, g.kind, fastest[r.serviceId], st);
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => onFocus(r.id)} aria-pressed={r.id === o.id}
                      className={`grid min-h-12 w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 py-2 text-left transition-colors hover:bg-paper ${r.id === o.id ? "bg-soft-blue/60" : ""}`}>
                      <span className="tabular-nums text-[13px] text-muted">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="text-sm font-medium">{names[r.serviceId]}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted">
                          <span className="rounded border border-ink/20 bg-white px-1.5 py-px text-[13px] font-medium text-ink/75">{BADGE[r.kind]}</span>
                          <span>{[mins(r.timeS),
                            ...(r.timeS - (fastest[r.serviceId] ?? r.timeS) >= 30 ? [t("route.option.plus", { n: Math.round((r.timeS - fastest[r.serviceId]) / 60) })] : []),
                            ...(r.on.some((c) => !c.x) ? [t("route.option.unassessed", { n: r.on.filter((c) => !c.x).length })] : []),
                            ...(fl.some((f) => f.code === "slow") ? [t("route.option.slow")] : []),
                            ...(fl.some((f) => f.code === "detour") ? [t("route.option.detour")] : [])].join(" · ")}</span>
                        </span>
                        <span className="block text-[13px] text-muted">{[...(r.kind === "backup" ? [r.label] : []), t("route.option.via", { via: tidyName(r.via) })].join(" · ")}</span>
                      </span>
                      <StatusBadge state={st.state} live={live} />
                    </button>
                  </li>
                );
              })}
            </ol>
            {g.ranked.map((x) => x.o.serviceId).filter((id, i, a) => a.indexOf(id) === i && noBackup[id]).map((id) => (
              <p key={id} className="mt-1.5 flex gap-2 text-[13px] leading-relaxed text-ink/80"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />{t("route.nobackup", { name: names[id] })}</p>
            ))}
          </div>
        ))}
        {noRoute.map((n) => (
          <p key={n.name} className="mt-2 flex gap-2 text-[13px] text-alert"><CircleSlash size={14} className="mt-px shrink-0" aria-hidden />{t("route.noroute", { name: n.name, reason: n.reason })}</p>
        ))}
      </div>

      <details>
        <summary className="disclose flex min-h-11 cursor-pointer items-center text-sm font-medium text-blue">{t("route.details.title")}</summary>
        <dl className="grid grid-cols-2 gap-x-5 border-y border-ink/10">
          {([
            [t("route.fact.drive"), mins(o.timeS)],
            [t("route.fact.compare"), extra > 30 ? `+${mins(extra)}` : t("route.fact.fastest")],
            [t("route.fact.distance"), mi(o.km)],
            [t("route.fact.assessed"), t("common.of", { a: assessed.length, b: o.on.length })],
            [live ? t("route.fact.steps.live") : t("route.fact.steps.replay"), t("common.of", { a: bh.length, b: hours })],
            [live ? t("route.fact.first.live") : t("route.fact.first.replay"), bh.length ? timeText(bh[0]) : live ? t("route.fact.never.live") : t("route.fact.never.replay")],
          ] as [string, string][]).map(([k, v], i) => (
            <div key={k} className={`min-w-0 py-3 ${i < 4 ? "border-b border-ink/10" : ""}`}>
              <dt className="text-[13px] text-muted">{k}</dt>
              <dd className="mt-0.5 break-words tabular-nums text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </details>

      {inlineNotes && <div className="space-y-3 text-[13px] text-muted"><RouteNotes live={live} block={block} hour={hour} hours={hours} /></div>}
    </section>
  );
}
