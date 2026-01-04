import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PredictFolio-inspired color scheme
        primary: {
          grey: "#6B7280",
          offwhite: "#F9FAFB",
          black: "#000000",
        },
        // PredictFolio uses subtle grays and clean backgrounds
        background: {
          light: "#FFFFFF",
          dark: "#0F172A", // slate-900
        },
        surface: {
          light: "#F8FAFC", // slate-50
          dark: "#1E293B", // slate-800
        },
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      fontFamily: {
        sans: ['Neue Montreal', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

