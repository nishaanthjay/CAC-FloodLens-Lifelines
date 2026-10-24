"use client";
import { useEffect, useRef, useState } from "react";
import { BOUNDS, STYLE, loadMaplibre, type ML } from "@/lib/maplibre";
import { useWS } from "@/components/workspace/store";

/** Camera padding that keeps the visible centre between the open panels. Desktop: left 400, right 380, top 90, bottom 110. */
export const mapPadding = (desktop: boolean, rightOpen: boolean, sheetPx: number) =>
  desktop ? { left: 460, right: rightOpen ? 392 : 80, top: 90, bottom: 110 } : { left: 24, right: 24, top: 110, bottom: sheetPx + 70 };

/** Full-viewport map. Phase 1: basemap and camera only; layers arrive in phase 2. */
export function MapView() {
  const { api, rightOpen, sheetPx } = useWS();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<ML>(null);
  const pad = useRef(mapPadding(true, true, 0));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pad.current = mapPadding(window.innerWidth >= 1024, rightOpen, sheetPx);
  }, [rightOpen, sheetPx]);

  useEffect(() => {
    let gone = false;
    loadMaplibre().then((ml) => {
      if (gone || !box.current) return;
      pad.current = mapPadding(window.innerWidth >= 1024, window.innerWidth >= 1280, 0);
      const m = new ml.Map({ container: box.current, style: STYLE, bounds: BOUNDS, fitBoundsOptions: { padding: pad.current }, attributionControl: false });
      map.current = m;
      m.addControl(new ml.AttributionControl({ compact: true }), "bottom-left");
      api.current = {
        zoomIn: () => m.zoomIn(), zoomOut: () => m.zoomOut(),
        reset: () => m.fitBounds(BOUNDS, { padding: pad.current, duration: 800 }),
        flyTo: (lon, lat, zoom) => m.flyTo({ center: [lon, lat], zoom: zoom ?? Math.max(m.getZoom(), 12), padding: pad.current, essential: true }),
      };
    }).catch((e: Error) => setError(e.message));
    return () => { gone = true; api.current = null; map.current?.remove(); map.current = null; };
  }, [api]);

  return (
    <div className="absolute inset-0">
      <div ref={box} className="h-full w-full" role="region" aria-label="Map of crossings and services in the Cape Fear region" />
      {error && <p className="absolute inset-0 grid place-items-center p-8 text-center font-ui text-sm text-muted">The map could not load ({error}).</p>}
    </div>
  );
}
