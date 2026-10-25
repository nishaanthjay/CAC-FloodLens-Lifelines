import type { Metadata } from "next";
import { Suspense } from "react";
import { Workspace } from "@/components/workspace/workspace";
import { t } from "@/content/copy";

export const metadata: Metadata = {
  title: { absolute: t("site.share.title") },
  description: t("workspace.meta.description"),
};

export default function Page() {
  return (
    <Suspense>
      <Workspace />
    </Suspense>
  );
}
