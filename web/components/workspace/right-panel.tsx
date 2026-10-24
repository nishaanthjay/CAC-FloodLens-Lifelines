"use client";
import { useId } from "react";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Legend, StackedArea, TierBars, type Series } from "@/components/workspace/charts";
import { Section, Segmented } from "@/components/workspace/ui";
import { useWS } from "@/components/workspace/store";
import { ACCESS_STATES } from "@/lib/workspace/tiers";

// Phase 1 placeholder series, replaced by the real data in phase 3.
const PH: Series[] = ACCESS_STATES.slice(0, 4).map((s, k) => ({ ...s, values: Array.from({ length: 18 }, (_, i) => [200 + i * 55, 600 + i * 40, 1500 + i * 30, 30000 - i * 400][k]) }));
const PH_BARS = [{ tier: 4, value: 12 }, { tier: 3, value: 38 }, { tier: 2, value: 61 }, { tier: 1, value: 90 }, { tier: 0, value: 150 }];

/** Body of the right panel; also rendered inside the mobile bottom sheet. */
export function RightContent({ count = "placeholder" }: { count?: string }) {
  const { hour, setHour, unit, setUnit } = useWS();
  const id = useId();
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em]">Network insights</h2>
        <span className="rounded-full bg-ink/[0.07] px-2.5 py-1 font-mono text-[11px] font-semibold text-ink">{count}</span>
      </div>
      <Section label="People by access state over time" className="mt-3">
        <StackedArea series={PH} hour={hour} onHour={setHour} unitLabel="people" ariaLabel="People by access state, hours of the scenario. Arrow keys change the hour." />
        <Legend items={PH.map((s) => ({ id: s.id, label: s.label, fill: s.fill, pattern: s.pattern }))} />
      </Section>
      <Section label="Risk tiers" className="mt-3"><TierBars rows={PH_BARS} unitLabel="crossings" /></Section>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 pt-3">
        <span id={id} className="ws-label">Distributed by</span>
        <Segmented size="sm" label="Distributed by" value={unit} onChange={setUnit} options={[{ id: "people", label: "People" }, { id: "blocks", label: "Blocks" }]} />
      </div>
    </div>
  );
}

export function RightPanel() {
  const { rightOpen, setRightOpen } = useWS();
  return (
    <m.aside initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }} aria-label="Network insights"
      className="ws-glass absolute right-3 top-[60px] z-20 hidden lg:block">
      {rightOpen ? (
        <>
          <button type="button" onClick={() => setRightOpen(false)} aria-label="Collapse network insights" aria-expanded
            className="absolute -left-3 top-4 z-10 grid h-6 w-6 place-items-center rounded-full border border-ink/10 bg-white text-ink/70 shadow-sm hover:text-ink">
            <ChevronRight size={14} aria-hidden />
          </button>
          <div className="ws-scroll max-h-[calc(100dvh-60px-104px)] w-[360px] overflow-y-auto rounded-2xl p-4"><RightContent /></div>
        </>
      ) : (
        <button type="button" onClick={() => setRightOpen(true)} aria-expanded={false} className="flex min-h-11 items-center gap-2 rounded-2xl px-4 font-display text-base font-bold">
          Network insights <ChevronRight size={15} aria-hidden className="rotate-180 text-muted" />
        </button>
      )}
    </m.aside>
  );
}
