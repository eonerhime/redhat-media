import { defineConfig, devices } from "@playwright/test";

const port = 3100;
// Set PW_CHANNEL=msedge where Device Guard blocks the bundled Chromium (Phase 1 spec, C2).
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) },
    },
  ],
  // Runs against the production build, so `pnpm build` must come first.
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
