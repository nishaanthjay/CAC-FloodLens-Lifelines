"use client";
import { AlertTriangle, LoaderCircle, Route as RouteIcon } from "lucide-react";
import { tidyName } from "@/lib/format";
import { KindIcon } from "@/components/ui/kind-icon";
import { StatusBadge, routeMins } from "@/components/route/route-analysis";
import { useRouting, type Service } from "@/components/workspace/routing";
import { useWS } from "@/components/workspace/store";
import { t, tn } from "@/content/copy";

const byTime = (a: Service, b: Service) => (a.timeS ?? Infinity) - (b.timeS ?? Infinity) || a.straightKm - b.straightKm;

/** The answer for the nearest ER and fire station: the big sentence, its second line, and the options behind it. null until an address is set. */
export function useAnswer() {
  const r = useRouting();
  const { mode } = useWS();
  const live = mode !== "replay";
  if (!r.origin) return null;
  const er = r.services.filter((s) => s.k === "hospital_ed").sort(byTime)[0];
  const fire = r.services.filter((s) => s.k === "fire").sort(byTime)[0];
  if (!er) return null;

  const optsOf = (id: string) => r.ranked.filter((x) => x.o.serviceId === id);
  const erOpts = optsOf(er.id), primary = erOpts.find((x) => x.o.kind === "fastest"), best = erOpts[0];
  const fireOpts = fire ? optsOf(fire.id) : [], firePrimary = fireOpts.find((x) => x.o.kind === "fastest");
  const backup = primary ? erOpts.find((x) => x.o.id !== primary.o.id) : undefined;

  let head: string, sub: string | null = null, state: 0 | 1 | 2 = 0;
  if (!primary || !best) {
    const trip = r.trips[er.id];
    head = typeof trip === "string" ? t("answer.er.noroute") : t("answer.er.finding");
  } else {
    const s0 = primary.s, minutes = routeMins(primary.o.timeS);
    state = best.s.state === 2 ? 2 : s0.state;
    if (s0.state === 0) { head = t("answer.head.ok", { time: minutes }); sub = t("answer.sub.ok"); }
    else if (s0.state === 1) { head = `${t("answer.head.ok", { time: minutes })}, ${tn("answer.head.watch", s0.watch.length)}`; sub = t("answer.sub.watch"); }
    else if (best.s.state < 2) { head = t("answer.head.closed.backup", { time: routeMins(best.o.timeS) }); sub = t("answer.sub.closed"); }
    else { head = t("answer.head.closed.all"); sub = t("answer.sub.closed.all"); }
  }
  return { r, live, er, fire, primary, best, firePrimary, backup, head, sub, state };
}

/** After an address: one answer first (can you reach an ER, and how), then the nearest ER, the nearest fire station and a backup route, one row each. */
export function AnswerCard() {
  const a = useAnswer();
  if (!a) return null;
  const { r, live, er, fire, primary, firePrimary, backup, head, sub, state } = a;
  type Opt = NonNullable<typeof primary>;

  const Row = ({ svc, opt, title, sub: line }: { svc?: Service; opt?: Opt; title: string; sub?: string }) => (
    <li>
      <button type="button" disabled={!opt} onClick={() => opt && r.setFocusId(opt.o.id)} aria-pressed={!!opt && r.focus === opt.o.id}
        className={`grid min-h-14 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-ink/[0.03] disabled:cursor-default ${opt && r.focus === opt.o.id ? "bg-blue/8" : ""}`}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink">{svc ? <KindIcon kind={svc.k} /> : <RouteIcon size={15} aria-hidden />}</span>
        <span className="min-w-0">
          <span className="block text-[13px] text-muted">{title}</span>
          <span className="block text-sm font-medium leading-snug">{svc ? svc.name : line}</span>
          {svc && line && <span className="block text-[13px] text-muted">{line}</span>}
        </span>
        <span className="flex flex-col items-end gap-1 text-right">
          {opt ? <><span className="tabular-nums text-sm font-medium">{routeMins(opt.o.timeS)}</span><StatusBadge state={opt.s.state} live={live} /></>
            : <LoaderCircle size={14} className="animate-spin text-muted" aria-label={t("access.routing.aria")} />}
        </span>
      </button>
    </li>
  );

  return (
    <section aria-label={t("answer.aria")} className="mt-3 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-panel">
      <div className={`p-4 ${state === 2 ? "bg-softred" : ""}`}>
        <p className="text-xl font-semibold leading-snug text-ink">{head}</p>
        {sub && <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">{sub}</p>}
      </div>
      <ul className="divide-y divide-ink/10 border-t border-ink/10">
        <Row svc={er} opt={primary} title={t("answer.row.er")} />
        {fire && <Row svc={fire} opt={firePrimary} title={t("answer.row.fire")} />}
        {backup && <Row opt={backup} title={t("answer.row.backup")} sub={backup.o.kind === "backup" ? backup.o.label : t("route.via", { kind: backup.o.kind === "detour" ? t("route.kind.detour") : t("route.kind.alternate"), road: tidyName(backup.o.via) })} />}
      </ul>
      {!backup && primary && (r.noBackup[er.id]
        ? <p className="flex gap-2 border-t border-ink/10 px-4 py-3 text-[13px] leading-relaxed text-ink/85"><AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />{t("route.nobackup", { name: er.name })}</p>
        : r.backupBusy ? <p className="flex items-center gap-2 border-t border-ink/10 px-4 py-3 text-[13px] text-muted"><LoaderCircle size={13} className="animate-spin" aria-hidden />{t("answer.backup.looking")}</p> : null)}
    </section>
  );
}
