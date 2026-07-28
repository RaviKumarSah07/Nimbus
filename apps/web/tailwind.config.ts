import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f6ff",
          100: "#e2ebff",
          200: "#c6d7ff",
          300: "#9db8ff",
          400: "#6f8fff",
          500: "#4763f5",
          600: "#3346d6",
          700: "#2936ab",
          800: "#242f87",
          900: "#212a6b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
