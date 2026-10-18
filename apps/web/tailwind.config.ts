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
        // Direct Palette Tokens from User Specification
        charcoal: {
          DEFAULT: "#0B0D10",
          deep: "#0B0D10",
        },
        midnight: {
          DEFAULT: "#121A2B",
          surface: "#121A2B",
          elevated: "#182338",
        },
        tealshadow: {
          DEFAULT: "#1B3B3F",
          hover: "#244E53",
          subtle: "rgba(27, 59, 63, 0.4)",
        },
        moss: {
          DEFAULT: "#2E4A32",
          light: "#3F6344",
          subtle: "rgba(46, 74, 50, 0.25)",
        },
        olive: {
          DEFAULT: "#6B6E3A",
          hover: "#7E8245",
          light: "#8E934F",
          subtle: "rgba(107, 110, 58, 0.25)",
        },
        cinnamon: {
          DEFAULT: "#8B5E3C",
          hover: "#9F6C46",
          subtle: "rgba(139, 94, 60, 0.25)",
        },
        mauve: {
          DEFAULT: "#5B4A5F",
          hover: "#6F5A74",
          subtle: "rgba(91, 74, 95, 0.25)",
        },
        moonstone: {
          DEFAULT: "#C9C4B8",
          light: "#E4E0D7",
          muted: "rgba(201, 196, 184, 0.65)",
        },
        // Semantic Mappings
        background: "#0B0D10",
        surface: {
          DEFAULT: "#121A2B",
          hover: "#182338",
          elevated: "#1B3B3F",
        },
        border: {
          subtle: "rgba(201, 196, 184, 0.12)",
          DEFAULT: "rgba(107, 110, 58, 0.35)",
          strong: "rgba(201, 196, 184, 0.35)",
        },
        accent: {
          DEFAULT: "#6B6E3A",
          hover: "#7E8245",
          subtle: "rgba(107, 110, 58, 0.20)",
          highlight: "#C9C4B8",
        },
        success: {
          DEFAULT: "#2E4A32",
          subtle: "rgba(46, 74, 50, 0.25)",
        },
        warning: {
          DEFAULT: "#8B5E3C",
          subtle: "rgba(139, 94, 60, 0.25)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      boxShadow: {
        rim: "inset 0 1px 0 0 rgba(201, 196, 184, 0.20)",
        "rim-subtle": "inset 0 1px 0 0 rgba(201, 196, 184, 0.08)",
        card: "0 8px 32px rgba(11, 13, 16, 0.70)",
        glow: "0 0 28px -4px rgba(107, 110, 58, 0.35)",
        "glow-lg": "0 0 60px -8px rgba(107, 110, 58, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
