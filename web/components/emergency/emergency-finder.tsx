"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Crosshair, ExternalLink, LoaderCircle, MapPin, Navigation, Phone, Route as RouteIcon, Search } from "lucide-react";
import { ADDRESS_EXAMPLE, geocode } from "@/lib/geocode";
import { mi, mins } from "@/lib/format";
import { ageH, hoursText, useLive, type Nowcast } from "@/lib/live";
import { LIMIT_MIN } from "@/lib/route";
import { KINDS, directionsHref, loadServices, nearestByKind, telHref, type Kind, type ServicesDoc, type Svc } from "@/lib/services";
import { SLOW_MS, matrix } from "@/lib/valhalla";
import { KindIcon } from "@/components/ui/kind-icon";
import { t } from "@/content/copy";

type Origin = { lat: number; lon: number; label: string };
type Row = { s: Svc; straightKm: number; timeS?: number | null; km?: number };
const PER_KIND = 3;
const IN_PILOT = (o: Origin) => o.lat > 33.65 && o.lat < 34.85 && o.lon > -78.75 && o.lon < -77.45;
const min = mins;

/** One result row: name, kind, drive time, and the three actions that matter in a hurry (call, directions, check the roads). */
function Item({ r, origin, big }: { r: Row; origin: Origin; big?: boolean }) {
  const { s } = r, tel = telHref(s.phone), limit = LIMIT_MIN[s.k] ?? 30, long = r.timeS != null && r.timeS / 60 > limit;
  return (
    <li className={`rounded-2xl border bg-white p-4 ${big ? "border-alert/40 shadow-panel" : "border-ink/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-ui font-semibold ${big ? "text-lg" : "text-sm"}`}>{s.name}</p>
          <p className="font-ui text-xs text-muted">{s.sub ?? KINDS.find((k) => k.id === s.k)!.one}{s.addr ? ` · ${s.addr}` : ""}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold">{r.timeS != null ? min(r.timeS) : r.timeS === null ? t("common.noroute") : mi(r.straightKm)}</p>
          <p className="font-ui text-[11px] text-muted">{r.timeS != null ? t("emergency.item.drive") : t("emergency.item.straight")}</p>
        </div>
      </div>
      {long && <p className="mt-2 rounded-lg bg-yellow px-2.5 py-1.5 font-ui text-xs font-semibold">{t("emergency.item.long", { limit })}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {tel && <a href={tel} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-blue px-4 font-ui text-xs font-semibold text-white hover:bg-[#244d86]"><Phone size={14} aria-hidden /> {t("common.call", { phone: s.phone ?? "" })}</a>}
        <a href={directionsHref(origin, s)} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/15 px-4 font-ui text-xs font-semibold hover:border-blue">
          <Navigation size={14} aria-hidden /> {t("emergency.item.directions")} <ExternalLink size={12} aria-hidden /><span className="sr-only">{t("emergency.item.newwindow")}</span>
        </a>
        <a href={`/route?${new URLSearchParams({ lat: origin.lat.toFixed(5), lon: origin.lon.toFixed(5), label: origin.label, svc: s.id })}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/15 px-4 font-ui text-xs font-semibold hover:border-blue">
          <RouteIcon size={14} aria-hidden /> {t("emergency.item.roads")}
        </a>
      </div>
      {!tel && <p className="mt-2 font-ui text-[11px] text-muted">{t("emergency.item.nophone")}</p>}
      <p className="mt-1 font-ui text-[11px] text-muted">{t("emergency.item.source", { src: s.src })}</p>
    </li>
  );
}

export function EmergencyFinder() {
  const params = useSearchParams();
  const [doc, setDoc] = useState<ServicesDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [times, setTimes] = useState<Record<string, { timeS: number; km: number } | null>>({});
  const [timesNote, setTimesNote] = useState<string | null>(null);
  const [only, setOnly] = useState<Kind | "all">("all");
  const [now] = useState(() => Date.now());
  const token = useRef(0);
  const nc = useLive<Nowcast>("nowcast.json", true);

  useEffect(() => { loadServices().then(setDoc).catch((e: Error) => setErr(e.message)); }, []);
  useEffect(() => {
    const lat = params.get("lat"), lon = params.get("lon"), q = new URLSearchParams(window.location.hash.slice(1)).get("q");
    if (lat && lon) setOrigin({ lat: +lat, lon: +lon, label: params.get("label") ?? t("emergency.place.default") });
    else if (q) { setQuery(q); void lookup(q); }
    if (q) history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function lookup(q: string) {
    setBusy(true); const r = await geocode(q); setBusy(false);
    if (typeof r === "string") return setMsg(r);
    setMsg(null); setOrigin(r);
  }
  function locate() {
    if (!navigator.geolocation) return setMsg(t("emergency.error.nolocation"));
    setLocating(true); setMsg(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); setOrigin({ lat: p.coords.latitude, lon: p.coords.longitude, label: t("emergency.place.device") }); },
      (e) => { setLocating(false); setMsg(e.code === 1 ? t("emergency.error.denied") : t("emergency.error.failed")); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  const rows = useMemo<Row[]>(() => (origin && doc ? nearestByKind(doc.items, origin, PER_KIND).map(({ s, straightKm }) => ({ s, straightKm })) : []), [origin, doc]);
  // Drive times for just those rows (at most 27 targets). Straight-line distances show first, so the list never waits on the router.
  useEffect(() => {
    if (!origin || !rows.length) return;
    const tk = ++token.current; setTimes({}); setTimesNote(null);
    const t0 = Date.now();
    matrix([origin.lon, origin.lat], rows.map((r) => [r.s.lon, r.s.lat]))
      .then((m) => {
        if (tk !== token.current) return;
        setTimes(Object.fromEntries(rows.map((r, i) => [r.s.id, m[i]])));
        if (Date.now() - t0 > SLOW_MS) setTimesNote(t("emergency.times.slow"));
      })
      .catch((e: Error) => { if (tk === token.current) setTimesNote(t("emergency.times.error", { error: e.message })); });
  }, [origin, rows]);

  const timed = rows.map((r) => (r.s.id in times ? { ...r, timeS: times[r.s.id]?.timeS ?? null, km: times[r.s.id]?.km } : r));
  const byTime = (a: Row, b: Row) => (a.timeS ?? Infinity) - (b.timeS ?? Infinity) || a.straightKm - b.straightKm;
  const er = timed.filter((r) => r.s.k === "hospital_ed").sort(byTime)[0];
  const gauges = nc.data?.gauges ?? [];
  const up = gauges.filter((g) => ["major", "moderate", "minor", "action"].includes(g.nws.flood_category)).length;
  const ncAge = nc.data ? ageH(nc.data.generated_at, now) : null;

  return (
    <main id="content" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <a href="tel:911" className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-alert px-5 py-4 text-center font-ui text-lg font-bold text-white hover:bg-[#a30000]">
        <Phone aria-hidden /> {t("emergency.call911")}
      </a>
      <h1 className="mt-8 font-display text-4xl font-black leading-tight tracking-[-0.03em]">{t("emergency.title")}</h1>
      <p className="mt-2 font-body text-base leading-relaxed text-ink/75">
        {t("emergency.intro")}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={locate} disabled={locating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue px-6 font-ui text-sm font-semibold text-white hover:bg-[#244d86] disabled:opacity-70">
          {locating ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Crosshair size={16} aria-hidden />} {t("emergency.locate")}
        </button>
        <form role="search" className="flex flex-1 items-center gap-2 rounded-full border border-ink/10 bg-white p-1.5 pl-4 focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15"
          onSubmit={(e) => { e.preventDefault(); if (query.trim()) void lookup(query.trim()); }}>
          <label htmlFor="em-addr" className="sr-only">{t("emergency.address.label")}</label>
          <Search size={17} className="shrink-0 text-blue" aria-hidden />
          <input id="em-addr" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("emergency.address.placeholder")} autoComplete="street-address"
            className="min-h-10 w-full min-w-0 bg-transparent font-ui text-base focus-visible:outline-none" />
          <button type="submit" disabled={busy} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-5 font-ui text-sm font-semibold text-white disabled:opacity-70">
            {busy && <LoaderCircle size={14} className="animate-spin" aria-hidden />} {t("emergency.address.find")}
          </button>
        </form>
      </div>
      <p className="mt-2 font-ui text-xs text-muted">{t("emergency.hint", { example: ADDRESS_EXAMPLE })}</p>
      <p aria-live="polite" className="mt-2 min-h-5 font-ui text-sm text-alert">{err ? t("emergency.error.services", { error: err }) : msg}</p>

      {origin && !IN_PILOT(origin) && (
        <p role="note" className="mt-2 rounded-xl border border-[#E6DFA3] bg-yellow px-4 py-3 font-ui text-sm font-semibold">
          {t("emergency.outside")}
        </p>
      )}

      {origin && doc && (
        <section aria-labelledby="near-h" className="mt-6">
          <p className="flex items-start gap-2 font-ui text-sm"><MapPin size={16} className="mt-0.5 shrink-0 text-blue" aria-hidden /><span className="min-w-0 break-words"><b className="font-semibold">{t("emergency.near")}</b> {origin.label}</span></p>
          <h2 id="near-h" className="sr-only">{t("emergency.nearest.heading")}</h2>

          {er && (<>
            <p className="label mt-5 text-muted">{t("emergency.nearest.er")}</p>
            <ul className="mt-2"><Item r={er} origin={origin} big /></ul>
          </>)}

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t("emergency.show")}>
            {([["all", t("common.all")], ...KINDS.map((k) => [k.id, k.label] as [Kind, string])] as [Kind | "all", string][]).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={only === k} onClick={() => setOnly(k)}
                className={`min-h-9 rounded-full border px-3.5 font-ui text-xs font-semibold transition-colors ${only === k ? "border-blue bg-blue text-white" : "border-ink/15 bg-white text-ink/75 hover:border-blue"}`}>{label}</button>
            ))}
          </div>
          {timesNote && <p role="status" className="mt-3 font-ui text-xs text-alert">{timesNote}</p>}
          {Object.keys(times).length === 0 && !timesNote && <p className="mt-3 inline-flex items-center gap-2 font-ui text-xs text-muted" role="status"><LoaderCircle size={13} className="animate-spin" aria-hidden /> {t("emergency.times.loading")}</p>}

          {KINDS.filter((k) => only === "all" || only === k.id).map((k) => {
            const list = timed.filter((r) => r.s.k === k.id).sort(byTime);
            if (!list.length) return null;
            return (
              <div key={k.id} className="mt-6">
                <h3 className="flex items-center gap-2 font-ui text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink/5"><KindIcon kind={k.id} size={15} /></span>{k.label}</h3>
                <ul className="mt-2 space-y-3">{list.map((r) => <Item key={r.s.id} r={r} origin={origin} />)}</ul>
              </div>
            );
          })}

          <div className="mt-8 rounded-2xl bg-soft-blue/60 p-4 font-ui text-xs leading-relaxed text-ink/80">
            <p className="font-semibold">{t("emergency.river.title")}</p>
            <p className="mt-1">
              {nc.error ? t("emergency.river.error", { error: nc.error }) : !nc.data ? t("emergency.river.loading")
                : t("emergency.river.summary", { up, total: gauges.length, age: hoursText(ncAge) })}
              {" "}{t("emergency.river.normal")} <a className="font-semibold text-blue underline" href={`/route?${new URLSearchParams({ lat: origin.lat.toFixed(5), lon: origin.lon.toFixed(5), label: origin.label })}`}>{t("emergency.river.link")}</a> {t("emergency.river.tail")}
            </p>
          </div>
        </section>
      )}

      <section className="mt-10 border-t border-ink/10 pt-5 font-ui text-xs leading-relaxed text-muted" aria-label={t("emergency.lists.title")}>
        <p className="font-semibold text-ink">{t("emergency.lists.title")}</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          {(doc?.caveats ?? [t("emergency.lists.loading")]).map((c) => <li key={c}>{c}</li>)}
          <li>{t("emergency.lists.disclaimer")}</li>
        </ul>
      </section>
    </main>
  );
}
