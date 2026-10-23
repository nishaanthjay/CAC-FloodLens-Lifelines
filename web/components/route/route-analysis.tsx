"use client";
import { AlertTriangle, CircleSlash, Clock, Route as RouteIcon } from "lucide-react";
import { CLOSED, blockedHours, routeAtHour, routeFlags, type HourStatus, type RouteOption } from "@/lib/route";
import { band, utc, type LocationView } from "@/lib/sample";
import { Tag } from "@/components/ui/tags";

type Ranked = { o: RouteOption; s: HourStatus }[];
export type Group = { kind: string; title: string; ranked: Ranked };
type Copy = { label: string; cls: string; note: string };
const CLS = ["border-blue/30 bg-soft-blue text-blue", "border-alert/40 bg-softred text-alert", "border-[#7A0000] bg-[#7A0000] text-white"];
const REPLAY: Copy[] = [
  { label: "Open in replay", cls: CLS[0], note: "Open in this replay hour is not an all-clear: the replay sees river flow only, and streams the model did not assess are not counted." },
  { label: "At risk", cls: CLS[1], note: "Crosses streams above their 2-year flow, or the illustrative band for a crossing flooding is Elevated or higher (a placeholder, not a probability)." },
  { label: "Blocked in replay", cls: CLS[2], note: "Crosses at least one crossing whose stream is above its 10-year flow, which closes it in this scenario." },
];
const LIVE: Copy[] = [
  { label: "No crossing flagged", cls: CLS[0], note: "No crossing on this route is above its 10-year flow in this step. Not an all-clear: the forecast is unvalidated, sees river flow only, and crossings it could not assess are not counted." },
  { label: "At risk", cls: CLS[1], note: "A crossing on this route is above its 2-year flow in this step (unvalidated model flow, not a probability of closure)." },
  { label: "Crossing flagged", cls: CLS[2], note: "At least one crossing on this route is above its 10-year flow, which closes it in this scenario. A scenario level, not a probability of closure." },
];
const mins = (s: number) => (s < 5400 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`);
const KIND = { fastest: "Fastest route", alternate: "Alternative route", detour: "Detour around closed crossings" };

export function StatusBadge({ state, live }: { state: 0 | 1 | 2; live?: boolean }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 font-ui text-xs font-semibold ${(live ? LIVE : REPLAY)[state].cls}`}>{(live ? LIVE : REPLAY)[state].label}</span>;
}

