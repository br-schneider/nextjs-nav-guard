import { expect, test } from "@playwright/test";

test("the form demo supports staying, keyboard cancellation, and discarding", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Your note").fill("Keep this draft");
  await page.getByRole("link", { name: "Leave this page" }).click();
  await expect(
    page.getByRole("dialog", { name: "Leave without saving?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByLabel("Your note")).toHaveValue("Keep this draft");
  await page.getByRole("link", { name: "Leave this page" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("link", { name: "Leave this page" }).click();
  await page.getByRole("button", { name: "Discard and leave" }).click();
  await expect(page).toHaveURL("/page1");
});

test("saving before navigation does not prompt again", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your note").fill("A saved draft");
  await page.getByRole("button", { name: "Save and leave" }).click();
  await expect(page).toHaveURL("/page1");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
