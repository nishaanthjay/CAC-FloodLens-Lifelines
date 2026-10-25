"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { ADDRESS_EXAMPLE } from "@/lib/geocode";
import { Button } from "@/components/ui/button";
import { useSample } from "@/components/forecast/sample-store";
import { t } from "@/content/copy";

/** Hero search: hands the address to the map workspace (Access tab). The address travels in the URL fragment only. */
export function AddressSearch() {
  const router = useRouter();
  const { data } = useSample();
  const [query, setQuery] = useState("");
  const go = (params: Record<string, string>) =>
    router.push(`/?${new URLSearchParams({ tab: "access", mode: "forecast", ...(params.q ? {} : params) })}${params.q ? `#q=${encodeURIComponent(params.q)}` : ""}`);

  function trySample() {
    // The place that loses its route for the most replay hours, opened at the first hour it is cut off.
    const lost = (s: { hours: { lost: boolean }[] }) => s.hours.filter((h) => h.lost).length;
    const site = [...(data?.sites ?? [])].filter((s) => lost(s) > 0).sort((a, b) => lost(b) - lost(a))[0];
    if (site) go({ lat: String(site.lat), lon: String(site.lon), label: site.name, mode: "replay", hour: String(site.hours.findIndex((h) => h.lost)) });
  }

  return (
    <div className="enter mx-auto mt-12 max-w-xl text-center [--d:270ms] sm:mt-14">
      <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) go({ q: query.trim() }); }} role="search">
        <label htmlFor="addr" className="sr-only">{t("hero.address.label")}</label>
        <div className="flex flex-col gap-2 rounded-[1.75rem] border border-ink/10 bg-white p-2 shadow-float transition focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15 sm:flex-row sm:items-center sm:rounded-full">
          <div className="flex min-h-12 flex-1 items-center gap-3 px-4">
            <Search aria-hidden size={20} strokeWidth={1.8} className="shrink-0 text-blue" />
            <input
              id="addr"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("hero.address.placeholder")}
              autoComplete="street-address"
              className="min-h-12 w-full bg-transparent font-ui text-base text-ink placeholder:text-muted focus-visible:outline-none"
            />
          </div>
          <Button type="submit" className="min-h-12 gap-2 rounded-full px-7 sm:w-auto">
            {t("hero.address.submit")}
            <ArrowRight size={17} aria-hidden />
          </Button>
        </div>
      </form>
      <p className="mx-auto mt-4 max-w-md text-center font-ui text-xs leading-relaxed text-muted">
        {t("hero.address.hint", { example: ADDRESS_EXAMPLE })}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-ui text-sm">
        <button type="button" onClick={trySample} className="min-h-11 font-semibold text-ink underline underline-offset-4 hover:text-blue">{t("hero.address.sample")}</button>
        <a href="/emergency" className="inline-flex min-h-11 items-center rounded-full border border-alert/40 bg-softred px-5 font-semibold text-alert hover:border-alert">{t("hero.address.emergency")}</a>
      </div>
      <p className="mx-auto mt-6 max-w-md font-ui text-xs leading-relaxed text-muted">
        {t("hero.address.privacy")}
      </p>
    </div>
  );
}
