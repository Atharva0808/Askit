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
        neo: {
          black: "#0a0a0b",
          surface: "#0e0e10",
          "surface-raised": "#121215",
          pink: "#ec4899",
          "pink-dim": "#be185d",
          white: "#fafafa",
          "white-muted": "#a1a1aa",
        },
      },
      fontFamily: {
        playfair: ['"Playfair Display"', "serif"],
        inter: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        neu: "6px 6px 16px rgba(0,0,0,0.85), -4px -4px 14px rgba(30,41,59,0.25)",
        "neu-inset": "inset 5px 5px 14px rgba(0,0,0,0.9), inset -5px -5px 14px rgba(30,41,59,0.25)",
        "neu-btn": "5px 5px 12px rgba(0,0,0,0.85), -3px -3px 10px rgba(30,41,59,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
