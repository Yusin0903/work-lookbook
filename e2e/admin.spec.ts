import path from "path";
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const FIXTURE_IMAGE = path.join(__dirname, "fixtures/test-image.jpg");
const WORK_TITLE = "測試作品 E2E Work";

test.describe.serial("admin manages a work end to end", () => {
  test("create a work with an uploaded photo", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/new");
    await page.fill('input[name="title"]', WORK_TITLE);
    await page.fill('textarea[name="description"]', "A red 200x200 test image.");
    await page.setInputFiles('input[name="media"]', FIXTURE_IMAGE);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin");

    await expect(page.getByText(WORK_TITLE)).toBeVisible();
  });

  test("published work and its cover image appear on the public homepage", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: WORK_TITLE });
    await expect(link).toBeVisible();

    const cover = link.locator("img");
    const src = await cover.getAttribute("src");
    expect(src).toContain("/lookbook-test/");

    const response = await page.request.get(src!);
    expect(response.status()).toBe(200);
  });

  test("work detail page shows the description and media", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: WORK_TITLE }).click();
    await page.waitForURL("**/work/*");

    await expect(page.locator("h1")).toHaveText(WORK_TITLE);
    await expect(page.getByText("A red 200x200 test image.")).toBeVisible();
    await expect(page.locator("img").first()).toBeVisible();
  });

  test("hiding a work removes it from the public site but keeps it in the admin list", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.getByRole("link", { name: "編輯" }).click();
    await page.waitForURL("**/edit");

    const workId = page.url().match(/admin\/(.+)\/edit/)![1];

    await page.uncheck('input[name="published"]');
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin");

    await expect(page.getByText("隱藏")).toBeVisible();

    await page.goto("/");
    await expect(page.getByText(WORK_TITLE)).toHaveCount(0);

    const directResponse = await page.goto(`/work/${workId}`);
    expect(directResponse?.status()).toBe(404);
  });

  test("deleting a work removes it from the admin list", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "刪除" }).click();
    await expect(page.getByText(WORK_TITLE)).toHaveCount(0, { timeout: 10_000 });
  });
});