export function RouteAnalysis({ groups, focusId, onFocus, hour, hours, timeText, live, names, fastest, block, noRoute, nAssessed }: {
  groups: Group[]; focusId: string | null; onFocus: (id: string) => void; hour: number; hours: number; timeText: (h: number) => string; live: boolean;
  names: Record<string, string>; fastest: Record<string, number>; block: LocationView | null; noRoute: { name: string; reason: string }[]; nAssessed: number;
}) {
  const live_ = groups.filter((g) => g.ranked.length);
  if (!live_.length) return null;
  const COPY = live ? LIVE : REPLAY, tag = live ? "forecast" : "replay";
  const all = live_.flatMap((g) => g.ranked);
  const cur = all.find((r) => r.o.id === focusId) ?? all[0];
  const group = live_.find((g) => g.ranked.includes(cur))!;
  const ranked = group.ranked, best = ranked[0];
  const { o, s } = cur;
  const bh = blockedHours(o.on, hours);
  const assessed = o.on.filter((c) => c.x), other = o.on.length - assessed.length;
  const extra = o.timeS - (fastest[o.serviceId] ?? o.timeS);
  const allBlocked = best.s.state === 2;
  const flags = routeFlags(o, group.kind, fastest[o.serviceId], s);

  return (
    <section aria-labelledby="ra" className="space-y-6">
      <div className={`rounded-2xl border p-5 ${allBlocked ? "border-[#7A0000] bg-softred" : "border-ink/10 bg-white"}`}>
        <p className="label text-muted">{cur === best ? `${allBlocked ? (live ? "Every route has a flagged crossing" : "No open route found") : "Best route"} · ${group.title.toLowerCase()}` : "Route you selected"}</p>
        <h2 id="ra" className="mt-1 font-display text-2xl font-bold leading-tight tracking-[-0.02em]">{names[o.serviceId]}</h2>
        <p className="mt-1 font-ui text-sm text-muted">{KIND[o.kind]} via {o.via}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge state={s.state} live={live} />
          <span className="font-mono text-xs text-muted">{timeText(hour)}</span>
        </div>
        <p className="mt-2 font-ui text-xs leading-relaxed text-muted">{COPY[s.state].note}</p>
        {cur === best && (
          <p className="mt-3 font-body text-sm leading-relaxed text-ink/80">
            {allBlocked
              ? `Every route found to the selected ${group.title.toLowerCase()} crosses a crossing that is ${live ? "flagged in the forecast" : "closed in this replay hour"}${noRoute.length ? ", and no detour around them was found" : ""}. Shown: the option with the fewest. Call 911 in an emergency.`
              : live
                ? `Ranked first of ${ranked.length} option${ranked.length > 1 ? "s" : ""}: no crossing flagged in this step, and ${mins(o.timeS)} in normal traffic. Not an all-clear.`
                : `Ranked first of ${ranked.length} option${ranked.length > 1 ? "s" : ""}: open in the replay this hour, illustrative flood band ${band(s.pFail)} (a placeholder, not a probability), and ${mins(o.timeS)} in normal traffic.`}
          </p>
        )}
      </div>

      {flags.length > 0 && (
        <ul className="space-y-2" aria-label="Flags for this route">
          {flags.map((f) => (
            <li key={f.code} className={`flex gap-2 rounded-xl border px-3 py-2 font-ui text-sm ${f.level === "alert" ? "border-[#7A0000] bg-softred text-[#7A0000]" : "border-[#E6DFA3] bg-yellow text-ink"}`}>
              <Clock size={15} className="mt-0.5 shrink-0" aria-hidden /> <span><b className="font-semibold">{f.code === "slow" ? "Long trip. " : f.code === "detour" ? "Long detour. " : f.code === "unknown" ? "No data. " : "Unassessed. "}</b>{f.text}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-2 gap-x-5 border-y border-ink/10">
        {([
          ["Drive time (normal roads)", mins(o.timeS), null],
          ["Compared with fastest", extra > 30 ? `+${mins(extra)}` : "Fastest", null],
          ["Distance", `${o.km.toFixed(1)} km`, null],
          live ? ["Crossings assessed on it", `${assessed.length} of ${o.on.length}`, false] : ["Illustrative flood band for a crossing on it", band(s.pFail), true],
          [live ? "Steps flagged in the forecast" : "Hours blocked in replay", `${bh.length} of ${hours}`, false],
          [live ? "First flagged" : "First blocked", bh.length ? timeText(bh[0]) : live ? "Not in this forecast" : "Not in this window", false],
        ] as [string, string, boolean | null][]).map(([k, v, syn], i) => (
          <div key={k} className={`min-w-0 py-3 ${i < 4 ? "border-b border-ink/10" : ""}`}>
            <dt className="font-ui text-xs text-muted">{k}{syn !== null && !(live && !syn) && <Tag synthetic={syn} label={tag} />}</dt>
            <dd className="mt-0.5 break-words font-mono text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="font-ui text-sm font-semibold">{live ? "This route, now and over the forecast" : "This route, hour by hour"}</h3>
        <div className="mt-3 flex h-14 items-end gap-[3px]" aria-label={live ? "Route status per step: now, then forecast hours" : "Route status per replay hour"}>
          {Array.from({ length: hours }, (_, h) => {
            const st = routeAtHour(o.on, h);
            return (
              <span key={h} title={`${timeText(h)}: ${COPY[st.state].label}${live ? "" : `, illustrative band ${band(st.pFail)}`}`}
                className={`flex-1 rounded-t-sm ${["bg-blue/70", "bg-alert", "bg-[#7A0000] hatch"][st.state]} ${h === hour ? "outline outline-2 outline-offset-1 outline-ink" : ""}`}
                style={{ height: live ? ["30%", "62%", "100%"][st.state] : `${Math.max(10, st.pFail * 100)}%` }} />
            );
          })}
        </div>
        <p className="mt-2 font-ui text-xs text-muted">
          {live
            ? <>Colour and height: status in that step <Tag synthetic={false} label="forecast" /> · first bar is now, then each forecast hour. Height is not a probability.</>
            : <>Colour: replay status <Tag synthetic={false} /> · height: illustrative flood band <Tag synthetic /></>}
        </p>
      </div>

      <div>
        <h3 className="font-ui text-sm font-semibold">Stream crossings on this route ({o.on.length})</h3>
        {assessed.length === 0 ? (
          <p className="mt-2 font-ui text-sm text-muted">None of the {nAssessed.toLocaleString()} assessed crossings lie on this route.</p>
        ) : (
          <ol className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
            {assessed.map((c) => {
              const lv = parseInt(c.x!.level[hour] ?? "-", 10), r = c.x!.ratio_q10[hour];
              return (
                <li key={c.id} className="grid grid-cols-[3.2rem_minmax(0,1fr)] gap-2 py-2.5">
                  <span className="font-mono text-xs text-muted">{c.km.toFixed(1)} km</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 font-ui text-sm font-medium">
                      <span className="min-w-0 break-words">{c.x!.name}</span>
                      {Number.isNaN(lv) ? <span className="rounded-full bg-yellow px-2 py-px font-ui text-[11px] font-semibold">no data</span>
                        : lv >= CLOSED ? <span className="rounded-full bg-alert px-2 py-px font-ui text-[11px] font-semibold text-white">{live ? "flagged" : "closed"}</span>
                        : lv > 0 ? <span className="rounded-full bg-softred px-2 py-px font-ui text-[11px] font-semibold text-alert">above 2-yr</span> : null}
                    </p>
                    <p className="mt-0.5 font-ui text-xs leading-relaxed text-muted">
                      Flow {r == null ? "unknown" : `${r}× the 10-year flow`} <Tag synthetic={false} label={tag} />
                      {live ? null : <> · illustrative flood band {band(c.x!.p_pct[hour] / 100)} <Tag synthetic /> · first above 10-yr {c.x!.first_above_RL10_utc ? utc(c.x!.first_above_RL10_utc) : "not in replay"}</>}
                      {" "}· FEMA {c.x!.fema_zone}
                      {c.x!.tidal ? " · tidal: surge may matter more than river flow" : ""}
                      {c.x!.basis === "osm" ? " · mapped from OpenStreetMap (a road-stream intersection that may not be a bridge)" : ""}
                      {" "}· {c.x!.people_affected.toLocaleString()} people affected if it closes alone
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {other > 0 && (
          <p className="mt-2 font-ui text-xs text-muted">
            Plus {other} stream crossing{other > 1 ? "s" : ""} the model could not assess (no matched stream reach or flow threshold). Unassessed is not the same as open.
          </p>
        )}
      </div>

      <div>
        <h3 className="font-ui text-sm font-semibold">All route options ({all.length})</h3>
        {live_.map((g) => (
          <div key={g.kind} className="mt-3">
            <p className="label text-muted">{g.title}</p>
            <ol className="mt-1 divide-y divide-ink/10 border-y border-ink/10">
              {g.ranked.map(({ o: r, s: st }, i) => {
                const fl = routeFlags(r, g.kind, fastest[r.serviceId], st);
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => onFocus(r.id)} aria-pressed={r.id === o.id}
                      className={`grid min-h-12 w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 py-2 text-left transition-colors hover:bg-paper ${r.id === o.id ? "bg-soft-blue/60" : ""}`}>
                      <span className="font-mono text-xs text-muted">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-ui text-sm font-medium">{names[r.serviceId]}</span>
                        <span className="block truncate font-ui text-xs text-muted">
                          {KIND[r.kind]} · {mins(r.timeS)}{live ? "" : ` · ${band(st.pFail)} band`}{r.on.some((c) => !c.x) ? ` · ${r.on.filter((c) => !c.x).length} unassessed` : ""}
                          {fl.some((f) => f.code === "slow") ? " · long trip" : ""}{fl.some((f) => f.code === "detour") ? " · long detour" : ""}
                        </span>
                      </span>
                      <StatusBadge state={st.state} live={live} />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        {noRoute.map((n) => (
          <p key={n.name} className="mt-2 flex gap-2 font-ui text-xs text-alert"><CircleSlash size={14} className="mt-px shrink-0" aria-hidden />{n.name}: {n.reason}.</p>
        ))}
        <p className="mt-2 font-ui text-xs leading-relaxed text-muted">
          {live
            ? "Ranking: fewest flagged crossings first (clear routes lead), then the shorter drive."
            : "Ranking: fewest closed crossings first (open routes lead), then the lower illustrative band value (in 5-point steps), then the shorter drive."}
        </p>
      </div>

      {block && !live && (
        <div className="rounded-2xl bg-soft-blue/60 p-4">
          <h3 className="flex items-center gap-2 font-ui text-sm font-semibold"><RouteIcon size={15} aria-hidden /> Cross-check: the model&rsquo;s own road network (Florence replay)</h3>
          {!block.assessed ? (
            <p className="mt-2 font-ui text-sm text-ink/80">Your Census block has no route in the model&rsquo;s network, so the replay did not assess it. That is a gap, not a low risk.</p>
          ) : (
            <p className="mt-2 font-ui text-sm leading-relaxed text-ink/80">
              In the pipeline&rsquo;s routing of your nearest Census block ({block.distanceKm?.toFixed(1)} km away), the block has
              {block.hours.some((h) => h.lost) ? ` no route to any emergency hospital in ${block.hours.filter((h) => h.lost).length} of ${hours} hours` : " a route to an emergency hospital in every hour"}
              {block.hours[hour].lost ? ", including this one" : block.hours[hour].detour ? `; this hour adds ${block.hours[hour].detour} min` : ""}.
              <Tag synthetic={false} /> Its road network and speeds differ from the routes above, so the two can disagree.
            </p>
          )}
        </div>
      )}

      <p className="flex gap-2 font-ui text-xs leading-relaxed text-muted">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
        {live
          ? "Routes from OpenStreetMap via Valhalla, normal traffic. Crossing status comes from the NOAA National Water Model short-range forecast (unvalidated, river flow only: no surge, tide or street flooding) compared with each stream's recurrence flows. Crossings are matched to a route within 30 m. Sample data, not validated, not for emergency use."
          : "Routes from OpenStreetMap via Valhalla, normal traffic. Closures come from the Florence 2018 replay (river flow only: no surge, tide or street flooding). Crossings are matched to a route within 30 m. Sample data, not validated, not for emergency use."}
      </p>
    </section>
  );
}
