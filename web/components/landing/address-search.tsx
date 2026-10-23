"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { ADDRESS_EXAMPLE } from "@/lib/geocode";
import { Button } from "@/components/ui/button";
import { useSample } from "@/components/forecast/sample-store";

/** Hero search: hands the address to the route analysis page. */
export function AddressSearch() {
  const router = useRouter();
  const { data } = useSample();
  const [query, setQuery] = useState("");
  const go = (params: Record<string, string>) =>
    router.push(`/route?${new URLSearchParams({ ...(params.q ? {} : params) })}${params.q ? `#q=${encodeURIComponent(params.q)}` : ""}`);

  function trySample() {
    const site = data?.sites.find((s) => s.kind === "residential" && s.hours.some((h) => h.lost));
    if (site) go({ lat: String(site.lat), lon: String(site.lon), label: site.name });
  }

  return (
    <div className="enter mx-auto mt-12 max-w-xl text-center [--d:270ms] sm:mt-14">
      <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) go({ q: query.trim() }); }} role="search">
        <label htmlFor="addr" className="sr-only">Check an address</label>
        <div className="flex flex-col gap-2 rounded-[1.75rem] border border-ink/10 bg-white p-2 shadow-float transition focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15 sm:flex-row sm:items-center sm:rounded-full">
          <div className="flex min-h-12 flex-1 items-center gap-3 px-4">
            <Search aria-hidden size={20} strokeWidth={1.8} className="shrink-0 text-blue" />
            <input
              id="addr"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter an address in Cape Fear"
              autoComplete="street-address"
              className="min-h-12 w-full bg-transparent font-ui text-base text-ink placeholder:text-muted focus-visible:outline-none"
            />
          </div>
          <Button type="submit" className="min-h-12 gap-2 rounded-full px-7 sm:w-auto">
            Check routes
            <ArrowRight size={17} aria-hidden />
          </Button>
        </div>
      </form>
      <p className="mx-auto mt-4 max-w-md text-center font-ui text-xs leading-relaxed text-muted">
        Use a street address with the town name, {ADDRESS_EXAMPLE}. Place names like &ldquo;City Hall&rdquo; often do not match.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-1 font-ui text-sm text-ink/75">
        <button type="button" onClick={trySample} className="min-h-11 underline underline-offset-4 hover:text-blue">Try a sample location</button>
        <button type="button" onClick={() => go({ q: "1029 N Howe St, Southport NC" })} className="min-h-11 underline underline-offset-4 hover:text-blue">Try an example address</button>
        <a href="#breaks" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-blue">What breaks first?</a>
      </div>
      <p className="mt-6 inline-block rounded-full bg-yellow px-3.5 py-1.5 font-mono text-xs font-medium text-ink">Sample replay, not a live forecast</p>
      <p className="mx-auto mt-6 max-w-md font-ui text-xs leading-relaxed text-muted">
        No user data is stored (cookie-free page-view counts only). Addresses go to OpenStreetMap&rsquo;s Nominatim to find the location, and routes come from the public Valhalla router.
      </p>
    </div>
  );
}
