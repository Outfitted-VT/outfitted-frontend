import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  base: "./",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
  server: {
    port: 5173,
    open: false,
  },
});
