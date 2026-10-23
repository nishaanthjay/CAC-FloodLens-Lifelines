// MapLibre 6 loads its worker from a URL that bundlers break; serve the worker files ourselves and point MapLibre at them (see lib/maplibre.ts).
import { cpSync, mkdirSync } from "node:fs";
mkdirSync("public/maplibre", { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) cpSync(`node_modules/maplibre-gl/dist/${f}`, `public/maplibre/${f}`);
