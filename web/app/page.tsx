import { Masthead } from "@/components/layout/masthead";
import { Hero } from "@/components/landing/hero";
import { ModeSection } from "@/components/forecast/mode-section";
import { ForecastMap } from "@/components/forecast/forecast-map";
import { ResiliencePanel } from "@/components/forecast/resilience-panel";
import { BreaksTable } from "@/components/forecast/breaks-table";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/layout/footer";
import { Florence } from "@/components/landing/florence";
import { Audience } from "@/components/landing/audience";
import { Cta } from "@/components/landing/cta";
import { SampleProvider } from "@/components/forecast/sample-store";

export default function Page() {
  return (
    <>
      <Masthead />
      <SampleProvider>
      <main id="content">
        <Hero />

        <Florence />
        <section id="map" className="scroll-mt-16">
          <div className="mx-auto max-w-screen-xl px-4 pb-24 pt-20 sm:px-6 sm:pt-32 lg:pb-36">
            <div className="reveal mx-auto mb-14 max-w-2xl text-center sm:mb-16">
              <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-6xl">
                Replay, nowcast, forecast preview
              </h2>
              <p className="mt-5 font-body text-lg leading-relaxed text-ink/70">
                Three views, kept apart. The replay steps through Hurricane Florence one hour at a time. The nowcast shows what gauges and tide stations report now. The forecast preview is an unvalidated model run.
              </p>
            </div>
            <ModeSection replay={<><ForecastMap /><ResiliencePanel /></>} />
          </div>
        </section>

        <BreaksTable />
        <Audience />
        <HowItWorks />
        <Cta />
      </main>
      </SampleProvider>
      <Footer />
    </>
  );
}
