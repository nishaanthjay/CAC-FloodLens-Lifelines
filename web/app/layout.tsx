import type { Metadata, Viewport } from "next";
import { Playfair_Display, Public_Sans } from "next/font/google";
import "./globals.css";
import { IntroGate } from "@/components/layout/intro-gate";
import { introScript } from "@/components/layout/intro-script";
import "@/components/layout/intro.css";
import { t } from "@/content/copy";

const display = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-display" });
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" }); // body and small text; Playfair stays on headings

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifelines-nc.vercel.app";
const DESC = t("site.description");
const TITLE = t("site.share.title");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: t("site.name"), template: t("site.title.template") },
  description: DESC,
  openGraph: { type: "website", siteName: t("site.name"), title: TITLE, description: DESC, locale: "en_US" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export const viewport: Viewport = { themeColor: "#2D5DA1", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <IntroGate />
        <a
          href="#content"
          className="sr-only z-50 rounded-xl bg-blue px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t("site.skip")}
        </a>
        {children}
      </body>
    </html>
  );
}
