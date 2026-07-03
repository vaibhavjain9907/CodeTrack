/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand color: a trustworthy, professional blue
        // (avoid neon/saturated tones — this is an analytics SaaS, not a game)
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Neutral grays used for text, backgrounds, borders.
        // 700–950 are tuned to GitHub Dark's canvas/border palette so the
        // dark theme reads as authentic rather than a tinted default gray.
        surface: {
          50: "#f6f8fa",
          100: "#eaeef2",
          200: "#d0d7de",
          300: "#afb8c1",
          400: "#8c959f",
          500: "#6e7781",
          600: "#57606a",
          700: "#424a53",
          800: "#30363d", // GitHub Dark border / hover surface
          900: "#21262d", // GitHub Dark elevated surface (cards, sidebar, topbar)
          950: "#0d1117", // GitHub Dark canvas (page background)
        },
        // Semantic colors for ratings/status (rank colors map loosely to
        // Codeforces rating tiers, kept muted rather than neon)
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        "card-dark": "0 1px 2px 0 rgb(0 0 0 / 0.4), 0 4px 12px 0 rgb(0 0 0 / 0.3)",
        popover: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 8px 24px -4px rgb(0 0 0 / 0.15)",
      },
    },
  },
  plugins: [],
};
