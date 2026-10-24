import type { Metadata } from "next";
import { Suspense } from "react";
import { Workspace } from "@/components/workspace/workspace";

export const metadata: Metadata = {
  title: { absolute: "FloodLens Lifelines: can you still get to help?" },
  description: "A full-screen map of how flooding could change road access to hospitals and fire stations across Cape Fear, NC. Replay, nowcast and forecast preview. Not for emergency use.",
};

export default function Page() {
  return (
    <Suspense>
      <Workspace />
    </Suspense>
  );
}
