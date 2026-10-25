import { Fragment } from "react";
import { t } from "./copy";

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/;

/** Copy text with light inline markup: **bold**, `code`, [link text](/path). Classes go on the elements it makes. */
export function Copy({ k, vars, b, code, a }: { k: string; vars?: Record<string, string | number>; b?: string; code?: string; a?: string }) {
  return (
    <>
      {t(k, vars).split(INLINE).map((part, i) => {
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) return <a key={i} className={a} href={link[2]}>{link[1]}</a>;
        if (part.startsWith("**")) return <b key={i} className={b}>{part.slice(2, -2)}</b>;
        if (part.startsWith("`")) return <code key={i} className={code}>{part.slice(1, -1)}</code>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
