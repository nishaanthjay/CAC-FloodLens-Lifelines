import { ImageResponse } from "next/og";
import { t } from "@/content/copy";

export const alt = t("site.og.alt");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#16345B", color: "#fff", fontFamily: "serif" }}>
        <div style={{ fontSize: 30, color: "#8FB3E6", letterSpacing: 2 }}>{t("site.og.kicker")}</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, marginTop: 28 }}>{t("site.og.headline")}</div>
        <div style={{ fontSize: 34, color: "#d6e2f5", marginTop: 32, maxWidth: 900 }}>{t("site.og.subhead")}</div>
      </div>
    ),
    size,
  );
}
