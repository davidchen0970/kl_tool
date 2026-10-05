import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  use: {
    baseURL: "http://localhost:8080",
  },
  webServer: {
    command: "npx --yes http-server . -p 8080 -c-1",
    port: 8080,
    reuseExistingServer: true,
  },
});
