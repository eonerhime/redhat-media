import { defineConfig, devices } from "@playwright/test";

// Uncommon port: other local projects use 3000/3100 (Phase 1 implementation log).
const port = 3217;
// Set PW_CHANNEL=msedge where Device Guard blocks the bundled Chromium (Phase 1 spec, C2).
const channel = process.env.PW_CHANNEL;

// PW_BASE_URL runs the suite against a deployed site instead, such as a Vercel preview in the
// preview-e2e job. e2e/portfolio-expect.ts then sends the bypass header to that origin only
// (Phase 10 spec, D11, C6). No trace there: a trace would record that header.
const remote = process.env.PW_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: remote ?? `http://localhost:${port}`,
    trace: remote ? "off" : "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) },
    },
  ],
  // Runs against the production build, so `pnpm build` must come first.
  webServer: remote
    ? undefined
    : {
        command: `pnpm start --port ${port}`,
        url: `http://localhost:${port}`,
        // Never reuse: a server already on this port may be a different app, and the tests
        // would then pass or fail against the wrong site.
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
