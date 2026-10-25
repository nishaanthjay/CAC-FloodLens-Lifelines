import { Droplets } from "lucide-react";
import { t } from "@/content/copy";

const cols = [
  [t("footer.explore.title"), [[t("footer.explore.replay"), "/?mode=replay"], [t("footer.explore.address"), "/?tab=access"], [t("footer.explore.breaks"), "/?tab=consequence"]]],
  [t("footer.about.title"), [[t("footer.about.how"), "/about#how"], [t("footer.about.limits"), "/about#limits"], [t("footer.about.status"), "/status"]]],
] as const;

export function Footer() {
  return (
    <footer className="bg-[#F2F2EF]">
    <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 md:col-span-1">
          <a href="/" className="inline-flex min-h-11 items-center gap-2.5 font-display text-xl font-bold tracking-[-0.025em]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue text-white">
              <Droplets size={19} aria-hidden />
            </span>
            {t("site.brand.first")} <span className="text-blue">{t("site.brand.second")}</span>
          </a>
          <p className="mt-3 max-w-[30ch] font-body text-sm leading-relaxed text-muted">
            {t("footer.tagline")}
          </p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <h2 className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</h2>
            <ul className="mt-2 font-ui text-sm">
              {links.map(([text, href]) => (
                <li key={text}><a href={href} className="inline-flex min-h-11 items-center text-ink/75 underline-offset-4 hover:text-blue hover:underline">{text}</a></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t("footer.privacy.title")}</h2>
          <p className="mt-3 font-ui text-sm leading-relaxed text-ink/75">{t("footer.privacy.body")}</p>
        </div>
      </div>
      <p className="mt-10 border-t border-ink/10 pt-5 font-ui text-xs leading-relaxed text-muted">
        {t("footer.place")} <span className="px-1.5">|</span> {t("footer.credit")}
      </p>
    </div>
    </footer>
  );
}
