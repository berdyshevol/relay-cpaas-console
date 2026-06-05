import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0b0f",
          raised: "#0f1117",
          panel: "#13151d",
          hover: "#181b24",
        },
        border: {
          DEFAULT: "#222530",
          subtle: "#1a1d27",
        },
        channel: {
          sms: "#3b82f6",
          voice: "#a855f7",
          rcs: "#10b981",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
