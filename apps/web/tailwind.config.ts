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
        // Strict Black & White Palette Tokens
        charcoal: {
          DEFAULT: "#000000",
          deep: "#000000",
        },
        midnight: {
          DEFAULT: "#0A0A0A",
          surface: "#0A0A0A",
          elevated: "#141414",
        },
        tealshadow: {
          DEFAULT: "#171717",
          hover: "#262626",
          subtle: "rgba(255, 255, 255, 0.08)",
        },
        moss: {
          DEFAULT: "#262626",
          light: "#404040",
          subtle: "rgba(255, 255, 255, 0.08)",
        },
        olive: {
          DEFAULT: "#FFFFFF",
          hover: "#E5E5E5",
          light: "#F5F5F5",
          subtle: "rgba(255, 255, 255, 0.15)",
        },
        amber: {
          DEFAULT: "#FFFFFF",
          hover: "#E5E5E5",
          light: "#F5F5F5",
          subtle: "rgba(255, 255, 255, 0.15)",
        },
        cinnamon: {
          DEFAULT: "#525252",
          hover: "#737373",
          subtle: "rgba(255, 255, 255, 0.10)",
        },
        mauve: {
          DEFAULT: "#404040",
          hover: "#525252",
          subtle: "rgba(255, 255, 255, 0.08)",
        },
        moonstone: {
          DEFAULT: "#FFFFFF",
          light: "#FFFFFF",
          muted: "rgba(255, 255, 255, 0.70)",
        },
        // Strict Black and White Semantic Mappings
        background: "#000000",
        surface: {
          DEFAULT: "#0A0A0A",
          hover: "#141414",
          elevated: "#1A1A1A",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          DEFAULT: "rgba(255, 255, 255, 0.15)",
          strong: "rgba(255, 255, 255, 0.35)",
        },
        accent: {
          DEFAULT: "#FFFFFF",
          hover: "#E5E5E5",
          subtle: "rgba(255, 255, 255, 0.15)",
          highlight: "#FFFFFF",
        },
        success: {
          DEFAULT: "#FFFFFF",
          subtle: "rgba(255, 255, 255, 0.10)",
        },
        warning: {
          DEFAULT: "#A3A3A3",
          subtle: "rgba(255, 255, 255, 0.10)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      boxShadow: {
        rim: "inset 0 1px 0 0 rgba(255, 255, 255, 0.20)",
        "rim-subtle": "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
        card: "0 8px 32px rgba(0, 0, 0, 0.85)",
        glow: "0 0 30px -4px rgba(255, 255, 255, 0.25)",
        "glow-lg": "0 0 60px -8px rgba(255, 255, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
