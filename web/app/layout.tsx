import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, JetBrains_Mono, Lora, Playfair_Display } from "next/font/google";
import "./globals.css";
import { IntroGate } from "@/components/layout/intro-gate";
import { introScript } from "@/components/layout/intro-script";
import "@/components/layout/intro.css";

const display = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-display" });
const body = Lora({ subsets: ["latin"], variable: "--font-body" });
const ui = Inter({ subsets: ["latin"], variable: "--font-ui" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifelines-flax.vercel.app";
const DESC = "If the roads flood, can your neighborhood still reach a hospital or fire station? Flood scenarios for Cape Fear, NC. Not a forecast, not for emergency use.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "FloodLens Lifelines", template: "%s · FloodLens Lifelines" },
  description: DESC,
  openGraph: { type: "website", siteName: "FloodLens Lifelines", title: "FloodLens Lifelines: can you still get to help?", description: DESC, locale: "en_US" },
  twitter: { card: "summary_large_image", title: "FloodLens Lifelines: can you still get to help?", description: DESC },
};

export const viewport: Viewport = { themeColor: "#2D5DA1", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${ui.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <IntroGate />
        <a
          href="#content"
          className="sr-only z-50 rounded-xl bg-blue px-4 py-3 font-ui text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
