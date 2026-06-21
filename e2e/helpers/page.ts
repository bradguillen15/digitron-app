import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Waits until auth bootstrap finished (past the global loading shell). */
export async function waitForAuthReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Cargando…$/)).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
}

/** Opens a Radix select and picks an option, retrying if the data hasn't loaded yet. */
export async function selectComboboxOption(
  page: Page,
  comboboxIndex: number,
  optionName: string | RegExp,
): Promise<void> {
  const combobox = page.getByRole("combobox").nth(comboboxIndex);

  await expect(async () => {
    await page.keyboard.press("Escape").catch(() => undefined);
    await expect(combobox).toBeVisible({ timeout: 5_000 });
    await combobox.click();
    // 15s gives React Query time to fetch the list; no reload so the cache is preserved.
    await expect(page.getByRole("option", { name: optionName })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("option", { name: optionName }).click();
  }).toPass({ timeout: 30_000 });
}

/**
 * Navigates to an order detail page and waits for auth to finish.
 * The caller's own assertions (with timeouts) drive the actual content check.
 * Reloading here would reset the React Query cache and restart auth, which
 * creates an infinite retry cycle rather than solving the timing issue.
 */
export async function gotoOrderDetail(page: Page, orderId: string): Promise<void> {
  await page.goto(`/orders/${orderId}`);
  await waitForAuthReady(page);
}

export async function gotoNewOrderForm(page: Page): Promise<void> {
  await page.goto("/orders/new");
  await waitForAuthReady(page);
  await expect(page.getByRole("combobox").first()).toBeVisible({ timeout: 15_000 });
}
