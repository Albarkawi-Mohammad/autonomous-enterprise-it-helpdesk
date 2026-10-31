/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        porcelain: "#fafbff",
        alabaster: "#f2f5fc",
        cobalt: {
          50: "#f2f5fc",
          100: "#ebeefd",
          200: "#dadfff",
          300: "#98a9f9",
          400: "#637ef2",
          500: "#3555e4",
          600: "#2842bb",
          700: "#1c3196",
          800: "#0f1d66",
          900: "#060b21",
          950: "#050a20",
        },
        ink: {
          primary: "#060b21",
          secondary: "#3b4262",
          muted: "#6e7799",
          faint: "#98a1c0",
        },
        hairline: {
          DEFAULT: "#dce3f5",
          subtle: "#e8edf8",
          strong: "#b8c5eb",
        },
      },
      boxShadow: {
        cobalt: "0 14px 34px -10px rgba(53, 85, 228, 0.24)",
        sheet: "0 1px 3px 0 rgba(6, 11, 33, 0.04), 0 1px 2px -1px rgba(6, 11, 33, 0.03)",
        elevated: "0 20px 44px -12px rgba(6, 11, 33, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;

