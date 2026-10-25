"use client";
import { useEffect } from "react";
import { t } from "@/content/copy";

/** /route?lat&lon&label&svc&mode&hour#q=... becomes /?tab=access&... (the #q address fragment travels with it). The old default was the live view, so it maps to the forecast. */
export function RouteRedirect() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set("tab", "access");
    q.set("mode", q.get("mode") === "replay" ? "replay" : "forecast");
    window.location.replace(`/?${q}${window.location.hash}`);
  }, []);
  return <p className="p-6 text-sm text-muted">{t("redirect.text")} <a className="text-blue underline" href="/?tab=access">{t("redirect.continue")}</a></p>;
}
