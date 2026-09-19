import build from "@hono/vite-build/vercel";
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import { defineConfig } from "vite";

// Dev: Hono runs inside Vite's dev server.
// Build: emit a Vercel serverless function via the Build Output API (.vercel/output).
export default defineConfig({
  plugins: [
    devServer({
      entry: "src/index.tsx",
      exclude: defaultOptions.exclude.filter((pattern) =>
        typeof pattern === "string" || !pattern.test("/docs.md")
      ),
    }),
    build({
      entry: "src/index.tsx",
      entryContentAfterHooks: [
        () => "import { getRequestListener } from '@hono/node-server'",
      ],
      entryContentDefaultExportHook: (appName) =>
        `export default getRequestListener(${appName}.fetch)`,
    }),
  ],
});
