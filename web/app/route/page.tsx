import type { Metadata } from "next";
import { RouteRedirect } from "@/components/route/route-redirect";

export const metadata: Metadata = { title: "Address check", robots: { index: false } };

/** Old route-analysis links keep working: they open the workspace on the Access tab with the same parameters. */
export default function RoutePage() {
  return <RouteRedirect />;
}
