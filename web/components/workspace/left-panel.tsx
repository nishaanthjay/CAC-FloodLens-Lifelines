"use client";
import { AnimatePresence, m } from "framer-motion";
import { AlertTriangle, Anchor, Gauge, Info, Waves, type LucideIcon } from "lucide-react";
import { Section, Skeleton, TierTag } from "@/components/workspace/ui";
import { AccessSection } from "@/components/workspace/access-section";
import { CrossingCard } from "@/components/workspace/crossing-card";
import { HowToRead, InfoDot } from "@/components/workspace/how-to-read";
import { MODE_BADGE } from "@/components/workspace/top-bar";
import { useData, type Prov } from "@/components/workspace/data";
import { useDerived, usePick } from "@/components/workspace/derived";
import { useRouting } from "@/components/workspace/routing";
import { TABS, useWS, type Mode, type Tab } from "@/components/workspace/store";
import { waterFigure, waterSentence } from "@/lib/workspace/plain";
import { tierOfCrossing } from "@/lib/workspace/stats";
import { LEVELS } from "@/lib/workspace/tiers";
import { t } from "@/content/copy";

export type Tile = { icon: LucideIcon; value: string; label: string; info?: boolean };
export type Row = { id: string; title: string; over?: string; sentence: string; figure: string; tier: number };

const TITLE: Record<Tab, string> = { water: t("leftpanel.title.water"), access: t("leftpanel.title.access"), consequence: t("leftpanel.title.consequence") };

/** Mode badge, age and the not-for-emergency note stay in view; the source line and the rest are under "How to read this". */
export function Provenance({ mode, prov }: { mode: Mode; prov: Prov }) {
  return (
    <div className="mt-2 text-xs text-muted">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded bg-ink px-1.5 py-0.5 text-[13px] font-semibold uppercase tracking-[0.02em] text-white">{MODE_BADGE[mode]}</span>
        {prov.stale && <span className="rounded border border-alert/50 bg-softred px-1.5 py-0.5 text-[13px] font-semibold text-[#8E0000]">{t("leftpanel.stale")}</span>}
        <span className="tabular-nums text-[13px] text-ink/75">{t("leftpanel.generated", { generated: prov.generated })}</span>
      </p>
      <p className="mt-1 text-[13px] leading-snug text-ink/75">{prov.note}</p>
    </div>
  );
}

