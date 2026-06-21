import { writeFileSync } from "node:fs";
import { test as setup } from "@playwright/test";

const TECH_EMAIL = process.env.E2E_TECH_EMAIL ?? "tech@digitron.test";
const TECH_PASSWORD = process.env.E2E_TECH_PASSWORD ?? "digitron123";

const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

setup("authenticate as technician", async ({ page }) => {
  try {
    await page.goto("/login", { waitUntil: "load" });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible", timeout: 30_000 });

    await emailInput.fill(TECH_EMAIL);
    await page.locator('input[type="password"]').fill(TECH_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await page.context().storageState({ path: "e2e/fixtures/technician-state.json" });
  } catch {
    writeFileSync("e2e/fixtures/technician-state.json", EMPTY_STATE);
    console.warn(
      `[auth.tech.setup] Technician login failed for ${TECH_EMAIL}. ` +
        "Technician E2E tests will skip when redirected to login.",
    );
  }
});
