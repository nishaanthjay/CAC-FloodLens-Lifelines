"use client";
import { AnimatePresence, m } from "framer-motion";
import { Gauge, Info, Waves, type LucideIcon } from "lucide-react";
import { Section, Skeleton, TierTag } from "@/components/workspace/ui";
import { MODE_BADGE } from "@/components/workspace/top-bar";
import { useWS, type Mode, type Tab } from "@/components/workspace/store";

export type Tile = { icon: LucideIcon; value: string; label: string };
export type Row = { id: string; name: string; tier: number; people: number };
export type Provenance = { source: string; generated: string; note?: string };

const TITLE: Record<Tab, string> = { water: "Water Summary", access: "Access Summary", consequence: "Consequence Summary" };

// Phase 1 placeholders, replaced by the real data in phase 3.
const PLACEHOLDER: { insight: string; tiles: Tile[]; rows: Row[]; prov: Provenance } = {
  insight: "Placeholder text. The generated summary of this hour, computed from the scenario data, appears here.",
  tiles: [{ icon: Waves, value: "00", label: "Crossings flagged" }, { icon: Gauge, value: "0 of 0", label: "Gauges at action stage" }, { icon: Info, value: "N/A", label: "Not modeled: surge, rain" }],
  rows: Array.from({ length: 10 }, (_, i) => ({ id: `ID-${i + 1}`, name: "Placeholder crossing", tier: [4, 4, 3, 3, 3, 2, 2, 1, 1, 0][i], people: 9000 - i * 800 })),
  prov: { source: "Placeholder", generated: "not loaded" },
};

export function Provenance({ mode, prov }: { mode: Mode; prov: Provenance }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-xs text-muted">
      <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white">{MODE_BADGE[mode]}</span>
      <span>{prov.source}</span><span aria-hidden>·</span><span className="font-mono">{prov.generated}</span>
      <p className="mt-1 w-full text-[11px] leading-snug text-ink/70">{prov.note ?? "Scenario, not a prediction. Not for emergency use: call 911."}</p>
    </div>
  );
}

export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {tiles.map((t) => (
        <li key={t.label} className="flex flex-col items-center gap-1 rounded-xl border border-ink/8 bg-white/70 px-1.5 py-2.5 text-center">
          <t.icon size={18} strokeWidth={1.7} aria-hidden className="text-blue" />
          <span className="font-mono text-sm font-semibold tabular-nums text-ink">{t.value}</span>
          <span className="font-ui text-[11px] leading-tight text-ink/75">{t.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function CrossingTable({ rows, onPick, selected, peopleLabel = "People" }: { rows: Row[]; onPick: (id: string) => void; selected?: string | null; peopleLabel?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/8 bg-white/70">
      <table className="w-full border-collapse font-ui text-xs">
        <caption className="sr-only">Top 10 crossings by consequence. Select a row to fly the map to it.</caption>
        <thead><tr className="border-b border-ink/8 text-left text-[11px] text-muted"><th scope="col" className="px-2.5 py-1.5 font-semibold">Crossing</th><th scope="col" className="py-1.5 font-semibold">Risk</th><th scope="col" className="px-2.5 py-1.5 text-right font-semibold">{peopleLabel}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-b border-ink/5 last:border-0 ${selected === r.id ? "bg-blue/10" : "hover:bg-ink/[0.04]"}`}>
              <td className="max-w-[150px] px-2.5 py-0 align-middle">
                <button type="button" onClick={() => onPick(r.id)} aria-pressed={selected === r.id} className="flex min-h-10 w-full flex-col items-start justify-center text-left">
                  <span className="font-mono text-[11px] font-semibold text-ink">{r.id}</span>
                  <span className="w-full truncate text-[11px] text-muted">{r.name}</span>
                </button>
              </td>
              <td className="align-middle"><TierTag tier={r.tier} /></td>
              <td className="px-2.5 text-right align-middle font-mono tabular-nums text-ink">{r.people.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeftSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading summary" className="space-y-3">
      <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-3 gap-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      <Skeleton className="h-64" />
    </div>
  );
}

/** Body of the left panel; also rendered inside the mobile bottom sheet. */
export function LeftContent() {
  const { tab, mode } = useWS();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={tab} id="ws-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
        <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink">{TITLE[tab]}</h2>
        <Provenance mode={mode} prov={PLACEHOLDER.prov} />
        <p className="mt-3 font-body text-[13.5px] leading-relaxed text-ink/85">{PLACEHOLDER.insight}</p>
        <Section label="Top hazards" className="mt-3"><Tiles tiles={PLACEHOLDER.tiles} /></Section>
        <Section label="Top 10 crossings by consequence" className="mt-3"><CrossingTable rows={PLACEHOLDER.rows} onPick={() => {}} /></Section>
      </m.div>
    </AnimatePresence>
  );
}

export function LeftPanel() {
  return (
    <m.aside initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} aria-label="Summary"
      className="ws-glass ws-scroll absolute bottom-[104px] left-[68px] top-[60px] z-20 hidden w-[380px] overflow-y-auto rounded-2xl p-4 lg:block">
      <LeftContent />
    </m.aside>
  );
}
