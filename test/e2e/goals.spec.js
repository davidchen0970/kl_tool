import { test, expect } from "@playwright/test";

test("勝利目標進度列載入", async ({ page }) => {
	await page.goto("/");
	const meter = page.locator("#goalmeter");
	await expect(meter).toBeVisible();
	await expect(page.locator("#goal-label")).toContainText("目標");
	await expect(page.locator("#goal-fill")).toBeAttached();
});
