import { test, expect } from "@playwright/test";
import { labels } from "../helpers/labels";
import { gotoNewOrderForm, gotoOrderDetail } from "../helpers/page";
import { createIntakeOrderViaUI } from "../helpers/order-ui";
import {
  deleteTestCustomerByName,
  getServiceRoleKey,
  updateTestOrderStage,
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
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping cleanup-dependent test");
    }

    const { customerName } = await createIntakeOrderViaUI(page);
    try {
      await expect(page.getByText(labels.stage.intake).first()).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteTestCustomerByName(customerName);
    }
  });
});

test.describe("Admin — order detail stage actions", () => {
  test.beforeEach(() => {
    if (!getServiceRoleKey()) {
      test.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping cleanup-dependent tests");
    }
  });

  test("send to evaluation button is visible on intake stage order", async ({ page }) => {
    const { customerName } = await createIntakeOrderViaUI(page);
    try {
      await expect(page.getByRole("button", { name: labels.orders.sendToEvaluation })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(labels.stage.intake).first()).toBeVisible();
    } finally {
      await deleteTestCustomerByName(customerName);
    }
  });

  test("admin can advance intake order to evaluation stage", async ({ page }) => {
    const { customerName } = await createIntakeOrderViaUI(page);
    try {
      await expect(page.getByRole("button", { name: labels.orders.sendToEvaluation })).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole("button", { name: labels.orders.sendToEvaluation }).click();

      await expect(page.getByText(labels.stage.evaluation, { exact: true }).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByRole("button", { name: labels.orders.sendToEvaluation }),
      ).not.toBeVisible();
    } finally {
      await deleteTestCustomerByName(customerName);
    }
  });

  test("closed order shows no action buttons", async ({ page }) => {
    const { orderId, customerName } = await createIntakeOrderViaUI(page);
    try {
      await updateTestOrderStage(orderId, "closed");
      await gotoOrderDetail(page, orderId);

      await expect(page.getByText(labels.stage.closed).first()).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole("button", { name: labels.orders.sendToEvaluation }),
      ).not.toBeVisible();
      await expect(page.getByRole("button", { name: labels.orders.closeOrder })).not.toBeVisible();
    } finally {
      await deleteTestCustomerByName(customerName);
    }
  });
});
