"use client";
import { Check, Link2, LoaderCircle, MapPin, Phone, Printer, Search, Siren } from "lucide-react";
import { ADDRESS_EXAMPLE } from "@/lib/geocode";
import { mi, mins } from "@/lib/format";
import { telHref } from "@/lib/services";
import { KindIcon } from "@/components/ui/kind-icon";
import { RouteAnalysis, RouteNotes, StatusBadge } from "@/components/route/route-analysis";
import { AnswerCard } from "@/components/workspace/answer-card";
import { useData } from "@/components/workspace/data";
import { FILTERS, SHOW_KIND, useRouting } from "@/components/workspace/routing";
import { useWS } from "@/components/workspace/store";
import { t } from "@/content/copy";

/** Access tab: address search, the nearest services, and the route analysis for the ones picked. All state lives in RoutingProvider. */
export function AccessSection() {
  const r = useRouting();
  const d = useData();
  const { mode } = useWS();
  const live = mode !== "replay";
  const X = d.X;

  return (
    <div className="mt-3">
      <form role="search" onSubmit={(e) => { e.preventDefault(); r.search(r.query); }}>
        <label htmlFor="ws-addr" className="sr-only">{t("access.address.label")}</label>
        <div className="flex items-center gap-1.5 rounded-full border border-ink/12 bg-white p-1 pl-3.5 shadow-sm focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15">
          <Search size={16} className="shrink-0 text-blue" aria-hidden />
          <input id="ws-addr" type="search" value={r.query} onChange={(e) => r.setQuery(e.target.value)} placeholder={t("access.address.placeholder")} autoComplete="street-address"
            className="min-h-10 w-full min-w-0 bg-transparent text-sm focus-visible:outline-none" />
          <button type="submit" disabled={r.busy} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-blue px-4 text-sm font-semibold text-white hover:bg-[#244d86] disabled:opacity-70">
            {r.busy && <LoaderCircle size={14} className="animate-spin" aria-hidden />} {t("access.address.go")}
          </button>
        </div>
      </form>
      <p className="mt-1.5 text-[13px] leading-snug text-muted">{t("access.address.hint", { example: ADDRESS_EXAMPLE })}</p>
      <p aria-live="polite" className="mt-1 min-h-4 text-xs text-alert">{d.error ? t("access.error.data", { error: d.error }) : r.msg}</p>
      {r.net.slow && (
        <p role="status" className="mt-1 rounded-xl border border-[#E6DFA3] bg-yellow px-3 py-2 text-[13px] font-semibold leading-snug">
          {(() => { const last = r.net.lastMs >= 1000 ? t("access.slow.seconds", { n: Math.round(r.net.lastMs / 1000) }) : t("access.slow.ms", { n: r.net.lastMs }); return r.net.timeouts ? t("access.slow.timeouts", { last, timeouts: r.net.timeouts }) : t("access.slow.plain", { last }); })()}
        </p>
      )}
      {r.slowWait && r.loading && <p role="status" className="mt-1 text-[13px] text-muted">{t("access.routing.slow")}</p>}
      {r.loading && !r.slowWait && <p role="status" className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><LoaderCircle size={12} className="animate-spin" aria-hidden /> {t("access.routing")}</p>}

      {r.origin && (
        <>
          <p className="mt-2 flex items-start gap-2 text-sm"><MapPin size={15} className="mt-0.5 shrink-0 text-blue" aria-hidden />
            <span className="min-w-0 break-words"><b className="font-semibold">{t("access.starting")}</b> {r.origin.label}</span></p>
          <div className="mt-2 flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={r.share} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3.5 text-xs font-semibold hover:border-blue">
              <Link2 size={13} aria-hidden /> {r.copied ? t("access.copied") : t("access.copy")}
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3.5 text-xs font-semibold hover:border-blue">
              <Printer size={13} aria-hidden /> {t("access.print")}
            </button>
            <a href={`/emergency?${new URLSearchParams({ lat: r.origin.lat.toFixed(5), lon: r.origin.lon.toFixed(5), label: r.origin.label })}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-alert/40 bg-softred px-3.5 text-xs font-semibold text-alert hover:border-alert">
              <Siren size={13} aria-hidden /> {t("access.emergency")}
            </a>
          </div>
        </>
      )}

      <AnswerCard />

      {r.services.length > 0 && (
        <details className="mt-3 rounded-xl border border-ink/10 bg-white/70">
          <summary className="disclose flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-medium text-ink">{t("access.other.title")}</summary>
          <div className="px-2.5 pb-3">
            <p className="mb-2 text-[13px] text-muted">{t("access.services.hint")}</p>
            <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label={t("access.services.filter")}>
              {FILTERS.map(([k, label]) => (
                <button key={k} type="button" onClick={() => r.setFilter(k)} aria-pressed={r.filter === k}
                  className={`min-h-11 rounded-full border px-3 text-[13px] font-medium transition-colors ${r.filter === k ? "border-blue bg-blue text-white" : "border-ink/15 bg-white text-ink/80 hover:border-blue"}`}>{label}</button>
              ))}
            </div>
            <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/80">
              {r.shown.map((s) => {
                const on = r.selected.includes(s.id), b = r.bestFor(s.id), trip = r.trips[s.id], tel = telHref(s.phone);
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => r.toggle(s.id)} aria-pressed={on}
                      className={`grid min-h-14 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-ink/[0.03] ${on ? "bg-blue/8" : ""}`}>
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${on ? "bg-blue text-white" : "bg-ink/5 text-ink"}`}>
                        {on ? <Check size={15} aria-hidden /> : <KindIcon kind={s.k} />}
                      </span>
                      <span className="min-w-0">
                        <span className="text-sm font-medium leading-snug">{s.name}</span>
                        <span className="block text-[13px] text-muted">{s.sub}{s.addr ? ` · ${s.addr}` : ""}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1 text-right">
                        <span className="tabular-nums text-sm">{s.timeS != null ? mins(s.timeS) : s.timeS === null ? t("common.noroute") : mi(s.straightKm, 0)}</span>
                        {on && (b ? <StatusBadge state={b.s.state} live={live} /> : trip === "loading" ? <LoaderCircle size={13} className="animate-spin text-muted" aria-label={t("access.routing.aria")} /> : null)}
                      </span>
                    </button>
                    {tel && (
                      <a href={tel} className="mb-1.5 ml-[3.1rem] inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-blue hover:underline"><Phone size={13} aria-hidden /> {t("common.call", { phone: s.phone ?? "" })}</a>
                    )}
                  </li>
                );
              })}
            </ul>
            <ServicesNote />
          </div>
        </details>
      )}

      {r.ranked.length > 0 && X && (
        <div className="mt-4 border-t border-ink/8 pt-4">
          <RouteAnalysis groups={r.groups} focusId={r.focus} onFocus={r.setFocusId} hour={r.hh} hours={X.hours} timeText={d.timeText} live={live}
            names={r.names} fastest={r.fastest} block={r.block} noRoute={r.noRoute} noBackup={r.noBackup} />
        </div>
      )}
      {!r.origin && !r.busy && (
        <p className="mt-3 rounded-xl bg-yellow p-3 text-xs leading-relaxed text-ink/80">
          {live ? t("access.empty.live") : t("access.empty.replay")}
        </p>
      )}
    </div>
  );
}

/** The "listing is not confirmed open" note, shown under the extra places and again under "How to read this". */
function ServicesNote() {
  const r = useRouting();
  return <p className="mt-1.5 text-[13px] leading-snug text-muted">{r.filter === "all" ? t("access.services.note.all", { kind: SHOW_KIND }) : t("access.services.note.kind", { kind: SHOW_KIND })}</p>;
}

/** Access-tab caveats for the panel's "How to read this" (ranking rule, the model's own road cross-check, disclaimers, how complete the place lists are). */
export function AccessNotes() {
  const r = useRouting(), d = useData(), { mode } = useWS();
  const live = mode !== "replay";
  return (
    <>
      <ServicesNote />
      {r.ranked.length > 0 && d.X && <RouteNotes live={live} block={r.block} hour={r.hh} hours={d.X.hours} />}
    </>
  );
}
