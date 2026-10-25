import type { Metadata } from "next";
import { Masthead } from "@/components/layout/masthead";
import { Footer } from "@/components/layout/footer";
import { StatusTable } from "@/components/layout/status-table";
import { t } from "@/content/copy";

export const metadata: Metadata = { title: t("status.title"), description: t("status.meta.description") };

export default function Status() {
  return (
    <>
      <Masthead />
      <main id="content" className="mx-auto min-h-[75vh] max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="font-display text-5xl font-black leading-tight tracking-[-0.03em]">{t("status.title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/75">
          {t("status.intro")}
        </p>
        <StatusTable />
      </main>
      <Footer />
    </>
  );
}
