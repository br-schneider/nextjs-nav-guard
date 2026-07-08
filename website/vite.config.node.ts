import { defineConfig } from "vite";

// Standalone Node build for self-hosting (Docker / `node dist/server.js`).
export default defineConfig({
  build: {
    ssr: "src/server.ts",
    outDir: "dist",
    emptyOutDir: true,
  },
});
