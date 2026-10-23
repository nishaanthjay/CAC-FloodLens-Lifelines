import type { Metadata } from "next";
import { Masthead } from "@/components/layout/masthead";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "About and limits",
  description: "What FloodLens Lifelines does, how it was tested, and what it does not claim.",
};

const tests = [
  ["0.958", "AUC: river flow at the hours flooded-road reports were filed, versus ordinary hours (74 reports, 66 crossings). Shows storm versus not-storm, not which road."],
  ["76.7%", "of 73 gauge-storms: modelled peak flow within a factor of 2 of USGS gauges, median peak-time error 4 hours."],
  ["91.3%", "of 150 test blocks: baseline drive time to the nearest hospital within 30% of OSRM."],
  ["0.69 to 0.72", "AUC across nine 2023 to 2025 NC storm windows: crossings near recorded closures ranked higher. Precision is low (about 5%)."],
];

const limits = [
  "We do not predict which roads will close. Crossing-level tests were weak or failed (AUC 0.55 against high-water marks, 0.58 against the Florence flood extent).",
  "We do not claim forecast skill. Every validation test is a hindcast or an operational-analysis replay.",
  "We never say a road, block or address is safe. A road that is not flagged is “not flagged in this scenario”, never an all-clear.",
  "Scenarios use river flow only: no storm surge, tide, street flooding, bridge deck height, scour or debris.",
  "Closure labels are positives only, and partly unreviewed.",
  "In the Florence replay the hazard layer saturates (241 of 250 crossings exceed their 2-year flow at once), so scenario levels barely separate. The model also did not reproduce Wilmington’s documented isolation.",
  "Address results are estimates from the nearest Census block, not the exact address.",
];

export default function About() {
  return (
    <>
      <Masthead />
      <main id="content" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="font-display text-5xl font-black leading-tight tracking-[-0.03em]">About and limits</h1>
        <p role="note" className="mt-6 rounded-2xl border border-alert/30 bg-softred p-5 font-ui text-base font-semibold text-alert">
          Not for emergency use. In an emergency, call 911. This is a scenario and nowcast tool for a student pilot, not a warning service.
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">What it does</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          Most flood tools answer &ldquo;is this road underwater?&rdquo; FloodLens Lifelines asks a different question: if a river crossing closes, can this neighborhood still reach a hospital or fire station, and when does that change? It joins NOAA National Water Model streamflow, USGS and NWS gauges, NOAA tide stations, 2,920 road crossings and a road network of about 246,000 segments with 11 emergency hospitals and 220 fire stations in New Hanover, Brunswick and Pender counties, North Carolina.
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">Four modes, never mixed</h2>
        <dl className="mt-4 space-y-3 font-body text-lg leading-relaxed text-ink/80">
          <div><dt className="inline font-mono text-base font-semibold">REPLAY</dt> <dd className="inline">Hurricane Florence (2018), stepped through hour by hour. Fixed past data.</dd></div>
          <div><dt className="inline font-mono text-base font-semibold">NOWCAST</dt> <dd className="inline">Observed river gauges and coastal water levels, each stamped with its age and a stale flag.</dd></div>
          <div><dt className="inline font-mono text-base font-semibold">FORECAST</dt> <dd className="inline">Latest NWM short-range run as a share of each stream&rsquo;s 10-year flow. Unvalidated, not a closure probability.</dd></div>
          <div><dt className="inline font-mono text-base font-semibold">OUTLOOK</dt> <dd className="inline">A placeholder that holds the latest tide residual constant. Not surge guidance.</dd></div>
        </dl>

        <h2 className="mt-14 font-display text-3xl font-bold">What testing showed</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">Tests were written down before the data was pulled, run once, and the failures are published too.</p>
        <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
          {tests.map(([n, t]) => (
            <li key={n} className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-5">
              <span className="font-display text-2xl font-bold text-blue">{n}</span>
              <span className="font-ui text-sm leading-relaxed text-ink/80">{t}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 font-display text-3xl font-bold">What we do not claim</h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 font-body text-lg leading-relaxed text-ink/80">
          {limits.map((l) => <li key={l}>{l}</li>)}
        </ul>

        <h2 className="mt-14 font-display text-3xl font-bold">Data and privacy</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          No account and no user data stored. Addresses you type go to OpenStreetMap Nominatim and routes to the public Valhalla router; neither is kept by us. Basic, cookie-free page-view counts are collected to see whether the site is used. Sources: NOAA, USGS, NCDOT, FEMA, US Census, CMS, NC OSFM, OpenStreetMap contributors, OpenFreeMap.
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">Who built it</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          Built by Nishaanth Jay for the Congressional App Challenge, with ML work by Shreyas Thota. An AI coding assistant (Claude Code) wrote much of the code and documents. Thanks to Brunswick County Emergency Management and the Brunswick County Sheriff&rsquo;s Office for Florence context.
        </p>
        <p className="mt-6 font-ui text-sm"><a className="text-blue underline underline-offset-4" href="/status">Data freshness status</a></p>
      </main>
      <Footer />
    </>
  );
}
