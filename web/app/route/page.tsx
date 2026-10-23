import type { Metadata } from "next";
import { Suspense } from "react";
import { Masthead } from "@/components/layout/masthead";
import { RouteApp } from "@/components/route/route-app";

export const metadata: Metadata = {
  title: "Route analysis",
  description: "Routes from a Cape Fear address to emergency rooms, fire, EMS, police, dialysis and other services, checked against the latest river-flow forecast (Now and forecast) or kept apart in the Florence 2018 replay. Sample data, not validated.",
};

export default function RoutePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col lg:h-[100dvh] print:h-auto">
      <Masthead />
      <Suspense>
        <RouteApp />
      </Suspense>
    </div>
  );
}
