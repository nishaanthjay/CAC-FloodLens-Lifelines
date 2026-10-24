"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getJSON, siteView, type Crossing, type LocationView, type Meta } from "@/lib/sample";
import { placeName, tidyName } from "@/lib/format";

type Data = { meta: Meta; sites: LocationView[]; crossings: Crossing[] };
type Ctx = {
  data: Data | null;
  error: string | null;
  hour: number;
  setHour: (h: number) => void;
  selected: LocationView | null;
  select: (loc: LocationView | null) => void;
  crossingName: (id: string) => string;
};

const SampleCtx = createContext<Ctx | null>(null);
export const useSample = () => useContext(SampleCtx)!;

/** Shared state for the Florence replay on the home page: replay hour and the selected sample place. */
export function SampleProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hour, setHour] = useState(0);
  const [selected, select] = useState<LocationView | null>(null);

  useEffect(() => {
    Promise.all([getJSON<Meta>("meta.json"), getJSON<{ addresses: Parameters<typeof siteView>[0][] }>("addresses.json"),
      getJSON<{ crossings: Crossing[] }>("crossings.json")])
      .then(([meta, a, c]) => setData({ meta, sites: a.addresses.filter((x) => x.kind === "residential").map(siteView).map((s) => ({ ...s, name: `Census block near ${placeName(s.lat, s.lon)}` })),
        crossings: c.crossings.map((x) => ({ ...x, name: tidyName(x.name) })) }))
      .catch((e: Error) => setError(e.message));
  }, []);

  const crossingName = (id: string) => data?.crossings.find((c) => c.id === id)?.name ?? id;

  return (
    <SampleCtx.Provider value={{ data, error, hour, setHour, selected, select, crossingName }}>
      {children}
    </SampleCtx.Provider>
  );
}
