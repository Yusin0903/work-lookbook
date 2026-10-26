import { test, expect } from "@playwright/test";

test("unauthenticated visitor is redirected away from admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("homepage renders without a published work", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Lookbook");
});

test("wrong admin credentials are rejected", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "wrong-password");
  await page.click('button[type="submit"]');
  await expect(page.getByText("帳號或密碼錯誤")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
