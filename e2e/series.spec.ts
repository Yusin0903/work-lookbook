import path from "path";
import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const FIXTURE_IMAGE = path.join(__dirname, "fixtures/test-image.jpg");
const SERIES_NAME = "測試系列 Test Series";
const WORK_A = "系列作品 A";
const WORK_B = "系列作品 B";

async function createWork(page: Page, title: string, seriesName?: string) {
  await page.goto("/admin/new");
  await page.fill('input[name="title"]', title);
  if (seriesName) {
    await page.fill('input[name="newSeriesName"]', seriesName);
  }
  await page.setInputFiles('input[name="media"]', FIXTURE_IMAGE);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

async function dragRowAfter(page: Page, fromLabel: string, overLabel: string) {
  const fromHandle = page.getByRole("listitem").filter({ hasText: fromLabel }).getByLabel("拖曳調整順序");
  const overRow = page.getByRole("listitem").filter({ hasText: overLabel });

  const fromBox = await fromHandle.boundingBox();
  const overBox = await overRow.boundingBox();
  if (!fromBox || !overBox) throw new Error("could not measure drag elements");

  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(overBox.x + overBox.width / 2, overBox.y + overBox.height - 4, { steps: 10 });
  await page.mouse.move(overBox.x + overBox.width / 2, overBox.y + overBox.height - 4, { steps: 2 });
  await page.mouse.up();
}

test.describe.serial("series grouping, cover selection, and reordering", () => {
  test("creating a work with a new series groups it under that series on the homepage", async ({ page }) => {
    await loginAsAdmin(page);
    await createWork(page, WORK_A, SERIES_NAME);

    await page.goto("/");
    const heading = page.getByRole("heading", { name: SERIES_NAME });
    await expect(heading).toBeVisible();

    const sectionLink = page.locator("section", { has: heading }).getByRole("link", { name: WORK_A });
    await expect(sectionLink).toBeVisible();
  });

  test("assigning a second work to the same existing series groups it alongside the first", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/new");
    await page.fill('input[name="title"]', WORK_B);
    await page.selectOption('select[name="seriesId"]', { label: SERIES_NAME });
    await page.setInputFiles('input[name="media"]', FIXTURE_IMAGE);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin");

    await page.goto("/");
    const heading = page.getByRole("heading", { name: SERIES_NAME });
    const section = page.locator("section", { has: heading });
    await expect(section.getByRole("link", { name: WORK_A })).toBeVisible();
    await expect(section.getByRole("link", { name: WORK_B })).toBeVisible();
  });

  test("picking a different media item as the cover changes the homepage thumbnail", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page
      .getByRole("listitem")
      .filter({ hasText: WORK_A })
      .getByRole("link", { name: "編輯" })
      .click();
    await page.waitForURL("**/edit");

    // Add a second photo, then promote it to cover.
    await page.setInputFiles('input[name="media"]', FIXTURE_IMAGE);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin");

    await page
      .getByRole("listitem")
      .filter({ hasText: WORK_A })
      .getByRole("link", { name: "編輯" })
      .click();
    await page.waitForURL("**/edit");

    const thumbnails = page.locator("div.grid > div.relative");
    await expect(thumbnails).toHaveCount(2);
    await expect(thumbnails.getByText("首圖", { exact: true })).toHaveCount(1);

    await thumbnails.nth(1).getByRole("button", { name: "設為首圖" }).click();
    await expect(thumbnails.nth(1).getByText("首圖", { exact: true })).toBeVisible();
    await expect(thumbnails.nth(0).getByRole("button", { name: "設為首圖" })).toBeVisible();
  });

  test("dragging a work above another persists the new order after reload", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");

    // Both works default to order 0, so the initial order is whichever tiebreak
    // (createdAt desc) applies — don't assume which one starts first, just
    // drag the first row to swap with the second and check it actually swapped.
    const rowsBefore = page.getByRole("listitem").filter({ hasText: /系列作品/ });
    await expect(rowsBefore).toHaveCount(2);
    const firstTitleBefore = (await rowsBefore.nth(0).textContent())!;
    const secondTitleBefore = (await rowsBefore.nth(1).textContent())!;
    const firstLabel = firstTitleBefore.includes(WORK_A) ? WORK_A : WORK_B;
    const secondLabel = secondTitleBefore.includes(WORK_A) ? WORK_A : WORK_B;

    await dragRowAfter(page, firstLabel, secondLabel);

    await page.waitForTimeout(500); // let the reorderWorks server action settle
    await page.reload();

    const rowsAfter = page.getByRole("listitem").filter({ hasText: /系列作品/ });
    await expect(rowsAfter.nth(0)).toContainText(secondLabel);
    await expect(rowsAfter.nth(1)).toContainText(firstLabel);
  });

  test("cleanup: delete the works and series created in this file", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");

    page.on("dialog", (dialog) => dialog.accept());
    for (const title of [WORK_A, WORK_B]) {
      await page.getByRole("listitem").filter({ hasText: title }).getByRole("button", { name: "刪除" }).click();
      await expect(page.getByText(title)).toHaveCount(0, { timeout: 10_000 });
    }

    await page.getByRole("button", { name: `刪除系列 ${SERIES_NAME}` }).click();
    await expect(page.getByText(SERIES_NAME)).toHaveCount(0, { timeout: 10_000 });
  });
});
