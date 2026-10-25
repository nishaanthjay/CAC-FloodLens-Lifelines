"use client";
import { useEffect, useState } from "react";
import { ageH, hoursText, useLive } from "@/lib/live";
import { et } from "@/lib/format";
import { t } from "@/content/copy";

const LAYERS = [
  ["nowcast.json", t("status.layer.nowcast"), 3],
  ["coastal.json", t("status.layer.coastal"), 3],
  ["forecast_latest.json", t("status.layer.forecast"), 6],
] as const;

type Stamped = { generated_at: string };

function Row({ file, label, limit, now }: { file: string; label: string; limit: number; now: number }) {
  const { data, error } = useLive<Stamped>(file, true);
  const age = data ? ageH(data.generated_at, now) : null;
  const stale = age === null || age > limit;
  return (
    <tr className="border-t border-ink/10">
      <th scope="row" className="py-3 pr-4 text-left text-sm font-semibold">{label}</th>
      <td className="py-3 pr-4 tabular-nums text-xs">{error ?? (data ? et(data.generated_at) : t("status.loading"))}</td>
      <td className="py-3 pr-4 text-sm">{error ? t("status.unavailable") : data ? hoursText(age) : ""}</td>
      <td className="py-3">
        {(data || error) && (
          <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold border-ink/20 bg-soft-blue text-ink`}>
            {stale ? t("status.stale", { limit }) : t("status.fresh")}
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
    fetch(MANIFEST, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(t("status.archive.http", { status: r.status })); return r.text(); })
      .then((text) => {
        const rows = text.trim().split("\n").slice(1).map((l) => l.split(","));
        const ok = rows.filter((r) => r[1] === "ok" || r[1] === "partial");
        const last = ok[ok.length - 1];
        if (!last) throw new Error(t("status.archive.empty"));
        setM({ cycle: last[0], fetched: last[last.length - 1], n: ok.length });
      }).catch((e: Error) => setErr(e.message));
  }, []);
  const age = m ? ageH(m.fetched, now) : null;
  const stale = age === null || age > 3;
  return (
    <tr className="border-t border-ink/10">
      <th scope="row" className="py-3 pr-4 text-left text-sm font-semibold">{t("status.layer.archive")}</th>
      <td className="py-3 pr-4 tabular-nums text-xs">{err ?? (m ? et(m.fetched.slice(0, 16) + "Z") : t("status.loading"))}</td>
      <td className="py-3 pr-4 text-sm">{err ? t("status.unavailable") : m ? t("status.archive.age", { age: hoursText(age), n: m.n }) : ""}</td>
      <td className="py-3">
        {(m || err) && (
          <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold border-ink/20 bg-soft-blue text-ink`}>
            {stale ? t("status.stale", { limit: 3 }) : t("status.fresh")}
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
      <table className="w-full">
        <caption className="sr-only">{t("status.table.caption")}</caption>
        <thead><tr className="text-left text-xs font-medium text-muted"><th className="pb-2">{t("status.table.layer")}</th><th className="pb-2">{t("status.table.updated")}</th><th className="pb-2">{t("status.table.age")}</th><th className="pb-2">{t("status.table.status")}</th></tr></thead>
        <tbody>{now > 0 && <>{LAYERS.map(([f, l, h]) => <Row key={f} file={f} label={l} limit={h} now={now} />)}<ArchiveRow now={now} /></>}</tbody>
      </table>
      <p className="mt-6 text-xs text-muted">{t("status.note.lead")} <a className="text-blue underline underline-offset-4" href="https://github.com/nishaanthjay/lifelines-nvm-archive">{t("status.note.link")}</a> {t("status.note.tail")}</p>
    </div>
  );
}
