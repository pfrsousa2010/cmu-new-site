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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
