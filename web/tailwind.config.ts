import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F9F9F7",
        ink: "#111111",
        muted: "#5F6368",
        divider: "#E3E5E8",
        alert: "#CC0000",
        blue: "#2D5DA1",
        postit: "#FFF9C4",
        navy: "#16345B",
        highlight: "#FFF9C4",
        tint: "#E8F0FA",
        "soft-blue": "#E8F0FA",
        yellow: "#FFF9C4",
        softred: "#F7E1E1",
        risk: { 0: "#E8F0FA", 1: "#F7E1E1", 2: "#EFAEAE", 3: "#CC0000", 4: "#7A0000" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: { xs: ["0.8125rem", { lineHeight: "1.25rem" }] }, // 13px: nothing in the UI is smaller
      boxShadow: {
        panel: "0 10px 30px -20px rgb(17 17 17 / 0.32)",
        float: "0 24px 64px -28px rgb(17 17 17 / 0.3)",
        lift: "0 14px 34px -24px rgb(17 17 17 / 0.38)",
      },
    },
  },
  plugins: [],
} satisfies Config;
