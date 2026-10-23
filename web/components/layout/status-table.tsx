"use client";
import { useEffect, useState } from "react";
import { ageH, hoursText, useLive } from "@/lib/live";

const LAYERS = [
  ["nowcast.json", "Nowcast: river gauges", 3],
  ["coastal.json", "Nowcast: coastal water levels", 3],
  ["forecast_latest.json", "Forecast preview (NWM short range)", 6],
] as const;

type Stamped = { generated_at: string };

function Row({ file, label, limit, now }: { file: string; label: string; limit: number; now: number }) {
  const { data, error } = useLive<Stamped>(file, true);
  const age = data ? ageH(data.generated_at, now) : null;
  const stale = age === null || age > limit;
  return (
    <tr className="border-t border-ink/10">
      <th scope="row" className="py-3 pr-4 text-left font-ui text-sm font-semibold">{label}</th>
      <td className="py-3 pr-4 font-mono text-xs">{error ?? data?.generated_at ?? "loading"}</td>
      <td className="py-3 pr-4 font-ui text-sm">{error ? "unavailable" : data ? hoursText(age) : ""}</td>
      <td className="py-3">
        {(data || error) && (
          <span className={`rounded-full border px-2.5 py-0.5 font-ui text-xs font-semibold ${stale ? "border-alert bg-softred text-alert" : "border-ink/20 bg-soft-blue text-ink"}`}>
            {stale ? `Stale (over ${limit} h)` : "Fresh"}
          </span>
        )}
      </td>
    </tr>
  );
}

const MANIFEST = "https://raw.githubusercontent.com/nishaanthjay/lifelines-nvm-archive/nwm-archive/manifest.csv";

/** Last archived NWM cycle, read from the public manifest of the archiver repo (one CSV row per cycle). */
function ArchiveRow({ now }: { now: number }) {
  const [m, setM] = useState<{ cycle: string; fetched: string; n: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch(MANIFEST, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`manifest: ${r.status}`); return r.text(); })
      .then((t) => {
        const rows = t.trim().split("\n").slice(1).map((l) => l.split(","));
        const ok = rows.filter((r) => r[1] === "ok" || r[1] === "partial");
        const last = ok[ok.length - 1];
        if (!last) throw new Error("manifest has no archived cycles");
        setM({ cycle: last[0], fetched: last[last.length - 1], n: ok.length });
      }).catch((e: Error) => setErr(e.message));
  }, []);
  const age = m ? ageH(m.fetched, now) : null;
  const stale = age === null || age > 3;
  return (
    <tr className="border-t border-ink/10">
      <th scope="row" className="py-3 pr-4 text-left font-ui text-sm font-semibold">NWM forecast archive</th>
      <td className="py-3 pr-4 font-mono text-xs">{err ?? (m ? m.fetched.slice(0, 16) + "Z" : "loading")}</td>
      <td className="py-3 pr-4 font-ui text-sm">{err ? "unavailable" : m ? `${hoursText(age)} · ${m.n} cycles` : ""}</td>
      <td className="py-3">
        {(m || err) && (
          <span className={`rounded-full border px-2.5 py-0.5 font-ui text-xs font-semibold ${stale ? "border-alert bg-softred text-alert" : "border-ink/20 bg-soft-blue text-ink"}`}>
            {stale ? "Stale (over 3 h)" : "Fresh"}
          </span>
        )}
      </td>
    </tr>
  );
}

export function StatusTable() {
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[34rem]">
        <caption className="sr-only">Freshness of each live data layer</caption>
        <thead><tr className="text-left font-ui text-xs uppercase tracking-[0.12em] text-muted"><th className="pb-2">Layer</th><th className="pb-2">Generated (UTC)</th><th className="pb-2">Age</th><th className="pb-2">Status</th></tr></thead>
        <tbody>{now > 0 && <>{LAYERS.map(([f, l, h]) => <Row key={f} file={f} label={l} limit={h} now={now} />)}<ArchiveRow now={now} /></>}</tbody>
      </table>
      <p className="mt-6 font-ui text-xs text-muted">The Florence replay is fixed past-storm data and does not refresh. The forecast archive is kept in a <a className="text-blue underline underline-offset-4" href="https://github.com/nishaanthjay/lifelines-nvm-archive">separate repository</a> and is used for research, not shown on the map.</p>
    </div>
  );
}
