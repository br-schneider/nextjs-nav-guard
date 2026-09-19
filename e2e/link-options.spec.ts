import { expect, test } from "@playwright/test";

test("accepted replacement links preserve browser history", async ({
  page,
}) => {
  await page.goto("/page1");
  await page.getByRole("link", { name: "Guard playground" }).click();
  await page.getByRole("link", { name: "Replace link" }).click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL("/page2");
  await page
    .getByRole("button", { name: "router.back()", exact: true })
    .click();
  await expect(page).toHaveURL("/page1");
  await expect(page.getByText("Current Page: 1")).toBeVisible();
});

test("accepted links preserve scroll=false", async ({ page }) => {
  await page.goto("/playground");
  await page.getByRole("link", { name: "Keep scroll position" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(500);
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL("/playground?view=next");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
});

test("guarded link callbacks run once and cancellation remains available", async ({
  page,
}) => {
  await page.goto("/playground");
  for (const name of ["Click cancelled link", "Navigation cancelled link"]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page).toHaveURL("/playground");
  }
  await page.getByRole("link", { name: "Link with callbacks" }).click();
  await expect(page.getByText("Clicks: 1, navigations: 1")).toBeVisible();
  await page.getByRole("button", { name: "Stay", exact: true }).click();
  await expect(page).toHaveURL("/playground");
});

test("hash links preserve onNavigate cancellation", async ({ page }) => {
  await page.goto("/playground");
  await page.getByRole("link", { name: "Cancelled hash link" }).click();
  await expect(page).toHaveURL("/playground");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
