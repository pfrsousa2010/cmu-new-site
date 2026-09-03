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
          // Para texto: o laranja da marca dá 2,9:1 sobre branco, abaixo do
          // mínimo até para título grande. Este tom passa de 4,5:1 sobre
          // branco e sobre os fundos laranja claros do painel.
          dark: "#a8480a",
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
        // Período do curso. Cor própria para cada turno porque é o dado que
        // mais confunde na inscrição — quem se inscreve precisa bater o olho e
        // ver se é de manhã, tarde ou noite. Os tons de texto são escurecidos
        // de propósito: sobre o fundo `suave` ficam acima de 4.5:1 (AA).
        periodo: {
          manha: { DEFAULT: "#8a5b00", suave: "#fbf0d4" },
          tarde: { DEFAULT: "#a8480a", suave: "#fbe4d4" },
          noite: { DEFAULT: "#26537e", suave: "#dde8f4" },
        },
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
        "cta-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 3px 10px rgba(238,118,35,.35)",
          },
          "50%": {
            transform: "scale(1.06)",
            boxShadow: "0 6px 22px rgba(238,118,35,.55)",
          },
        },
      },
      animation: {
        "logo-pulse": "logo-pulse 1.4s ease-in-out infinite",
        "cta-pulse": "cta-pulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