export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {tiles.map((tile) => (
        <li key={tile.label} className="relative flex flex-col items-center gap-1 rounded-xl border border-ink/8 bg-white/70 px-1.5 py-2.5 text-center">
          {tile.info && <InfoDot panel="left" className="absolute right-0.5 top-0.5" />}
          <tile.icon size={18} strokeWidth={1.7} aria-hidden className="text-blue" />
          <span className="tabular-nums text-sm font-semibold text-ink">{tile.value}</span>
          <span className="text-[13px] leading-tight text-ink/75">{tile.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function CrossingTable({ rows, onPick, selected, caption }: { rows: Row[]; onPick: (id: string) => void; selected?: string | null; caption: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/8 bg-white/70">
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">{caption} {t("leftpanel.table.select")}</caption>
        <thead><tr className="border-b border-ink/8 text-left text-[13px] text-muted"><th scope="col" className="px-2.5 py-1.5 font-medium">{t("leftpanel.table.crossing")}</th><th scope="col" className="py-1.5 pr-2.5 font-medium">{t("leftpanel.table.risk")}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-b border-ink/5 last:border-0 ${selected === r.id ? "bg-blue/10" : "hover:bg-ink/[0.04]"}`}>
              <td className="px-2.5 py-0 align-top">
                <button type="button" onClick={() => onPick(r.id)} aria-pressed={selected === r.id} className="flex min-h-11 w-full flex-col items-start justify-center py-1.5 text-left focus-visible:[outline-offset:-3px]">
                  <span className="text-sm font-semibold leading-snug text-ink">{r.title}</span>
                  {r.over && <span className="text-[13px] leading-snug text-muted">{t("crossing.over", { name: r.over })}</span>}
                  <span className="mt-0.5 text-[13px] leading-snug text-ink/85">{r.sentence}</span>
                </button>
              </td>
              <td className="py-1.5 pr-2.5 align-top">
                <TierTag tier={r.tier} />
                {r.figure && <span className="mt-1 block tabular-nums text-[13px] text-muted">{r.figure}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeftSkeleton() {
  return (
    <div aria-busy="true" aria-label={t("leftpanel.loading")} role="status" className="mt-3 space-y-3">
      <Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" />
      <div className="grid grid-cols-3 gap-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function ErrorCard({ title, text }: { title: string; text: string }) {
  return (
    <div role="alert" className="mt-3 flex gap-2 rounded-xl border border-alert/30 bg-softred p-3 text-xs leading-snug">
      <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-alert" />
      <div><p className="font-semibold text-[#8E0000]">{title}</p><p className="mt-0.5 text-ink/80">{text}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-2 min-h-11 rounded-full border border-ink/20 bg-white px-3 font-semibold hover:border-ink/40">{t("common.reload")}</button></div>
    </div>
  );
}

/** The summary: one big sentence, one short one, and the full wording behind "More". */
export function Summary({ insight }: { insight: { stat: string; short: string; more: string } }) {
  return (
    <div className="mt-3">
      <p className="text-xl font-semibold leading-snug text-ink">{insight.stat}</p>
      <p className="mt-1 text-sm leading-snug text-ink/80">{insight.short} <InfoDot panel="left" className="align-middle" /></p>
      <details className="mt-1">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-blue">{t("leftpanel.more")}</summary>
        <p className="pb-1 text-[13px] leading-relaxed text-ink/80">{insight.more}</p>
      </details>
    </div>
  );
}

/** Body of the left panel; also rendered inside the mobile bottom sheet. */
export function LeftContent() {
  const { tab, mode } = useWS();
  const d = useData();
  const v = useDerived();
  const pick = usePick();
  const routing = useRouting();
  const X = d.X;
  const routed = tab === "access" && routing.ranked.length > 0; // a worked route fills the panel; the city-wide lists wait below it

  const flagged = v.tiers ? v.tiers.count[3] + v.tiers.count[4] : 0;
  const tidalFlagged = X ? X.assessed.filter((x) => x.tidal && v.keep(x) && tierOfCrossing(x, v.h) >= 3).length : 0;
  const tiles: Tile[] = [
    { icon: Waves, value: String(flagged), label: t("leftpanel.tile.flagged") },
    mode === "replay" || mode === "forecast"
      ? { icon: Anchor, value: String(tidalFlagged), label: t("leftpanel.tile.tidal"), info: true }
      : { icon: Gauge, value: d.nc.data ? t("common.of", { a: v.gaugesUp, b: v.gauges.length }) : t("common.pending"), label: t("leftpanel.tile.gauges"), info: true },
    { icon: Info, value: X ? X.not_assessed.length.toLocaleString("en-US") : t("common.pending"), label: t("leftpanel.tile.unassessed"), info: true },
  ];
  if (mode === "forecast") tiles[2] = { icon: Gauge, value: d.nc.data ? t("common.of", { a: v.gaugesUp, b: v.gauges.length }) : t("common.pending"), label: t("leftpanel.tile.gauges.now"), info: true };
  const byFlow = tab === "water";
  const rows: Row[] = v.rows.map((r) => ({ id: r.id, title: r.name.title, over: r.name.over, tier: r.tier,
    sentence: byFlow ? waterSentence(r.ratio) : t("leftpanel.row.people", { n: r.people.toLocaleString("en-US") }), figure: byFlow ? waterFigure(r.ratio) : "" }));
  const caveats = mode === "replay" ? [d.base?.meta.event.note, d.base?.meta.stamp, ...(d.base?.meta.known_gaps ?? [])]
    : mode === "nowcast" ? [...(d.nc.data?.caveats ?? []), ...(d.nc.data?.errors ?? []).map((e) => t("leftpanel.caveat.error", { error: e }))]
    : [...(d.fc.data?.caveats ?? []), d.fc.data?.fallback.used ? d.fc.data.fallback.note : ""];
  const list = caveats.filter((c): c is string => !!c);
  const loading = !d.base || !X;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={tab} id="ws-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
        <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink">{TITLE[tab]}</h2>
        <p className="mt-1 text-sm text-muted">{TABS.find((x) => x.id === tab)!.explain}</p>
        {d.error ? <ErrorCard title={t("leftpanel.error.title")} text={t("leftpanel.error.text", { error: d.error })} />
          : loading || !d.prov ? <LeftSkeleton /> : (
          <>
            <Provenance mode={mode} prov={d.prov} />
            {tab === "access" && <AccessSection />}
            <div className="mt-3"><CrossingCard /></div>
            {!routed && (v.insight ? <Summary insight={v.insight} /> : <Skeleton className="mt-3 h-16" />)}
            {!routed && <><Section label={t("leftpanel.section.hazards")} className="mt-3"><Tiles tiles={tiles} /></Section>
            <Section label={byFlow ? t("leftpanel.section.top.flow") : t("leftpanel.section.top.people")} className="mt-3">
              {rows.length ? <CrossingTable rows={rows} onPick={pick} selected={d.selectedId}
                caption={byFlow ? t("leftpanel.table.caption.flow") : t("leftpanel.table.caption.people")} />
                : <p className="rounded-xl border border-ink/8 bg-white/70 p-3 text-[13px] text-ink/75">{mode === "replay" ? t("leftpanel.table.empty.replay") : t("leftpanel.table.empty.live")}</p>}
            </Section></>}
            <HowToRead panel="left">
              <div>
                <p className="font-semibold text-ink">{t("howto.colors")}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {LEVELS.map((l) => <li key={l.id} className="flex items-start gap-2"><TierTag tier={l.tiers[0]} className="shrink-0" /><span>{l.note}</span></li>)}
                </ul>
              </div>
              <p>{t("leftpanel.source", { source: d.prov.source })}</p>
              <p>{t("howto.unassessed", { n: X ? X.not_assessed.length.toLocaleString("en-US") : "0" })}</p>
              {tab === "consequence" && <p>{t("leftpanel.table.note.people")}</p>}
              <div>
                <p className="font-semibold text-ink">{t("leftpanel.section.about")}</p>
                <label className="mt-1.5 flex items-start gap-2.5 leading-snug text-ink/85">
                  <input type="checkbox" checked={d.useOsm} onChange={(e) => d.setUseOsm(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#2D5DA1]" />
                  <span>{t("leftpanel.osm.label", { nOsm: d.nOsm.toLocaleString("en-US"), nStructures: ((d.base?.X.assessed.length ?? 0) - d.nOsm).toLocaleString("en-US") })}</span>
                </label>
                <p className="mt-2 text-muted">{t("leftpanel.layer.note")}</p>
              </div>
              {list.length > 0 && (
                <div>
                  <p className="font-semibold text-ink">{t("leftpanel.caveats", { n: list.length })}</p>
                  <ul className="mt-1.5 list-disc space-y-1.5 pl-4 leading-relaxed">{list.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              )}
            </HowToRead>
          </>
        )}
      </m.div>
    </AnimatePresence>
  );
}

export function LeftPanel() {
  return (
    <m.aside initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} aria-label={t("leftpanel.aria")}
      className="ws-glass ws-scroll absolute bottom-[104px] left-[68px] top-[60px] z-20 hidden w-[380px] overflow-y-auto rounded-2xl p-4 lg:block">
      <LeftContent />
    </m.aside>
  );
}
