import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E6F4FE",
          100: "#CCE9FD",
          200: "#99D3FB",
          300: "#66BDF9",
          400: "#33A7F7",
          500: "#0a7ea4",
          600: "#086583",
          700: "#064C62",
          800: "#043242",
          900: "#021921",
        },
        surface: "#f8fafc",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
