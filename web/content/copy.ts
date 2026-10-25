// All user-facing text lives in content/site-copy.md. `npm run copy` (runs before dev and build) turns it into copy.json.
import copy from "./copy.json";

const COPY: Record<string, string> = copy;
type Vars = Record<string, string | number>;

/** The text for `key`, with {placeholders} filled from `vars`. */
export function t(key: string, vars?: Vars): string {
  const raw = COPY[key];
  if (raw === undefined) throw new Error(`Missing copy key "${key}": add it to content/site-copy.md`);
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) => {
    if (vars && name in vars) return String(vars[name]);
    if (process.env.NODE_ENV !== "production") throw new Error(`Copy "${key}" needs a value for {${name}}`);
    return whole;
  });
}

/** Plural pair: picks `${base}.one` when n is 1, else `${base}.other`. {n} is filled in automatically. */
export const tn = (base: string, n: number, vars?: Vars) => t(`${base}.${n === 1 ? "one" : "other"}`, { n, ...vars });
