import { esc } from "@/lib/maplibre";

export type Row = [label: string, value: string, mono?: boolean];

/** Dark hover tooltip that follows the cursor with an offset and flips at the edges of its container. Plain DOM: no React render per mouse move. */
export function createTooltip(container: HTMLElement) {
  const el = document.createElement("div");
  el.setAttribute("role", "tooltip");
  el.className = "pointer-events-none absolute left-0 top-0 z-30 hidden w-max max-w-[260px] rounded-lg bg-[#1F2329]/95 px-3 py-2 font-ui text-xs leading-snug text-white shadow-xl will-change-transform";
  const arrow = document.createElement("i");
  arrow.className = "absolute top-3 h-2.5 w-2.5 rotate-45 bg-[#1F2329]/95";
  const body = document.createElement("div");
  el.append(arrow, body);
  container.appendChild(el);
  const GAP = 14;
  return {
    show(title: string, rows: Row[], x: number, y: number) {
      body.innerHTML = `<p class="mb-1 font-semibold">${esc(title)}</p>` + rows.map(([k, v, mono]) =>
        `<p class="flex justify-between gap-4"><span class="text-white/60">${esc(k)}</span><span class="${mono ? "font-mono tabular-nums" : "text-right"}">${esc(v)}</span></p>`).join("");
      el.classList.remove("hidden");
      const w = el.offsetWidth, h = el.offsetHeight, cw = container.clientWidth, ch = container.clientHeight;
      const flipX = x + GAP + w > cw - 8, flipY = y + GAP + h > ch - 8;
      const left = flipX ? x - GAP - w : x + GAP, top = flipY ? y - GAP - h + 12 : y - 6;
      el.style.transform = `translate3d(${Math.max(8, left)}px, ${Math.max(8, top)}px, 0)`;
      arrow.style.left = flipX ? "" : "-4px";
      arrow.style.right = flipX ? "-4px" : "";
    },
    hide() { el.classList.add("hidden"); },
    destroy() { el.remove(); },
  };
}
