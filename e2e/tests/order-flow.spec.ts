import { test, expect } from "@playwright/test";
import { labels } from "../helpers/labels";
import { gotoNewOrderForm, gotoOrderDetail, selectComboboxOption } from "../helpers/page";
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
    await gotoNewOrderForm(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("combobox").first()).toBeVisible();
    await expect(page.getByRole("button", { name: labels.orders.createOrder })).toBeVisible();
  });

  // Static UI — no seed needed; the "Nueva orden" link is always present for admin.
  test("admin sees new-order action on orders list", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: labels.orders.newOrder }),
    ).toBeVisible();
  });

  test("admin can create a new service order", async ({ page }) => {
    if (!getServiceRoleKey()) {
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping data-dependent test");
    }

    const { clientId, customerName } = await seedTestCustomerEquipment();
    try {
      await gotoNewOrderForm(page);
      await selectComboboxOption(page, 0, customerName);
      await selectComboboxOption(page, 1, /Laptop — E2E Test/i);

      await page
        .getByRole("textbox", { name: labels.orders.problemReported })
        .fill("E2E test problem description");

      await page.getByRole("button", { name: labels.orders.createOrder }).click();

      await page.waitForURL(/\/orders\/[a-z0-9-]+$/i, { timeout: 15_000 });
      await expect(page.getByText(labels.stage.intake).first()).toBeVisible();
    } finally {
      await deleteTestCustomer(clientId);
    }
  });
});

test.describe("Admin — order detail stage actions", () => {
  test.beforeEach(() => {
    if (!getServiceRoleKey()) {
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping data-dependent tests");
    }
  });

  test("send to evaluation button is visible on intake stage order", async ({ page }) => {
    const { clientId, equipmentId } = await seedTestCustomerEquipment();
    try {
      const order = await seedTestOrder(clientId, equipmentId, "intake", "E2E direct seed test");

      await gotoOrderDetail(page, order.id);
      await expect(page.getByRole("button", { name: labels.orders.sendToEvaluation })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(labels.stage.intake).first()).toBeVisible();
    } finally {
      await deleteTestCustomer(clientId);
    }
  });

  test("admin can advance intake order to evaluation stage", async ({ page }) => {
    const { clientId, equipmentId } = await seedTestCustomerEquipment();
    try {
      const order = await seedTestOrder(clientId, equipmentId, "intake", "E2E transition test");

      await gotoOrderDetail(page, order.id);
      await expect(page.getByRole("button", { name: labels.orders.sendToEvaluation })).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole("button", { name: labels.orders.sendToEvaluation }).click();

      // Exact match prevents "Evaluación técnica" card heading from being a false positive.
      await expect(page.getByText(labels.stage.evaluation, { exact: true }).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByRole("button", { name: labels.orders.sendToEvaluation }),
      ).not.toBeVisible();
    } finally {
      await deleteTestCustomer(clientId);
    }
  });

  test("closed order shows no action buttons", async ({ page }) => {
    const { clientId, equipmentId } = await seedTestCustomerEquipment();
    try {
      const order = await seedTestOrder(clientId, equipmentId, "closed", "E2E closed order test");

      await gotoOrderDetail(page, order.id);
      await expect(page.getByText(labels.stage.closed).first()).toBeVisible({ timeout: 15_000 });

      await expect(
        page.getByRole("button", { name: labels.orders.sendToEvaluation }),
      ).not.toBeVisible();
      await expect(page.getByRole("button", { name: labels.orders.closeOrder })).not.toBeVisible();
    } finally {
      await deleteTestCustomer(clientId);
    }
  });
});
