import type { Page } from "@playwright/test";
import { TEST_ADMIN_USERNAME, TEST_ADMIN_PASSWORD } from "./env";

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="username"]', TEST_ADMIN_USERNAME);
  await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}
