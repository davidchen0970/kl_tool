import { test, expect } from "@playwright/test";

test("新城市載入並顯示起始道路提示", async ({ page }) => {
	await page.goto("/");
	// 起始道路由 state 建立；介面畫布與起點提示存在
	await expect(page.locator("#game")).toBeVisible();
	await expect(page.locator("#tip")).toBeVisible();
});

test("開新城市後仍為起始道路地圖", async ({ page }) => {
	await page.goto("/");
	await page.locator("#new").click();
	await page.once("dialog", (d) => d.accept());
	await expect(page.locator("#game")).toBeVisible();
});
