import type { Metadata } from "next";
import { Suspense } from "react";
import { Masthead } from "@/components/layout/masthead";
import { Footer } from "@/components/layout/footer";
import { EmergencyFinder } from "@/components/emergency/emergency-finder";

export const metadata: Metadata = {
  title: "Emergency finder",
  description: "The nearest emergency rooms, fire, EMS, police, dialysis centres, urgent care, nursing homes and pharmacies around Cape Fear, with call, directions and road check. Not for emergency use.",
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
