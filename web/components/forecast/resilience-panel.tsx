"use client";
import { ExternalLink, House, Info, Search } from "lucide-react";
import { hourTime, type LocationView } from "@/lib/sample";
import { useSample } from "@/components/forecast/sample-store";

/** One bar per replay hour: dark when the replay finds no route to an emergency hospital, light otherwise. */
function Timeline({ loc, hour }: { loc: LocationView; hour: number }) {
  return (
    <div className="mt-8" aria-label="Replay hours with and without a route to an emergency hospital">
      <p className="mb-2 font-ui text-xs font-semibold text-ink">Hours with no route</p>
      <div className="flex h-10 items-end gap-[3px]">
        {loc.hours.map((h, i) => (
          <span
            key={i}
            title={`Hour ${i}: ${h.lost ? "no route to an emergency hospital in the replay" : "a route exists in the replay"}`}
            className={`h-full flex-1 rounded-sm border border-ink/10 ${h.lost ? "bg-ink hatch" : "bg-soft-blue"} ${i === hour ? "outline outline-2 outline-offset-2 outline-blue" : ""}`}
          />
        ))}
      </div>
      <p className="mt-3 font-ui text-xs leading-relaxed text-muted">
        Dark: no route to an emergency hospital in that replay hour. Light: a route exists.
      </p>
    </div>
  );
}

export function ResiliencePanel() {
  const { data, hour, selected: loc, select, crossingName } = useSample();
  const start = data?.meta.event.replay_start_utc;
  const h = loc?.hours[hour];
  const lostHours = loc ? loc.hours.filter((x) => x.lost).length : 0;

  const metrics: [string, string][] = !loc || !h || !loc.assessed ? [] : [
    ["Detour", h.lost ? "No route" : h.detour ? `+${h.detour} min` : "1 min or less"],
    ["Critical crossing", h.crit ? crossingName(h.crit) : "None closed on the usual route"],
    ["Route redundancy", `${h.red} ER${h.red === 1 ? "" : "s"} within 30 min (usually ${loc.baselineRed ?? "-"})`],
    ["Hours without a route", `${lostHours} of ${loc.hours.length}`],
  ];

  return (
    <div className="mt-12 grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
      <section className="reveal rounded-3xl border border-ink/10 bg-white p-7 sm:p-10 lg:col-span-2" aria-labelledby="res" aria-live="polite">
        <div className="min-w-0">
          <h3 id="res" className="font-ui text-sm font-semibold">{loc ? loc.name : "Your route"}</h3>
          <p className="mt-1 font-ui text-sm text-muted">
            {loc ? `Census block · ${loc.county} County · ${loc.basis}` : "Emergency hospital access"}
          </p>
        </div>

        {!loc ? (
          <>
            <p className="mt-8 font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">Pick a place to see its route</p>
            <p className="mt-4 inline-flex items-center gap-2 font-ui text-sm text-muted">
              <Search size={16} aria-hidden />
              Choose a neighborhood on the right or on the map, or search an address above for full route analysis.
            </p>
          </>
        ) : !loc.assessed ? (
          <>
            <p className="mt-8 font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">Not assessed</p>
            <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-ink/75">
              This block sits on a road fragment with no route to an emergency hospital in the model&rsquo;s road network, so it was not assessed. That is
              a gap in the model, not a low risk.
            </p>
          </>
        ) : (
          <>
            <p className="mt-8 font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
              {h!.lost ? "No route to an emergency hospital in this replay hour" : "Not flagged in this replay hour"}
            </p>
            <Timeline loc={loc} hour={hour} />
          </>
        )}

        {metrics.length > 0 && (
          <dl className="mt-10 grid grid-cols-1 gap-x-8 border-t border-ink/10 sm:grid-cols-2">
            {metrics.map(([label, value], index) => (
              <div key={label} className={`min-w-0 py-5 ${index < metrics.length - 2 ? "border-b border-ink/10" : ""} ${index === metrics.length - 2 ? "max-sm:border-b sm:border-b-0 border-ink/10" : ""}`}>
                <dt className="font-ui text-xs leading-snug text-muted">{label}</dt>
                <dd className="mt-1.5 break-words font-mono text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {loc && (
          <a
            href={`/route?${new URLSearchParams({ lat: String(loc.lat), lon: String(loc.lon), label: loc.name })}`}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-blue px-5 font-ui text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#244d86] hover:shadow-lift"
          >
            Plan routes from here <ExternalLink size={15} aria-hidden />
            <span className="sr-only">(opens in a new window)</span>
          </a>
        )}
        {loc?.county === "New Hanover" && (
          <p className="mt-5 rounded-xl bg-yellow px-4 py-3 font-ui text-xs leading-relaxed text-ink/80">
            In 2018 Wilmington was cut off, but this replay shows little loss of access in New Hanover. The gap comes from the model&rsquo;s crossing list
            and road network, so low values here are not evidence of low exposure.
          </p>
        )}
        <p className="mt-5 font-mono text-xs leading-relaxed text-muted">
          Replay hour {hour}: {start ? hourTime(start, hour) : "…"} <span className="px-1">|</span> Source: Florence 2018 hindcast
        </p>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6">
        <details className="reveal group rounded-3xl border border-[#E6DFA3] bg-yellow">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-7 py-4 font-ui text-sm font-semibold marker:hidden sm:px-8 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Info size={17} strokeWidth={1.8} aria-hidden />
              What this means
            </span>
            <span className="text-xl transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <div className="space-y-3 px-7 pb-7 font-body text-sm leading-relaxed text-ink/80">
            <p>
              <b>Replay</b> values come from re-running Hurricane Florence through the model&rsquo;s road network: which crossings&rsquo; streams ran above
              their 10-year flow, and what that did to drive times to emergency hospitals.
            </p>
            <p>
              The replay is a past storm, not a forecast. It sees river flow only, so a route that stays open here can still flood from surge or street water.
            </p>
          </div>
        </details>

        <section className="reveal rounded-3xl bg-soft-blue/60 p-7 sm:p-8" aria-labelledby="watch">
          <h3 id="watch" className="font-ui text-sm font-semibold">Neighborhoods to explore</h3>
          <ul className="mt-4">
            {(data?.sites ?? []).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => select(s)}
                  aria-pressed={loc?.id === s.id}
                  className={`flex min-h-14 w-full items-center gap-3 border-b border-ink/10 py-3 text-left transition-colors hover:text-blue ${loc?.id === s.id ? "text-blue" : ""}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-blue">
                    <House size={16} strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-ui text-sm font-medium leading-snug">{s.name.replace(" (block centroid)", "")}</span>
                    <span className="mt-0.5 block font-ui text-xs text-muted">{s.county} County</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 font-ui text-xs font-semibold ${!s.assessed ? "bg-white text-muted" : s.hours[hour].lost ? "bg-ink text-white" : "bg-white text-ink"}`}>
                    {!s.assessed ? "Not assessed" : s.hours[hour].lost ? "No route" : "Route exists"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-5 font-ui text-xs leading-relaxed text-muted">
            Real Census block centers, routed in the Florence replay.
          </p>
        </section>
      </div>
    </div>
  );
}
