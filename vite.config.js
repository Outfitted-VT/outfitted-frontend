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
    // Forward API and uploaded-media requests to the backend (outfitted-backend), so in the
    // browser the API is same-origin: no CORS setup, and the refresh cookie just works.
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media": "http://127.0.0.1:8000",
    },
  },
});
