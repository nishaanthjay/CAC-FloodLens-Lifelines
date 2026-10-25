import { ArrowRight } from "lucide-react";
import { t } from "@/content/copy";

export function Cta() {
  return (
    <section className="mx-auto max-w-screen-xl px-4 py-24 sm:px-6 lg:py-36">
      <div className="reveal relative overflow-hidden rounded-3xl bg-blue px-6 py-16 text-center text-white sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-yellow/20 blur-3xl" aria-hidden />
        <h2 className="relative mx-auto max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
          {t("cta.title")}
        </h2>
        <p className="relative mx-auto mt-7 max-w-xl text-lg text-white/80">
          {t("cta.body")}
        </p>
        <a
          href="/?tab=access"
          className="relative mt-11 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-blue transition duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
        >
          {t("cta.button")}
          <ArrowRight size={16} aria-hidden />
        </a>
      </div>
    </section>
  );
}
