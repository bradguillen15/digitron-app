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
  const clientDialog = page.getByRole("dialog", { name: labels.clients.newClient });
  await expect(clientDialog).toBeVisible();
  await clientDialog.getByRole("textbox").first().fill(customerName);
  await clientDialog.getByRole("button", { name: labels.common.save }).click();
  await expect(clientDialog).not.toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: labels.equipment.newEquipment }).click();
  const equipmentDialog = page.getByRole("dialog", { name: labels.equipment.newEquipment });
  await expect(equipmentDialog).toBeVisible();
  const equipmentFields = equipmentDialog.getByRole("textbox");
  await equipmentFields.nth(0).fill("Laptop");
  await equipmentFields.nth(1).fill("E2E");
  await equipmentFields.nth(2).fill("Test");
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
