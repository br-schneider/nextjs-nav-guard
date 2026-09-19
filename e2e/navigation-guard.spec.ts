import { test, expect, Page } from "@playwright/test";

// Helper function to wait for and handle beforeunload dialog
async function waitForBeforeUnloadDialog(
  page: Page,
  action: "accept" | "dismiss" = "dismiss"
) {
  return new Promise<void>((resolve) => {
    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("beforeunload");

      if (action === "accept") {
        dialog.accept();
      } else {
        dialog.dismiss();
      }
      resolve();
    });
  });
}

test.describe("Navigation Guard - App Router", () => {
  test("should navigate freely when guard is disabled", async ({ page }) => {
    await page.goto("/page1");
    await expect(page.locator("text=Current Page: 1")).toBeVisible();

    await page.getByRole("link", { name: "Page2" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();
    await expect(page).toHaveURL("/page2");

    await page.getByRole("link", { name: "Page1" }).click();
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");

    await page.getByRole("link", { name: "Page3" }).click();
    await expect(page.locator("text=Current Page: 3")).toBeVisible();
    await expect(page).toHaveURL("/page3");
  });

  test("should show sync confirmation dialog when guard is enabled", async ({
    page,
  }) => {
    await page.goto("/page1");
    await page.waitForSelector("text=Current Page:");

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    page.on("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "You have unsaved changes that will be lost."
      );
      dialog.accept();
    });

    await page.getByRole("link", { name: "Page2" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();
    await expect(page).toHaveURL("/page2");
  });

  test("should prevent navigation when sync confirmation is cancelled", async ({
    page,
  }) => {
    await page.goto("/page1");
    await page.waitForSelector("text=Current Page:");

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "You have unsaved changes that will be lost."
      );
      dialog.dismiss();
    });

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    await page.getByRole("link", { name: "Page2" }).click();

    await page.waitForTimeout(1000);
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");
  });

  test("should show async confirmation UI when async mode is selected", async ({
    page,
  }) => {
    await page.goto("/page1");
    await page.waitForSelector("text=Current Page:");

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();
    await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

    await page.getByRole("link", { name: "Page2" }).click();

    await expect(
      page.locator("text=You have unsaved changes that will be lost.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "OK" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("should navigate when async confirmation is accepted", async ({
    page,
  }) => {
    await page.goto("/page1");
    await page.waitForSelector("text=Current Page:");

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();
    await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

    await page.getByRole("link", { name: "Page2" }).click();

    await page.getByRole("button", { name: "OK" }).click();

    await expect(page.locator("text=Current Page: 2")).toBeVisible();
    await expect(page).toHaveURL("/page2");
  });

  test("should prevent navigation when async confirmation is cancelled", async ({
    page,
  }) => {
    await page.goto("/page1");
    await page.waitForSelector("text=Current Page:");

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();
    await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

    await page.getByRole("link", { name: "Page2" }).click();

    await page.getByRole("button", { name: "Cancel" }).click();

    await page.waitForTimeout(1000);
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");
  });

  test("should guard browser back button navigation", async ({ page }) => {
    await page.goto("/page1");
    await page.getByRole("link", { name: "Page2" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "You have unsaved changes that will be lost."
      );
      dialog.dismiss();
    });

    await page.goBack();

    await page.waitForTimeout(1000);
    await expect(page.locator("text=Current Page: 2")).toBeVisible();
    await expect(page).toHaveURL("/page2");
  });

  test("should guard browser forward button navigation", async ({ page }) => {
    await page.goto("/page1");
    await page.getByRole("link", { name: "Page2" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();

    await page.goBack();
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "You have unsaved changes that will be lost."
      );
      dialog.dismiss();
    });

    await page.goForward();

    await page.waitForTimeout(1000);
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");
  });

  test("should guard router.back() navigation", async ({ page }) => {
    await page.goto("/page1");
    await page.getByRole("link", { name: "Page2" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "You have unsaved changes that will be lost."
      );
      dialog.dismiss();
    });

    await page.getByRole("button", { name: "router.back()" }).click();

    await page.waitForTimeout(1000);
    await expect(page.locator("text=Current Page: 2")).toBeVisible();
    await expect(page).toHaveURL("/page2");
  });

  test("should guard router.forward() navigation", async ({ page }) => {
    await page.goto("/page1");
    await page.getByRole("link", { name: "Page2" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();

    await page.getByRole("button", { name: "router.back()" }).click();
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "You have unsaved changes that will be lost."
      );
      dialog.dismiss();
    });

    await page.getByRole("button", { name: "router.forward()" }).click();

    await page.waitForTimeout(1000);
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");
  });

  test("should guard page refresh", async ({ page }) => {
    await page.goto("/page1");

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "You have unsaved changes that will be lost."
      );
      dialog.dismiss();
    });

    await page.getByRole("button", { name: "router.refresh()" }).click();

    await page.waitForTimeout(1000);
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");
    await expect(
      page.getByRole("checkbox", { name: "Enable Navigation Guard" })
    ).toBeChecked();
  });

  test("closing a dirty tab can be cancelled, then confirmed", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Your note").click();
    await page.getByLabel("Your note").fill("Keep this unsaved note");

    const firstPrompt = page.waitForEvent("dialog", { timeout: 5000 });
    await page.close({ runBeforeUnload: true });
    const cancelled = await firstPrompt;
    expect(cancelled.type()).toBe("beforeunload");
    await cancelled.dismiss();

    expect(page.isClosed()).toBe(false);
    await expect(page.getByLabel("Your note")).toHaveValue("Keep this unsaved note");
    await page.getByLabel("Your note").click();

    const secondPrompt = page.waitForEvent("dialog", { timeout: 5000 });
    await page.close({ runBeforeUnload: true });
    const accepted = await secondPrompt;
    expect(accepted.type()).toBe("beforeunload");
    const closed = page.waitForEvent("close");
    await accepted.accept();
    await closed;
  });

  test("should allow navigation when guard accepts all navigation types", async ({
    page,
  }) => {
    await page.goto("/page1");
    await page.getByRole("link", { name: "Page2" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    page.once("dialog", (dialog) => {
      dialog.accept();
    });

    await page.goBack();
    await expect(page.locator("text=Current Page: 1")).toBeVisible();
    await expect(page).toHaveURL("/page1");

    page.once("dialog", (dialog) => {
      dialog.accept();
    });

    await page.getByRole("button", { name: "router.forward()" }).click();
    await expect(page.locator("text=Current Page: 2")).toBeVisible();
    await expect(page).toHaveURL("/page2");
  });
});
