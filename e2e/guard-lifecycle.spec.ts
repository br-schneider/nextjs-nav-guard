import { expect, test } from "@playwright/test";

for (const navigation of [
  "Push destination",
  "Replace destination",
  "Destination one",
  "Replace link",
  "Back",
]) {
  test(`mounting a guard during ${navigation} cancels the pending attempt`, async ({
    page,
  }) => {
    await page.goto("/page1");
    await page.getByRole("link", { name: "Guard playground" }).click();
    const role =
      navigation === "Destination one" || navigation === "Replace link"
        ? "link"
        : "button";
    await page.getByRole(role, { name: navigation, exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Leave editor?", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Multiple guards").check();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page).toHaveURL("/playground");
    await page.getByRole("button", { name: "Push destination" }).click();
    await page
      .getByRole("dialog", { name: "Leave editor?", exact: true })
      .getByRole("button", { name: "Leave", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Leave second editor?", exact: true })
      .getByRole("button", { name: "Stay", exact: true })
      .click();
    await expect(page).toHaveURL("/playground");
  });
}

for (const method of ["Push", "Replace"]) {
  test(`${method} waits for confirmation and supports cancellation`, async ({
    page,
  }) => {
    await page.goto("/playground");
    await page.getByRole("button", { name: `${method} destination` }).click();
    await page.getByRole("button", { name: "Stay", exact: true }).click();
    await expect(page).toHaveURL("/playground");
    await page.getByRole("button", { name: `${method} destination` }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(method === "Push" ? "/page1" : "/page2");
  });
}

for (const mode of ["throw", "reject"]) {
  test(`${mode} confirmation blocks navigation without an unhandled error`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/page1");
    await page.getByRole("link", { name: "Guard playground" }).click();
    await page.getByLabel("Confirmation mode").selectOption(mode);
    for (const name of ["Push destination", "Replace destination", "Back"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await page.waitForTimeout(250);
      await expect(page).toHaveURL("/playground");
      await expect(
        page.getByRole("heading", { name: "Guard playground" }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
    await page.getByLabel("Confirmation mode").selectOption("dialog");
    await page.getByRole("button", { name: "Push destination" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL("/page1");
  });
}

test("unmount cancels a user-supplied unresolved confirmation", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByLabel("Confirmation mode").selectOption("pending");
  await page.getByRole("button", { name: "Push destination" }).click();
  await page.getByRole("button", { name: "Unmount editor" }).click();
  await page.getByLabel("Confirmation mode").selectOption("dialog");
  await page.getByRole("button", { name: "Mount editor" }).click();
  await page.getByRole("button", { name: "Replace destination" }).click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page).toHaveURL("/page2");
});

test("disabling a pending guard cancels the attempt", async ({ page }) => {
  await page.goto("/playground");
  await page.getByRole("button", { name: "Push destination" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Dirty editor", { exact: true }).uncheck();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL("/playground");
  await page.getByRole("button", { name: "Replace destination" }).click();
  await expect(page).toHaveURL("/page2");
});

test("every enabled guard must accept before navigation", async ({ page }) => {
  await page.goto("/playground");
  await page.getByLabel("Multiple guards").check();
  await page.getByRole("button", { name: "Push destination" }).click();
  await page
    .getByRole("dialog", { name: "Leave editor?", exact: true })
    .getByRole("button", { name: "Leave", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Leave second editor?", exact: true })
    .getByRole("button", { name: "Stay", exact: true })
    .click();
  await expect(page).toHaveURL("/playground");
  await page.getByRole("button", { name: "Push destination" }).click();
  await page
    .getByRole("dialog", { name: "Leave editor?", exact: true })
    .getByRole("button", { name: "Leave", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Leave second editor?", exact: true })
    .getByRole("button", { name: "Leave", exact: true })
    .click();
  await expect(page).toHaveURL("/page1");
});

test("conditional guards only block matching destinations", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByLabel("Confirmation mode").selectOption("selective");
  await page.getByRole("button", { name: "Replace destination" }).click();
  await page.getByRole("button", { name: "Stay", exact: true }).click();
  await page.getByRole("button", { name: "Push destination" }).click();
  await expect(page).toHaveURL("/page1");
});

test("disableForTesting leaves navigation unguarded", async ({ page }) => {
  await page.goto("/playground");
  await page.getByLabel("Confirmation mode").selectOption("disabled");
  await page.getByRole("button", { name: "Push destination" }).click();
  await expect(page).toHaveURL("/page1");
});

test("stable predicates retain unload protection as their result changes", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByLabel("Dirty editor", { exact: true }).uncheck();
  await page.getByLabel("Confirmation mode").selectOption("stable");
  await page.getByLabel("Dirty editor", { exact: true }).check();
  let prompts = 0;
  page.on("dialog", async (dialog) => {
    expect(dialog.type()).toBe("beforeunload");
    prompts += 1;
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Hard navigation" }).click();
  await expect.poll(() => prompts).toBe(1);
  await expect(page).toHaveURL("/playground");
  await page.getByLabel("Dirty editor", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Hard navigation" }).click();
  await expect(page).toHaveURL("/page1");
  expect(prompts).toBe(1);
});

test("disabling a functional guard cancels pending confirmation", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByLabel("Confirmation mode").selectOption("stable");
  await page.getByRole("button", { name: "Push destination" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Dirty editor", { exact: true }).uncheck();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL("/playground");
  await page.getByRole("button", { name: "Replace destination" }).click();
  await expect(page).toHaveURL("/page2");
});
