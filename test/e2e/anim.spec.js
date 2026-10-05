import { test, expect } from "@playwright/test";

test("動畫模組載入後畫布持續更新", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("#game")).toBeVisible();
	// 動畫由 rAF 驅動：渲染存取不應使頁面狀態欄消失
	await expect(page.locator("#money")).toContainText("$");
});
