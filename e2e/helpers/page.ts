import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { labels } from "./labels";

/** Waits until auth bootstrap finished (past the global loading shell). */
export async function waitForAuthReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Cargando…$/)).not.toBeVisible({ timeout: 15_000 });
  await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
}

/** Opens a Radix select and picks an option, retrying after reload if data was fetched pre-auth. */
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
    const option = page.getByRole("option", { name: optionName });
    try {
      await expect(option).toBeVisible({ timeout: 3_000 });
    } catch {
      await page.reload({ waitUntil: "load" });
      await waitForAuthReady(page);
      throw new Error("Option not visible yet — retry after reload");
    }
    await option.click();
  }).toPass({ timeout: 30_000 });
}

/**
 * Order detail queries can fail if they run before Supabase session restore.
 * Reload once auth is ready so React Query refetches with the session token.
 */
export async function gotoOrderDetail(page: Page, orderId: string): Promise<void> {
  await page.goto(`/orders/${orderId}`);
  await waitForAuthReady(page);

  await expect(async () => {
    if (
      await page
        .getByText(labels.orders.notFound)
        .isVisible()
        .catch(() => false)
    ) {
      await page.reload({ waitUntil: "load" });
      await waitForAuthReady(page);
    }
    await expect(page.getByText(labels.orders.notFound)).not.toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 20_000 });
}

export async function gotoNewOrderForm(page: Page): Promise<void> {
  await page.goto("/orders/new");
  await waitForAuthReady(page);
  await expect(page.getByRole("combobox").first()).toBeVisible({ timeout: 15_000 });
}
