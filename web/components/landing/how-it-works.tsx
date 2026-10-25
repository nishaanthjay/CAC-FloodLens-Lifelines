import { Activity, Droplets, Route, Waves } from "lucide-react";
import { Copy } from "@/content/rich";
import { t } from "@/content/copy";

const steps = [
  { title: t("how.step1.title"), description: t("how.step1.body"), icon: Droplets },
  { title: t("how.step2.title"), description: t("how.step2.body"), icon: Waves },
  { title: t("how.step3.title"), description: t("how.step3.body"), icon: Activity },
  { title: t("how.step4.title"), description: t("how.step4.body"), icon: Route },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 overflow-hidden bg-[#16345B] text-white">
      <div className="mx-auto max-w-screen-xl px-4 py-24 sm:px-6 lg:py-36">
        <div className="reveal mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-6xl">
            {t("how.title")}
          </h2>
          <p className="mt-5 font-body text-lg leading-relaxed text-white/75">
            {t("how.sub")}
          </p>
        </div>

        {/* One connected chain: the line carries the order, so the steps need no numbers. */}
        <ol className="relative mt-20 grid gap-12 pl-16 before:absolute before:bottom-2 before:left-6 before:top-2 before:w-px before:bg-white/20 lg:grid-cols-4 lg:gap-8 lg:pl-0 lg:pt-20 lg:before:inset-x-6 lg:before:bottom-auto lg:before:top-6 lg:before:h-px lg:before:w-auto">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="reveal relative min-w-0">
              <span
                className={`absolute -left-16 top-0 grid h-12 w-12 place-items-center rounded-full ring-8 ring-[#16345B] lg:-top-20 lg:left-0 ${
                  index === 0 ? "bg-yellow text-ink" : "bg-[#24497A] text-white"
                }`}
              >
                <Icon size={22} strokeWidth={1.7} aria-hidden />
              </span>
              <h3 className="font-display text-2xl font-bold">{title}</h3>
              <p className="mt-3 max-w-[28ch] font-ui text-sm leading-relaxed text-white/70">{description}</p>
            </li>
          ))}
        </ol>

        <div className="reveal mx-auto mt-24 max-w-3xl rounded-3xl border border-white/15 bg-white/5 p-7 sm:p-10">
          <h3 className="font-display text-2xl font-bold sm:text-3xl">{t("how.limits.title")}</h3>
          <p className="mt-3 font-ui text-sm leading-relaxed text-white/75">
            {t("how.limits.intro")}
          </p>
          <ul className="mt-6 list-disc space-y-3.5 pl-5 font-body text-base leading-relaxed text-white/85">
            <li><Copy k="how.limits.surge" /></li>
            <li><Copy k="how.limits.pluvial" /></li>
            <li><Copy k="how.limits.deck" /></li>
            <li><Copy k="how.limits.islands" /></li>
          </ul>
          <p className="mt-6 font-ui text-xs leading-relaxed text-white/70">
            {t("how.limits.islandsnote")}
          </p>
        </div>
      </div>
    </section>
  );
}
