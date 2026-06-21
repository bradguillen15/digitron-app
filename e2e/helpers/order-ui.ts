import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { labels } from "./labels";
import { gotoNewOrderForm } from "./page";

/** Creates client + equipment + intake order entirely through the UI (same browser session). */
export async function createIntakeOrderViaUI(page: Page): Promise<{
  orderId: string;
  customerName: string;
}> {
  const customerName = `E2E UI Client ${Date.now()}`;

  await gotoNewOrderForm(page);

  await page.getByRole("button", { name: labels.clients.newClient }).click();
  const clientDialog = page.getByRole("dialog");
  await expect(clientDialog).toBeVisible();
  await clientDialog.getByLabel(`${labels.common.name} *`).fill(customerName);
  await clientDialog.getByRole("button", { name: labels.common.save }).click();
  await expect(clientDialog).not.toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: labels.equipment.newEquipment }).click();
  const equipmentDialog = page.getByRole("dialog");
  await expect(equipmentDialog).toBeVisible();
  await equipmentDialog.getByLabel(`${labels.equipment.type} *`).fill("Laptop");
  await equipmentDialog.getByLabel(`${labels.equipment.brand} *`).fill("E2E");
  await equipmentDialog.getByLabel(`${labels.equipment.model} *`).fill("Test");
  await equipmentDialog.getByRole("button", { name: labels.common.save }).click();
  await expect(equipmentDialog).not.toBeVisible({ timeout: 15_000 });

  await page
    .getByRole("textbox", { name: labels.orders.problemReported })
    .fill("E2E test problem description");

  await page.getByRole("button", { name: labels.orders.createOrder }).click();
  await page.waitForURL(/\/orders\/[a-z0-9-]+$/i, { timeout: 30_000 });

  const orderId = page.url().split("/").pop();
  if (!orderId) throw new Error("Could not resolve order id from URL after create");

  return { orderId, customerName };
}
