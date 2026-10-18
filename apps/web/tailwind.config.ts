import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c0e",
        surface: {
          DEFAULT: "#0d1417",
          hover: "#121b1f",
          elevated: "#182329",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.07)",
          DEFAULT: "rgba(108, 198, 203, 0.20)",
          strong: "rgba(234, 229, 201, 0.35)",
        },
        spectral: {
          base: "#6CC6CB",
          crest: "#EAE5C9",
          glow: "rgba(108, 198, 203, 0.28)",
        },
        champagne: {
          DEFAULT: "#EAE5C9",
          light: "#FAF7EA",
          dark: "#D8D1A3",
        },
        teal: {
          DEFAULT: "#6CC6CB",
          light: "#A4E4E8",
          dark: "#4CA2A7",
        },
        accent: {
          DEFAULT: "#6CC6CB",
          hover: "#58B4B9",
          subtle: "rgba(108, 198, 203, 0.12)",
          highlight: "#EAE5C9",
        },
        success: {
          DEFAULT: "#10b981",
          subtle: "rgba(16, 185, 129, 0.12)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          subtle: "rgba(245, 158, 11, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      boxShadow: {
        rim: "inset 0 1px 0 0 rgba(234, 229, 201, 0.24)",
        "rim-subtle": "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        card: "0 8px 30px rgba(0, 0, 0, 0.45)",
        glow: "0 0 28px -4px rgba(108, 198, 203, 0.35)",
        "glow-lg": "0 0 60px -8px rgba(108, 198, 203, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
