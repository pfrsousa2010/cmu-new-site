import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { montarSitemap } from "./src/lib/seo";

export default defineConfig({
  plugins: [
    react(),
    {
      // sitemap.xml sai da mesma lista de páginas que define as metas
      // (src/lib/seo.ts), então os dois nunca divergem.
      name: "sitemap",
      apply: "build",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: montarSitemap(),
        });
      },
    },
  ],
  server: {
    // O preview do app atribui a porta via PORT; sem ela, mantém o padrão do Vite.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
