import { expect, test } from "@playwright/test";

test("should guard navigation to another website", async ({
  page,
  browserName,
}) => {
  const destination = "https://nextjs-nav-guard.vercel.app/";
  await page.route(destination, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>External destination</h1>",
    }),
  );
  await page.goto("/");
  await page.getByLabel("Your note").click();
  await page.getByLabel("Your note").fill("Keep this unsaved note");

  test.fail(
    browserName === "webkit",
    "WebKit 26.5 bypasses beforeunload on cross-site navigation, also reproduced in plain HTML and Safari 27. See CONTRIBUTING.md.",
  );

  const firstPrompt = page.waitForEvent("dialog", { timeout: 5000 });
  const firstClick = page
    .getByRole("link", { name: "Documentation", exact: true })
    .click();
  const cancelled = await firstPrompt;
  expect(cancelled.type()).toBe("beforeunload");
  await cancelled.dismiss();
  await firstClick;
  await expect(page).toHaveURL("/");
  await expect(page.getByLabel("Your note")).toHaveValue(
    "Keep this unsaved note",
  );

  await page.getByLabel("Your note").click();
  const secondPrompt = page.waitForEvent("dialog", { timeout: 5000 });
  const secondClick = page
    .getByRole("link", { name: "Documentation", exact: true })
    .click();
  const accepted = await secondPrompt;
  expect(accepted.type()).toBe("beforeunload");
  await accepted.accept();
  await secondClick;
  await expect(page).toHaveURL(destination);
  await expect(
    page.getByRole("heading", { name: "External destination" }),
  ).toBeVisible();
});

test("leaving a saved form does not prompt", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your note").click();
  await page.getByLabel("Your note").fill("A saved note");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved in this browser.");
  await page.route("https://nextjs-nav-guard.vercel.app/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>External destination</h1>",
    }),
  );
  let prompts = 0;
  page.on("dialog", async (dialog) => {
    prompts += 1;
    await dialog.accept();
  });
  await page.getByRole("link", { name: "Documentation", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "External destination" }),
  ).toBeVisible();
  expect(prompts).toBe(0);
});
