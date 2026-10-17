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
          DEFAULT: "#121215",
          hover: "#18181b",
          elevated: "#1c1c21",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(255, 255, 255, 0.09)",
          strong: "rgba(255, 255, 255, 0.18)",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          subtle: "rgba(59, 130, 246, 0.1)",
        },
        success: {
          DEFAULT: "#10b981",
          subtle: "rgba(16, 185, 129, 0.1)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          subtle: "rgba(245, 158, 11, 0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      boxShadow: {
        rim: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
        "rim-subtle": "inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
        card: "0 8px 30px rgba(0, 0, 0, 0.35)",
        glow: "0 0 24px -4px rgba(59, 130, 246, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
