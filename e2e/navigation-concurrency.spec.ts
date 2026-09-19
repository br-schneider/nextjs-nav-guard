import { expect, test } from "@playwright/test";

test("repeated clicks cannot bypass a pending confirmation", async ({
  page,
}) => {
  await page.goto("/page1");
  await page.getByRole("checkbox", { name: "Enable Navigation Guard" }).check();
  await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

  await page.getByRole("link", { name: "Page2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Page2", exact: true }).click();

  await page.waitForTimeout(500);
  await expect(page).toHaveURL("/page1");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Current Page: 1")).toBeVisible();

  await page.getByRole("link", { name: "Page2", exact: true }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page).toHaveURL("/page2");
});

test("repeated Back keeps the first destination and matching rendered content", async ({
  page,
}) => {
  await page.goto("/page1");
  await page.getByRole("link", { name: "Page2", exact: true }).click();
  await expect(page.getByText("Current Page: 2")).toBeVisible();
  await page.getByRole("link", { name: "Guard playground" }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL("/page2");
  await expect(page.getByText("Current Page: 2")).toBeVisible();
});

test("browser history cannot replace a pending link destination", async ({
  page,
}) => {
  await page.goto("/page1");
  await page.getByRole("link", { name: "Guard playground" }).click();
  await page.getByRole("link", { name: "Destination two" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL("/page2");
  await expect(page.getByText("Current Page: 2")).toBeVisible();
});

test("unmounting a pending guard cancels it and releases navigation", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByRole("link", { name: "Destination one" }).click();
  await expect(
    page.getByRole("dialog", { name: "Leave editor?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unmount editor" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Mount editor" }).click();
  await page.getByRole("button", { name: "Push destination" }).click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL("/page1");
});

test("the first destination owns confirmation until it is settled", async ({
  page,
}) => {
  await page.goto("/page1");
  await page.getByRole("checkbox", { name: "Enable Navigation Guard" }).check();
  await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

  await page.getByRole("link", { name: "Page2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "OK", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Page3", exact: true }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page).toHaveURL("/page2");
});
