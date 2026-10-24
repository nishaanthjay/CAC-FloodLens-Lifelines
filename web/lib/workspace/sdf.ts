// Crisp map icons as signed-distance-field images, so one glyph can be tinted per feature (icon-color) and stays sharp at every zoom.
// Each icon is drawn white on a transparent canvas, then converted with the same exact Euclidean distance transform as mapbox/tiny-sdf.
import type { ML } from "@/lib/maplibre";

const SIZE = 64, BUFFER = 8, CUTOFF = 0.25, RADIUS = 8, INF = 1e20;

function edt1d(grid: Float64Array, offset: number, stride: number, length: number, f: Float64Array, v: Uint16Array, z: Float64Array) {
  v[0] = 0; z[0] = -INF; z[1] = INF; f[0] = grid[offset];
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride];
    const q2 = q * q;
    do {
      const r = v[k];
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k], qr = q - r;
    grid[offset + q * stride] = f[r] + qr * qr;
  }
}
function edt(data: Float64Array, w: number, h: number, f: Float64Array, v: Uint16Array, z: Float64Array) {
  for (let x = 0; x < w; x++) edt1d(data, x, w, h, f, v, z);
  for (let y = 0; y < h; y++) edt1d(data, y * w, 1, w, f, v, z);
}

function toSdf(draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SIZE;
  const c = cv.getContext("2d", { willReadFrequently: true })!;
  c.fillStyle = "#fff"; c.strokeStyle = "#fff";
  draw(c);
  const px = c.getImageData(0, 0, SIZE, SIZE).data, n = SIZE * SIZE;
  const outer = new Float64Array(n), inner = new Float64Array(n);
  const f = new Float64Array(SIZE), v = new Uint16Array(SIZE), z = new Float64Array(SIZE + 1);
  for (let i = 0; i < n; i++) {
    const a = px[i * 4 + 3] / 255;
    outer[i] = a === 1 ? 0 : a === 0 ? INF : Math.max(0, 0.5 - a) ** 2;
    inner[i] = a === 1 ? INF : a === 0 ? 0 : Math.max(0, a - 0.5) ** 2;
  }
  edt(outer, SIZE, SIZE, f, v, z); edt(inner, SIZE, SIZE, f, v, z);
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const d = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
    out[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(255 - 255 * (d / RADIUS + CUTOFF))));
  }
  return { width: SIZE, height: SIZE, data: out };
}

const R = SIZE / 2;
const ICONS: Record<string, (c: CanvasRenderingContext2D) => void> = {
  disc: (c) => { c.beginPath(); c.arc(R, R, R - BUFFER, 0, Math.PI * 2); c.fill(); },
  // hospital: a plus with rounded arms
  cross: (c) => { c.lineCap = "round"; c.lineWidth = 11; c.beginPath(); c.moveTo(R, 18); c.lineTo(R, 46); c.moveTo(18, R); c.lineTo(46, R); c.stroke(); },
  flame: (c) => {
    c.beginPath(); c.moveTo(32, 12);
    c.bezierCurveTo(37, 21, 46, 26, 46, 38); c.bezierCurveTo(46, 47, 40, 53, 32, 53);
    c.bezierCurveTo(24, 53, 18, 47, 18, 39); c.bezierCurveTo(18, 33, 21, 29, 24, 26);
    c.bezierCurveTo(25, 31, 28, 33, 30, 33); c.bezierCurveTo(31, 25, 29, 19, 32, 12); c.closePath(); c.fill();
  },
  dot: (c) => { c.beginPath(); c.arc(R, R, 10, 0, Math.PI * 2); c.fill(); },
};

/** Registers every icon once per style. `pixelRatio: 2` makes them 32 px at icon-size 1. */
export function addIcons(map: ML) {
  for (const [name, draw] of Object.entries(ICONS)) if (!map.hasImage(`ws-${name}`)) map.addImage(`ws-${name}`, toSdf(draw), { sdf: true, pixelRatio: 2 });
}
