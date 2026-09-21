import { expect, test } from "@playwright/test";

const basePath = process.env.PLAYWRIGHT_BASE_PATH;
if (!basePath) throw new Error("PLAYWRIGHT_BASE_PATH is required");

for (const name of ["Destination one", "Link with callbacks"]) {
  test(`${name} preserves the base path after cancellation and acceptance`, async ({
    page,
  }) => {
    await page.goto(`${basePath}/playground`);
    const destination = name === "Destination one" ? "page1" : "page2";
    await page.getByRole("link", { name, exact: true }).click();
    await page.getByRole("button", { name: "Stay", exact: true }).click();
    await expect(page).toHaveURL(`${basePath}/playground`);
    await page.getByRole("link", { name, exact: true }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(`${basePath}/${destination}`);
    await expect(
      page.getByText(`Current Page: ${destination.slice(-1)}`),
    ).toBeVisible();
  });
}

test("replacement links preserve history under a base path", async ({
  page,
}) => {
  await page.goto(`${basePath}/page1`);
  await page.getByRole("link", { name: "Guard playground" }).click();
  await page.getByRole("link", { name: "Replace link", exact: true }).click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL(`${basePath}/page2`);
  await page
    .getByRole("button", { name: "router.back()", exact: true })
    .click();
  await expect(page).toHaveURL(`${basePath}/page1`);
  await expect(page.getByText("Current Page: 1")).toBeVisible();
});

test("guarded links preserve query strings and scroll under a base path", async ({
  page,
}) => {
  await page.goto(`${basePath}/playground`);
  await page.getByRole("link", { name: "Keep scroll position" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const scroll = await page.evaluate(() => window.scrollY);
  expect(scroll).toBeGreaterThan(500);
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL(`${basePath}/playground?view=next`);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll);
});

test("router calls preserve the base path", async ({ page }) => {
  await page.goto(`${basePath}/playground`);
  await page.getByRole("button", { name: "Push destination" }).click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL(`${basePath}/page1`);
  await expect(page.getByText("Current Page: 1")).toBeVisible();
});
