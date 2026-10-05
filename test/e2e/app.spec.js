import { test, expect } from "@playwright/test";

test("首頁載入 Mini City Builder 並顯示畫布與工具列", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/Mini City Builder/);
	await expect(page.locator("#game")).toBeVisible();
	await expect(page.locator(".tool[data-tool]")).toHaveCount(7);
});
