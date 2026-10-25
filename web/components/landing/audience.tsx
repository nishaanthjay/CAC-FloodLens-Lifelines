import { Building2, House } from "lucide-react";
import { t } from "@/content/copy";

const people = [
  {
    icon: House,
    title: t("audience.residents.title"),
    body: t("audience.residents.body"),
  },
  {
    icon: Building2,
    title: t("audience.teams.title"),
    body: t("audience.teams.body"),
  },
];

export function Audience() {
  return (
    <section className="mx-auto max-w-screen-xl px-4 pb-24 sm:px-6 lg:pb-36">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="reveal">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-6xl">
            {t("audience.title")}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/70">
            {t("audience.sub")}
          </p>
        </div>

        <div className="grid gap-12 sm:grid-cols-2 sm:gap-10 lg:pt-3">
          {people.map(({ icon: Icon, title, body }) => (
            <article key={title} className="reveal border-t-2 border-ink pt-6">
              <Icon size={24} strokeWidth={1.8} className="text-blue" aria-hidden />
              <h3 className="mt-5 font-display text-2xl font-bold sm:text-3xl">{title}</h3>
              <p className="mt-4 text-base leading-relaxed text-ink/70">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
