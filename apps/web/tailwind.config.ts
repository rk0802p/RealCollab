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
        // NEW CLAY TOKENS
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        ink: {
          1: "rgb(var(--ink-1) / <alpha-value>)",
          2: "rgb(var(--ink-2) / <alpha-value>)",
          3: "rgb(var(--ink-3) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          deep: "rgb(var(--primary-deep) / <alpha-value>)",
        },
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        lavender: {
          DEFAULT: "rgb(var(--lavender) / <alpha-value>)",
          deep: "rgb(var(--lavender-deep) / <alpha-value>)",
        },
        peach: {
          DEFAULT: "rgb(var(--peach) / <alpha-value>)",
          deep: "rgb(var(--peach-deep) / <alpha-value>)",
        },
        mint: {
          DEFAULT: "rgb(var(--mint) / <alpha-value>)",
          deep: "rgb(var(--mint-deep) / <alpha-value>)",
        },
        butter: {
          DEFAULT: "rgb(var(--butter) / <alpha-value>)",
          deep: "rgb(var(--butter-deep) / <alpha-value>)",
        },
        sky: {
          DEFAULT: "rgb(var(--sky) / <alpha-value>)",
          deep: "rgb(var(--sky-deep) / <alpha-value>)",
        },
        pink: {
          DEFAULT: "rgb(var(--pink) / <alpha-value>)",
          deep: "rgb(var(--pink-deep) / <alpha-value>)",
        },
        ok: "rgb(var(--ok) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        err: "rgb(var(--err) / <alpha-value>)",

      },
      borderRadius: {
        tile: "var(--r-tile)",
        panel: "var(--r-panel)",
        card: "var(--r-card)",
        control: "var(--r-control)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        clay: "0 14px 28px -10px rgb(var(--tone-deep, 205 198 222) / .55), 0 2px 4px rgb(var(--ink-1) / .06), inset 0 4px 0 rgb(255 255 255 / .75), inset 0 -6px 12px -2px rgb(var(--tone-deep, 205 198 222) / .35)",
        "clay-sm": "0 8px 16px -6px rgb(var(--tone-deep, 205 198 222) / .45), 0 2px 4px rgb(var(--ink-1) / .04), inset 0 3px 0 rgb(255 255 255 / .75), inset 0 -4px 8px -2px rgb(var(--tone-deep, 205 198 222) / .3)",
        "clay-press": "0 4px 8px -2px rgb(var(--tone-deep, 205 198 222) / .45), 0 1px 2px rgb(var(--ink-1) / .06), inset 0 2px 0 rgb(255 255 255 / .7), inset 0 -3px 6px -1px rgb(var(--tone-deep, 205 198 222) / .35)",
        "clay-inset": "inset 0 3px 6px rgb(var(--tone-deep, 205 198 222) / .35), inset 0 -2px 0 rgb(255 255 255 / .7)",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
