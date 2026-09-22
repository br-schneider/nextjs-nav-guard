import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 30000;

export default defineConfig({
  testDir: "./e2e",
  testMatch: process.env.PLAYWRIGHT_BASE_PATH ? "base-path.spec.ts" : undefined,
  testIgnore: process.env.PLAYWRIGHT_BASE_PATH ? undefined : "base-path.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
        command: process.env.PLAYWRIGHT_PRODUCTION
          ? `pnpm --dir example start --port ${PORT}`
          : `pnpm --dir example dev --port ${PORT}`,
        port: Number(PORT),
        reuseExistingServer: false,
        timeout: 120000,
      },
});
