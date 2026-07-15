import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores do logo
        verde: {
          DEFAULT: "#62b32e",
          dark: "#4a8c20",
          hover: "#52991f",
        },
        azul: {
          DEFAULT: "#2e6fb7",
          hover: "#245c9c",
        },
        laranja: {
          DEFAULT: "#ee7623",
          hover: "#d96613",
        },
        vermelho: {
          DEFAULT: "#d13a41",
          hover: "#b52c34",
        },
        // Superfícies / fundos
        "site-bg": "#faf8f5",
        "admin-bg": "#f4f1ec",
        surface: "#ffffff",
        subtle: "#f0ede8",
        dark: "#26333f",
        // Texto
        ink: {
          DEFAULT: "#2b2622",
          2: "#6f675f",
          3: "#a09a91",
          mid: "#5a544d",
        },
      },
      fontFamily: {
        display: ["Nunito", "sans-serif"],
        sans: ["'Nunito Sans'", "sans-serif"],
      },
      maxWidth: {
        container: "1160px",
      },
      borderRadius: {
        card: "20px",
        modal: "22px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.05)",
        "card-hover": "0 8px 24px rgba(0,0,0,.09)",
        "card-hover-lg": "0 10px 28px rgba(0,0,0,.1)",
        modal: "0 20px 60px rgba(0,0,0,.25)",
        toast: "0 8px 24px rgba(0,0,0,.25)",
      },
      keyframes: {
        "logo-pulse": {
          "0%, 100%": { transform: "scale(0.92)", opacity: "0.75" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
      },
      animation: {
        "logo-pulse": "logo-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
