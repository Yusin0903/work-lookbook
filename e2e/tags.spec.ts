import path from "path";
import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const FIXTURE_IMAGE = path.join(__dirname, "fixtures/test-image.jpg");
const CATEGORY = "Living Objects";
const SILK_WORK = "絲綢作品";
const CLEAR_WORK = "透明作品";

async function createWork(page: Page, title: string, tags: string) {
  await page.goto("/admin/new");
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="newSeriesName"]', CATEGORY);
  await page.fill('input[name="newTagNames"]', tags);
  await page.setInputFiles('input[name="media"]', FIXTURE_IMAGE);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test.describe.serial("category books and tag filtering", () => {
  test("opening a category book shows its works and tags filter them", async ({ page }) => {
    await loginAsAdmin(page);
    await createWork(page, SILK_WORK, "Silk");
    // The category already exists now, so reuse it via the select instead of
    // creating a duplicate; tags are reused by name.
    await page.goto("/admin/new");
    await page.fill('input[name="title"]', CLEAR_WORK);
    await page.selectOption('select[name="seriesId"]', { label: CATEGORY });
    await page.check('input[name="tagIds"] >> nth=0');
    await page.fill('input[name="newTagNames"]', "Translucent");
    await page.setInputFiles('input[name="media"]', FIXTURE_IMAGE);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin");

    // The homepage starts as a shelf of books with no work links.
    await page.goto("/");
    await expect(page.getByRole("link", { name: SILK_WORK })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "打開 All Works" })).toBeVisible();

    await page.getByRole("button", { name: `打開 ${CATEGORY}` }).click();
    await expect(page.getByRole("heading", { name: CATEGORY })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("link", { name: SILK_WORK })).toBeVisible();
    await expect(page.getByRole("link", { name: CLEAR_WORK })).toBeVisible();

    await page.getByRole("button", { name: "Translucent" }).click();
    await expect(page.getByRole("link", { name: CLEAR_WORK })).toBeVisible();
    await expect(page.getByRole("link", { name: SILK_WORK })).toHaveCount(0);

    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(page.getByRole("link", { name: SILK_WORK })).toBeVisible();
  });

  test("cleanup: delete works, category and tags", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    page.on("dialog", (dialog) => dialog.accept());
    for (const title of [SILK_WORK, CLEAR_WORK]) {
      await page.locator("[data-work-id]").filter({ hasText: title }).getByRole("button", { name: "刪除" }).click();
      await expect(page.getByText(title)).toHaveCount(0, { timeout: 10_000 });
    }
    await page.getByRole("button", { name: `刪除系列 ${CATEGORY}` }).click();
    await expect(page.getByText(CATEGORY, { exact: true })).toHaveCount(0, { timeout: 10_000 });
    for (const tag of ["Silk", "Translucent"]) {
      await page.getByRole("button", { name: `刪除標籤 ${tag}` }).click();
      await expect(page.getByRole("button", { name: `刪除標籤 ${tag}` })).toHaveCount(0, { timeout: 10_000 });
    }
  });
});
