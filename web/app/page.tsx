import type { Metadata } from "next";
import { Suspense } from "react";
import { Workspace } from "@/components/workspace/workspace";
import About from "@/app/about/page";
import { t } from "@/content/copy";

export const metadata: Metadata = {
  title: { absolute: t("site.share.title") },
  description: t("workspace.meta.description"),
};

/** The bare address is the homepage; any workspace link (tab, mode, place, hour) opens the map. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (Object.keys(await searchParams).length === 0) return <About />;
  return (
    <Suspense>
      <Workspace />
    </Suspense>
  );
}
