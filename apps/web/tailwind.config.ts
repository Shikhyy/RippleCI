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
          DEFAULT: "#0f0e17",
          hover: "#151322",
          elevated: "#1a172c",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(106, 75, 255, 0.18)",
          strong: "rgba(228, 219, 255, 0.28)",
        },
        spectral: {
          base: "#6A4BFF",
          crest: "#E4DBFF",
          glow: "rgba(106, 75, 255, 0.25)",
        },
        accent: {
          DEFAULT: "#6A4BFF",
          hover: "#5835ea",
          subtle: "rgba(106, 75, 255, 0.12)",
          highlight: "#E4DBFF",
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
        rim: "inset 0 1px 0 0 rgba(228, 219, 255, 0.16)",
        "rim-subtle": "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        card: "0 8px 30px rgba(0, 0, 0, 0.35)",
        glow: "0 0 28px -4px rgba(106, 75, 255, 0.35)",
        "glow-lg": "0 0 60px -8px rgba(106, 75, 255, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
