import type { Metadata } from "next";
import { Masthead } from "@/components/layout/masthead";
import { Footer } from "@/components/layout/footer";
import { StatusTable } from "@/components/layout/status-table";

export const metadata: Metadata = { title: "Data status", description: "How fresh each live data layer is." };

export default function Status() {
  return (
    <>
      <Masthead />
      <main id="content" className="mx-auto min-h-[75vh] max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="font-display text-5xl font-black leading-tight tracking-[-0.03em]">Data status</h1>
        <p className="mt-4 font-body text-lg leading-relaxed text-ink/75">
          Live layers refresh hourly. The site never fakes freshness: each file keeps the time it was generated, and turns red here and in the app when it is old.
        </p>
        <StatusTable />
      </main>
      <Footer />
    </>
  );
}
