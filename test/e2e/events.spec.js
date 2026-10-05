import { test, expect } from "@playwright/test";

test("突發事件模組執行時遊戲仍正常運作", async ({ page }) => {
	await page.goto("/");
	// 事件會推進城市；確保核心狀態欄仍更新
	await expect(page.locator("#date")).toContainText("年");
	await expect(page.locator("#happy")).toContainText("%");
	await expect(page.locator("#game")).toBeVisible();
});

test("景觀目標面板於移動網格後仍存在", async ({ page }) => {
	await page.goto("/");
	await page.locator(".tool[data-tool=\"road\"]").click();
	await page.locator("#game").click({ position: { x: 90, y: 90 } });
	await expect(page.locator("#goalmeter")).toBeVisible();
});
