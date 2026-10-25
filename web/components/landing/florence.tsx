import { ArrowDown, History } from "lucide-react";
import { coastMain, florence, islands, ocean, riversMajor, roadsMajor, wilmington } from "@/lib/cape-fear";
import { t } from "@/content/copy";

const facts = [
  [t("florence.fact1.label"), t("florence.fact1.value")],
  [t("florence.fact2.label"), t("florence.fact2.value")],
];

export function Florence() {
  return (
    <section id="florence" className="scroll-mt-16 mx-auto max-w-screen-xl px-4 pb-12 sm:px-6 lg:pb-16">
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-[#0E2440] p-6 text-white sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:p-14">
        <div className="reveal">
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            {t("florence.title")}
          </h2>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-yellow">
            <History size={14} aria-hidden />
            {t("florence.pill")}
          </p>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">
            {t("florence.body")}
          </p>
          <dl className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {facts.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-4">
                <dt className="text-xs font-medium text-white/65">{label}</dt>
                <dd className="text-sm text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-white/65">{t("florence.source")}</p>
          <a href="/?mode=replay" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0E2440] transition hover:-translate-y-0.5 hover:shadow-lift">
            {t("florence.cta")} <ArrowDown size={16} aria-hidden />
          </a>
        </div>

        <figure className="reveal-zoom relative">
          <svg viewBox="200 0 1200 1000" className="block w-full rounded-2xl" role="img" aria-labelledby="fl-t">
            <title id="fl-t">{t("florence.map.title")}</title>
            <rect x="0" y="0" width="1600" height="1000" fill="#16345B" />
            <path d={ocean} fill="#0B1E36" />
            <path d={islands} fill="#16345B" />
            <path d={riversMajor} fill="none" stroke="#3E6FB0" strokeWidth="3" />
            <path d={roadsMajor} fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="2" />
            <path d={coastMain} fill="none" stroke="#8FB3E6" strokeOpacity=".6" strokeWidth="1.5" />
            <path d={florence.d} fill="none" stroke="#CC0000" strokeOpacity=".25" strokeWidth="60" strokeLinecap="round" />
            <path d={florence.d} fill="none" stroke="#FF8A8A" strokeWidth="4" strokeDasharray="14 12" strokeLinecap="round" />
            <g transform={`translate(${florence.landfall[0]} ${florence.landfall[1]})`}>
              <circle r="34" fill="none" stroke="#FF8A8A" strokeWidth="3" />
              <circle r="12" fill="#CC0000" stroke="#fff" strokeWidth="4" />
            </g>
            <g transform={`translate(${wilmington[0]} ${wilmington[1]})`} fontFamily="var(--)" fontWeight="600">
              <circle r="9" fill="#FFF9C4" />
              <text x="-18" y="6" textAnchor="end" fontSize="26" fill="#fff">{t("florence.map.city")}</text>
            </g>
          </svg>
          <figcaption className="mt-3 text-xs text-white/65">
            {t("florence.map.caption")}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
