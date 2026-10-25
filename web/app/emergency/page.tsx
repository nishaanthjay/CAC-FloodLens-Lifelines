import type { Metadata } from "next";
import { Suspense } from "react";
import { Masthead } from "@/components/layout/masthead";
import { Footer } from "@/components/layout/footer";
import { EmergencyFinder } from "@/components/emergency/emergency-finder";
import { t } from "@/content/copy";

export const metadata: Metadata = {
  title: t("emergency.meta.title"),
  description: t("emergency.meta.description"),
};

export default function EmergencyPage() {
  return (
    <>
      <Masthead />
      <Suspense fallback={<main id="content" className="min-h-[80vh]" />}>
        <EmergencyFinder />
      </Suspense>
      <Footer />
    </>
  );
}
