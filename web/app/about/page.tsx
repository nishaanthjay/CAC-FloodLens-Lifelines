import type { Metadata } from "next";
import Image from "next/image";
import { Masthead } from "@/components/layout/masthead";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "About and limits",
  description: "What FloodLens Lifelines does, how it was tested, and what it does not claim.",
};

const tests = [
  ["0.958", "AUC: river flow at the hours flooded-road reports were filed, versus ordinary hours (74 reports, 66 crossings). Shows storm versus not-storm, not which road."],
  ["76.7%", "of 73 gauge-storms: modeled peak flow within a factor of 2 of USGS gauges, median peak-time error 4 hours."],
  ["91.3%", "of 150 test blocks: baseline drive time to the nearest hospital within 30% of OSRM."],
  ["0.69 to 0.72", "AUC across nine 2023 to 2025 NC storm windows: crossings near recorded closures ranked higher. Precision is low (about 5%)."],
  ["0.77", "AUC: the 11 Brunswick crossings on the Sheriff’s known-flood-point map rank above 1,435 other Brunswick crossings by people affected (11 crossings, one county)."],
];

const limits = [
  "We do not predict which roads will close. Crossing-level tests were weak or failed (AUC 0.55 against high-water marks, 0.58 against the Florence flood extent).",
  "We do not claim forecast skill. Every validation test is a hindcast or an operational-analysis replay.",
  "We never say a road, block or address is safe. A road that is not flagged is “not flagged in this scenario”, never an all-clear.",
  "Scenarios use river flow only: no storm surge, tide, street flooding, bridge deck height, scour or debris.",
  "Closure labels are positives only, and partly unreviewed.",
  "In the Florence replay the hazard layer saturates (241 of the 250 structure-seeded crossings exceed their 2-year flow at once, and about 1,228 of the 1,583 assessed crossings exceed their 10-year flow at the peak), so scenario levels barely separate. The model also did not reproduce Wilmington’s documented isolation.",
  "In Brunswick County the model slows people near the Sheriff’s known flood points but does not reproduce the Sheriff’s six service islands, and closing those crossings cuts no Census block off from an ER or fire station (AUC 0.58, 95% CI 0.44 to 0.72, no better than random closures).",
  "Address results are estimates from the nearest Census block, not the exact address.",
  "1,333 of the 1,583 assessed crossings are OpenStreetMap road-stream intersections that may not be bridges; the route page lets you leave them out. Dialysis, nursing-home, urgent-care, police and pharmacy lists come from federal / HHS files (dated per entry) and OpenStreetMap, EMS stations from OpenStreetMap only: all incomplete, none confirmed open. There is no shelter list.",
  "The live forecast is the NOAA National Water Model short-range run, unvalidated and river flow only. Observed gauge readings (nowcast) are shown beside it, not merged into route status.",
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
          Most flood tools answer &ldquo;is this road underwater?&rdquo; FloodLens Lifelines asks a different question: if a river crossing closes, can this neighborhood still reach an emergency room, fire station, dialysis center or other lifeline, and when does that change? It joins NOAA National Water Model streamflow, USGS and NWS gauges, NOAA tide stations, 2,920 road crossings (1,583 with a flow threshold, so assessed; the other 1,337 are flagged as unassessed, never treated as open) and a road network of about 246,000 segments with 11 emergency hospitals, 220 fire stations and a topped-up list of dialysis, nursing-home, urgent-care, police, EMS and pharmacy sites in New Hanover, Brunswick and Pender counties, North Carolina. The address check shows what is observed now and then the forecast; the Florence replay is kept apart.
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">Three modes, never mixed</h2>
        <dl className="mt-4 space-y-3 font-body text-lg leading-relaxed text-ink/80">
          <div><dt className="inline font-mono text-base font-semibold">REPLAY</dt> <dd className="inline">Hurricane Florence (2018), stepped through hour by hour. Fixed past data.</dd></div>
          <div><dt className="inline font-mono text-base font-semibold">NOWCAST</dt> <dd className="inline">Observed river gauges and coastal water levels, each stamped with its age and a stale flag.</dd></div>
          <div><dt className="inline font-mono text-base font-semibold">FORECAST</dt> <dd className="inline">Latest NWM short-range run as a share of each stream&rsquo;s 10-year flow. Unvalidated, not a closure probability.</dd></div>
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

        <h2 className="mt-14 font-display text-3xl font-bold">Case study: Florence, Brunswick County</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          The Brunswick County Sheriff&rsquo;s Office marked 20 known flood points on its 2018 evacuation map. We matched 12 of the 20 to 11 road crossings and checked them against our road model, with no flow or forecast input. This tests the road-network model, not the flood forecast.
        </p>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          Take point 10, the NC 211 (Southport-Supply Rd) bridge over Lockwoods Folly River near Supply. Close it and 4,681 people in 128 Census blocks, all in the Sheriff&rsquo;s Town Creek island, can no longer reach the nearest emergency room the way they do now, Novant Health Brunswick Medical Center. With all 11 matched crossings closed, those people go from an average of 12.6 minutes to the nearest ER to 24.3 minutes (+11.7); 3,242 of them are 10 minutes or more slower and 370 are 15 minutes or more slower. The worst block goes from 7.7 to 24.8 minutes, when the nearest ER becomes J. Arthur Dosher Memorial Hospital in Southport. Nobody loses every route; the model shows long detours, not cut-off areas.
        </p>
        <figure className="mt-6">
          <Image src="/case-study-brunswick.png" alt="Map of the Supply and Southport area in Brunswick County. The NC 211 bridge over Lockwoods Folly River is marked closed; dots for 128 Census blocks south and east of it are colored by added minutes to the nearest emergency room, mostly 8 to 17 minutes more, with Novant Health Brunswick Medical Center to the west and J. Arthur Dosher Memorial Hospital in Southport to the east." width={953} height={438} className="h-auto w-full rounded-2xl border border-ink/10" />
          <figcaption className="mt-2 font-ui text-xs leading-relaxed text-muted">
            The 128 blocks this one bridge slows by more than a minute, colored by added minutes in the run with all 11 matched crossings closed (<code>block_deltas.csv</code>). Scenario only; roads, no flow input.
          </figcaption>
        </figure>
        <p className="mt-6 font-body text-lg leading-relaxed text-ink/80">
          The model picks out the crossings that matter. The 11 matched crossings rank above the other 1,435 assessed Brunswick crossings by people affected (AUC 0.77, 95% CI 0.61 to 0.90): the places the Sheriff&rsquo;s Office flagged are the places where losing a crossing slows the most people.
        </p>
        <p className="mt-4 font-ui text-sm leading-relaxed text-muted">
          The flood-point map is dated 11 September 2018, before landfall, so the points are known flood spots, not confirmed closures; the islands map is dated 9 October 2018. One county, 11 crossings, river crossings only (no surge, tide or street flooding). Full report:{" "}
          <a className="text-blue underline underline-offset-4" href="https://github.com/nishaanthjay/CAC-FloodLens-Lifelines/blob/main/reports/phase2_bcso_islands.md">reports/phase2_bcso_islands.md</a>.
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">What we do not claim</h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 font-body text-lg leading-relaxed text-ink/80">
          {limits.map((l) => <li key={l}>{l}</li>)}
        </ul>

        <h2 className="mt-14 font-display text-3xl font-bold">Data and privacy</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          No account and no user data stored. Addresses you type go to OpenStreetMap Nominatim and routes to the public Valhalla router; neither is kept by us. Sources: NOAA, USGS, NCDOT, FEMA, US Census, CMS, NC OSFM, OpenStreetMap contributors, OpenFreeMap. Hourly NOAA forecast cycles are archived in an open repository: github.com/nishaanthjay/lifelines-nvm-archive.
        </p>

        <p className="mt-6 font-ui text-sm"><a className="text-blue underline underline-offset-4" href="/status">Data freshness status</a></p>
      </main>
      <Footer />
    </>
  );
}
