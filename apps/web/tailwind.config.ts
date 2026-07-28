import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Header / primary brand blue - vivid and trustworthy, in the same
        // energy class as major retail marketplaces without matching any
        // single brand's exact hex values.
        brand: {
          50: "#eef4ff",
          100: "#dce9ff",
          200: "#b9d2ff",
          300: "#8bb4ff",
          400: "#5a8dff",
          500: "#2e6ef0",
          600: "#1f56c9",
          700: "#1a45a3",
          800: "#163a86",
          900: "#13306e",
        },
        // Warm CTA accent - reserved for purchase actions (Add to Cart,
        // Buy Now) so it always reads as "the button that does the thing,"
        // never used decoratively.
        accent: {
          50: "#fff7e6",
          100: "#ffecc0",
          200: "#ffd980",
          300: "#ffc44d",
          400: "#ffb020",
          500: "#f5980a",
          600: "#d97f06",
          700: "#b3660a",
          800: "#8f5310",
          900: "#754511",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 30, 60, 0.06), 0 1px 1px rgba(20, 30, 60, 0.04)",
        "card-hover": "0 4px 12px rgba(20, 30, 60, 0.12), 0 2px 4px rgba(20, 30, 60, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
