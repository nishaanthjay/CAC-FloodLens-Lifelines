import type { Metadata } from "next";
import Image from "next/image";
import { Masthead } from "@/components/layout/masthead";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { Florence } from "@/components/landing/florence";
import { Audience } from "@/components/landing/audience";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Cta } from "@/components/landing/cta";
import { SampleProvider } from "@/components/forecast/sample-store";
import { Copy } from "@/content/rich";
import { t } from "@/content/copy";

export const metadata: Metadata = {
  title: t("about.title"),
  description: t("about.meta.description"),
};

const tests = [
  [t("about.test1.value"), t("about.test1.text")],
  [t("about.test2.value"), t("about.test2.text")],
  [t("about.test3.value"), t("about.test3.text")],
  [t("about.test4.value"), t("about.test4.text")],
  [t("about.test5.value"), t("about.test5.text")],
];

const limits = [
  t("about.claim1"),
  t("about.claim2"),
  t("about.claim3"),
  t("about.claim4"),
  t("about.claim5"),
  t("about.claim6"),
  t("about.claim7"),
  t("about.claim8"),
  t("about.claim9"),
  t("about.claim10"),
];

export default function About() {
  return (
    <>
      <Masthead />
      <SampleProvider>
      <main id="content">
        <Hero />
        <Florence />
        <Audience />
        <HowItWorks />
        <Cta />
      <section id="limits" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-display text-5xl font-black leading-tight tracking-[-0.03em]">{t("about.title")}</h2>
        <p role="note" className="mt-6 rounded-2xl border border-alert/30 bg-softred p-5 font-ui text-base font-semibold text-alert">
          {t("about.notice")}
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">{t("about.does.title")}</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          {t("about.does.body")}
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">{t("about.modes.title")}</h2>
        <dl className="mt-4 space-y-3 font-body text-lg leading-relaxed text-ink/80">
          <div><dt className="inline font-mono text-base font-semibold">{t("about.modes.replay.name")}</dt> <dd className="inline">{t("about.modes.replay.text")}</dd></div>
          <div><dt className="inline font-mono text-base font-semibold">{t("about.modes.nowcast.name")}</dt> <dd className="inline">{t("about.modes.nowcast.text")}</dd></div>
          <div><dt className="inline font-mono text-base font-semibold">{t("about.modes.forecast.name")}</dt> <dd className="inline">{t("about.modes.forecast.text")}</dd></div>
        </dl>

        <h2 className="mt-14 font-display text-3xl font-bold">{t("about.testing.title")}</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">{t("about.testing.intro")}</p>
        <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
          {tests.map(([n, text]) => (
            <li key={n} className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-5">
              <span className="font-display text-2xl font-bold text-blue">{n}</span>
              <span className="font-ui text-sm leading-relaxed text-ink/80">{text}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 font-display text-3xl font-bold">{t("about.case.title")}</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          {t("about.case.p1")}
        </p>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          {t("about.case.p2")}
        </p>
        <figure className="mt-6">
          <Image src="/case-study-brunswick.png" alt={t("about.case.alt")} width={953} height={438} className="h-auto w-full rounded-2xl border border-ink/10" />
          <figcaption className="mt-2 font-ui text-xs leading-relaxed text-muted">
            <Copy k="about.case.caption" />
          </figcaption>
        </figure>
        <p className="mt-6 font-body text-lg leading-relaxed text-ink/80">
          {t("about.case.p3")}
        </p>
        <p className="mt-4 font-ui text-sm leading-relaxed text-muted">
          <Copy k="about.case.p4" a="text-blue underline underline-offset-4" />
        </p>

        <h2 className="mt-14 font-display text-3xl font-bold">{t("about.claim.title")}</h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 font-body text-lg leading-relaxed text-ink/80">
          {limits.map((l) => <li key={l}>{l}</li>)}
        </ul>

        <h2 className="mt-14 font-display text-3xl font-bold">{t("about.privacy.title")}</h2>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/80">
          {t("about.privacy.body")}
        </p>

        <p className="mt-6 font-ui text-sm"><Copy k="about.statuslink" a="text-blue underline underline-offset-4" /></p>
      </section>
      </main>
      </SampleProvider>
      <Footer />
    </>
  );
}
