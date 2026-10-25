import { Copy } from "@/content/rich";
import { t } from "@/content/copy";

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 overflow-hidden bg-[#16345B] text-white">
      <div className="mx-auto max-w-screen-xl px-4 py-24 sm:px-6 lg:py-36">
        <div className="reveal mx-auto max-w-3xl rounded-3xl border border-white/15 bg-white/5 p-7 sm:p-10">
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
