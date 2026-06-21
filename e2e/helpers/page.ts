import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { labels } from "./labels";

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
    await expect(page.getByRole("option", { name: optionName })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("option", { name: optionName }).click();
  }).toPass({ timeout: 30_000 });
}

function isCustomersMinResponse(url: string): boolean {
  return url.includes("/rest/v1/customers") && url.includes("select=");
}

function isOrderDetailResponse(url: string, orderId: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.endsWith("/orders") && parsed.searchParams.get("id") === `eq.${orderId}`;
  } catch {
    return false;
  }
}

/**
 * Navigates to an order detail page and waits until the order payload loaded.
 */
export async function gotoOrderDetail(page: Page, orderId: string): Promise<void> {
  const orderResponse = page.waitForResponse(
    (response) => isOrderDetailResponse(response.url(), orderId) && response.ok(),
    { timeout: 30_000 },
  );

  await page.goto(`/orders/${orderId}`);
  await waitForAuthReady(page);
  await orderResponse;

  await expect(page.getByText(labels.orders.notFound)).not.toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("link", { name: "Volver" })).toBeVisible({ timeout: 15_000 });
}

export async function gotoNewOrderForm(page: Page): Promise<void> {
  const clientsResponse = page.waitForResponse(
    (response) => isCustomersMinResponse(response.url()) && response.ok(),
    { timeout: 30_000 },
  );

  await page.goto("/orders/new");
  await waitForAuthReady(page);
  await clientsResponse;
  await expect(page.getByRole("combobox").first()).toBeVisible({ timeout: 15_000 });
}

/** Returns a promise that resolves when equipment rows load for the selected client. */
export function waitForEquipmentOptions(page: Page): Promise<void> {
  return page
    .waitForResponse((response) => response.url().includes("/rest/v1/equipment") && response.ok(), {
      timeout: 30_000,
    })
    .then(() => undefined);
}
