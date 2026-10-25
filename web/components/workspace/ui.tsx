"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronDown, ChevronsUp, Minus } from "lucide-react";
import { TIERS, type Tier } from "@/lib/workspace/tiers";

const ARROW = { dash: Minus, down: ArrowDown, right: ArrowRight, up: ArrowUp, up2: ChevronsUp } as const;

/** Risk tag: arrow glyph + text label + a border that thickens with the tier, so colour is never the only signal. */
export function TierTag({ tier, className = "" }: { tier: Tier | number; className?: string }) {
  const t = typeof tier === "number" ? TIERS[tier] : tier;
  const A = ARROW[t.arrow];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium text-ink ${className}`}
      style={{ background: `${t.fill}33`, boxShadow: `inset 0 0 0 ${t.id >= 3 ? 1.5 : 1}px ${t.stroke}`, borderLeft: t.id === 4 ? `4px solid ${t.stroke}` : undefined }}>
      <A size={12} strokeWidth={2.4} aria-hidden style={{ color: t.stroke }} />{t.label}
    </span>
  );
}

/** Small-caps section label with the 12px divider rhythm used by both panels. */
export const Section = ({ label, children, aside, className = "" }: { label: string; children: ReactNode; aside?: ReactNode; className?: string }) => (
  <section className={`border-t border-ink/8 pt-3 ${className}`} aria-label={label}>
    <div className="mb-2 flex items-center justify-between gap-2"><h3 className="ws-label">{label}</h3>{aside}</div>
    {children}
  </section>
);

/** Two-or-three way segmented control (radio semantics). `tone="ink"` is the top tab look. */
export function Segmented<T extends string>({ value, onChange, options, label, size = "md", className = "" }: {
  value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string; size?: "sm" | "md"; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const key = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + options.length) % options.length;
    onChange(options[j].id);
    (ref.current?.querySelectorAll("button")[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={`inline-flex rounded-full bg-ink/[0.06] p-0.5 ${className}`}>
      {options.map((o, i) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} tabIndex={value === o.id ? 0 : -1} onClick={() => onChange(o.id)} onKeyDown={(e) => key(e, i)}
          className={`whitespace-nowrap rounded-full font-medium transition-colors duration-200 ${size === "sm" ? "min-h-8 px-3 text-[13px]" : "min-h-9 px-4 text-[13px]"} ${value === o.id ? "bg-ink font-semibold text-white shadow-sm" : "text-muted hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Compact dropdown chip ("Scenario / Hazard" in the reference). */
export function MenuChip<T extends string>({ label, value, valueText, options, onChange, badge, className = "" }: {
  label: string; value: T; valueText: string; options: { id: T; label: string; sub?: string }[]; onChange: (v: T) => void; badge?: ReactNode; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); (box.current?.querySelector("button") as HTMLElement | null)?.focus(); } };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", esc); };
  }, [open]);
  const nav = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(box.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };
  return (
    <div ref={box} className={`relative ${className}`} onKeyDown={nav}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
        className="ws-glass flex min-h-10 items-center gap-2 rounded-xl px-3 text-left transition-colors hover:bg-white">
        <span className="ws-label">{label}</span>
        {badge}
        <span className="whitespace-nowrap text-[13px] font-semibold text-ink">{valueText}</span>
        <ChevronDown size={14} aria-hidden className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={id} role="menu" aria-label={label} className="ws-glass absolute left-0 top-full z-50 mt-1.5 min-w-full rounded-xl p-1 [animation:rise-sm_0.18s_ease-out]">
          {options.map((o) => (
            <button key={o.id} type="button" role="menuitemradio" aria-checked={o.id === value} onClick={() => { onChange(o.id); setOpen(false); }}
              className="flex min-h-10 w-full items-start gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left hover:bg-ink/5">
              <Check size={14} aria-hidden className={`mt-0.5 shrink-0 text-blue ${o.id === value ? "" : "invisible"}`} />
              <span><span className="block text-[13px] font-semibold text-ink">{o.label}</span>{o.sub && <span className="block text-xs text-muted">{o.sub}</span>}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shimmer placeholder for panels that wait on data. */
export const Skeleton = ({ className = "" }: { className?: string }) => <div aria-hidden className={`shimmer rounded-lg ${className}`} />;
