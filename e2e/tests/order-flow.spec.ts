import { test, expect } from "@playwright/test";
import { labels } from "../helpers/labels";
import {
  deleteTestCustomer,
  getServiceRoleKey,
  seedTestCustomerEquipment,
  seedTestOrder,
} from "../helpers/seed";

test.describe("Admin — order flow", () => {
  test("orders list page renders and is accessible", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("new order form renders with all required fields", async ({ page }) => {
    await page.goto("/orders/new");
    await expect(page).not.toHaveURL(/\/login/);

    await expect(page.getByRole("combobox").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: labels.orders.createOrder }),
    ).toBeVisible();
  });

  test("admin can create a new service order", async ({ page }) => {
    if (!getServiceRoleKey()) {
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping data-dependent test");
    }

    const { clientId, customerName } = await seedTestCustomerEquipment();

    await page.goto("/orders/new");
    await expect(page.getByRole("combobox").first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: customerName }).click();

    await expect(page.getByRole("combobox").nth(1)).toBeEnabled({ timeout: 10_000 });
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: /Laptop — E2E Test/i }).click();

    await page
      .getByRole("textbox", { name: new RegExp(labels.orders.problemReported, "i") })
      .fill("E2E test problem description");

    await page.getByRole("button", { name: labels.orders.createOrder }).click();

    await page.waitForURL(/\/orders\/[a-z0-9-]+$/, { timeout: 10_000 });
    await expect(page.getByText(labels.stage.intake).first()).toBeVisible();

    await deleteTestCustomer(clientId);
  });

  test("admin sees new-order action on orders list", async ({ page }) => {
    if (!getServiceRoleKey()) {
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping data-dependent test");
    }

    const { clientId } = await seedTestCustomerEquipment();

    await page.goto("/orders");
    await expect(
      page.getByRole("main").getByRole("link", { name: labels.orders.newOrder }),
    ).toBeVisible();

    await deleteTestCustomer(clientId);
  });
});

test.describe("Admin — order detail stage actions", () => {
  test("send to evaluation button is visible on intake stage order", async ({ page }) => {
    if (!getServiceRoleKey()) {
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping data-dependent test");
    }

    const { clientId, equipmentId } = await seedTestCustomerEquipment();
    const order = await seedTestOrder(
      clientId,
      equipmentId,
      "intake",
      "E2E direct seed test",
    );

    await page.goto(`/orders/${order.id}`);
    await expect(
      page.getByRole("button", { name: labels.orders.sendToEvaluation }),
    ).toBeVisible();
    await expect(page.getByText(labels.stage.intake).first()).toBeVisible();

    await deleteTestCustomer(clientId);
  });

  test("closed order shows no action buttons", async ({ page }) => {
    if (!getServiceRoleKey()) {
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping data-dependent test");
    }

    const { clientId, equipmentId } = await seedTestCustomerEquipment();
    const order = await seedTestOrder(
      clientId,
      equipmentId,
      "closed",
      "E2E closed order test",
    );

    await page.goto(`/orders/${order.id}`);
    await expect(page.getByText(labels.stage.closed).first()).toBeVisible();

    await expect(
      page.getByRole("button", { name: labels.orders.sendToEvaluation }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: labels.orders.closeOrder }),
    ).not.toBeVisible();

    await deleteTestCustomer(clientId);
  });
});
