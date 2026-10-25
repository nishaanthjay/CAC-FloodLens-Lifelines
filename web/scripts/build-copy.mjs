// Parses content/site-copy.md into content/copy.json and checks it against the source.
// Run: npm run copy (also runs before dev and build). Missing key = error, unused key = warning.
import { existsSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MD = join(root, "content/site-copy.md");
const JSON_OUT = join(root, "content/copy.json");
const SCAN = ["app", "components", "lib", "content"];

/** "## key" starts an entry; its value is the lines below it (comments and "# group" headings are skipped). */
export function parseCopy(md) {
  const entries = new Map(), errors = [];
  let key = null, lines = [], notes = [];
  const flush = () => {
    if (key === null) return;
    const value = lines.join(" ").replace(/\s+/g, " ").trim();
    const declared = new Set((notes.join(" ; ").match(/placeholders:\s*([^;]*)/)?.[1] ?? "").split(",").map((s) => s.trim()).filter((s) => s && s !== "none"));
    const used = new Set([...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
    for (const u of used) if (!declared.has(u)) errors.push(`"${key}": uses {${u}} but the "placeholders:" comment above it does not list it`);
    for (const d of declared) if (!used.has(d)) errors.push(`"${key}": the "placeholders:" comment lists ${d} but the text does not use {${d}}`);
    if (!value) errors.push(`"${key}": empty text`);
    if (entries.has(key)) errors.push(`"${key}": defined twice`);
    entries.set(key, value);
    key = null; lines = []; notes = [];
  };
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    const h = /^## (\S+)$/.exec(line);
    if (h) { flush(); key = h[1]; continue; }
    if (/^# /.test(line)) { flush(); notes = []; continue; }
    const c = /^<!--(.*)-->$/.exec(line);
    if (c) { if (key !== null) flush(); notes.push(c[1].trim()); continue; }
    if (key !== null && line) lines.push(line);
  }
  flush();
  return { entries, errors };
}

function sources(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f === "node_modules" || f === ".next" || f.startsWith(".")) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.(ts|tsx)$/.test(f) && !/^copy\.ts$|\.d\.ts$/.test(f)) out.push(p);
  }
  return out;
}

/** Keys the code asks for: t("a.b"), tn("a.b", n) (-> a.b.one and a.b.other), <Copy k="a.b" />. */
export function usedKeys() {
  const used = new Map();
  const add = (k, file) => used.set(k, [...(used.get(k) ?? []), file]);
  for (const dir of SCAN) if (existsSync(join(root, dir))) for (const f of sources(join(root, dir))) {
    const src = readFileSync(f, "utf8"), rel = f.slice(root.length + 1).replace(/\\/g, "/");
    for (const m of src.matchAll(/(?<![\w.$])t\(\s*"([^"]+)"/g)) add(m[1], rel);
    for (const m of src.matchAll(/(?<![\w.$])tn\(\s*"([^"]+)"/g)) { add(`${m[1]}.one`, rel); add(`${m[1]}.other`, rel); }
    for (const m of src.matchAll(/<Copy\s+k="([^"]+)"/g)) add(m[1], rel);
  }
  return used;
}

export function buildCopy({ exit = true } = {}) {
  const { entries, errors } = parseCopy(readFileSync(MD, "utf8"));
  const used = usedKeys();
  for (const [k, files] of used) if (!entries.has(k)) errors.push(`missing key "${k}" (used in ${[...new Set(files)].join(", ")}): add it to content/site-copy.md`);
  for (const k of entries.keys()) if (!used.has(k)) console.warn(`[copy] warning: unused key "${k}"`);
  if (errors.length) {
    console.error(`[copy] ${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
    if (exit) process.exit(1);
    return false;
  }
  const json = JSON.stringify(Object.fromEntries(entries), null, 1) + "\n";
  if (!existsSync(JSON_OUT) || readFileSync(JSON_OUT, "utf8") !== json) writeFileSync(JSON_OUT, json);
  return true;
}

/** Dev only: rebuild copy.json whenever the md is saved, so the running dev server hot-reloads the new text. */
export function watchCopy() {
  if (globalThis.__copyWatch) return;
  globalThis.__copyWatch = true;
  buildCopy({ exit: false });
  let timer;
  watch(MD, () => { clearTimeout(timer); timer = setTimeout(() => buildCopy({ exit: false }) && console.log("[copy] site-copy.md reloaded"), 150); });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildCopy();
