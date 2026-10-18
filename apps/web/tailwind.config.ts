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
        background: "#09090b",
        surface: {
          DEFAULT: "#111116",
          hover: "#18171f",
          elevated: "#1f1e29",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.07)",
          DEFAULT: "rgba(245, 158, 11, 0.20)",
          strong: "rgba(254, 243, 199, 0.30)",
        },
        spectral: {
          base: "#F59E0B",
          crest: "#FEF3C7",
          glow: "rgba(245, 158, 11, 0.25)",
        },
        accent: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          subtle: "rgba(245, 158, 11, 0.12)",
          highlight: "#FEF3C7",
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
        rim: "inset 0 1px 0 0 rgba(254, 243, 199, 0.18)",
        "rim-subtle": "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        card: "0 8px 30px rgba(0, 0, 0, 0.4)",
        glow: "0 0 28px -4px rgba(245, 158, 11, 0.35)",
        "glow-lg": "0 0 60px -8px rgba(245, 158, 11, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
