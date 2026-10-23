import type { MetadataRoute } from "next";

export const dynamic = "force-static";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifelines-flax.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/route", "/about", "/status"].map((p) => ({ url: SITE + p }));
}
