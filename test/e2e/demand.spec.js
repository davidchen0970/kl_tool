import { test, expect } from "@playwright/test";

test("放置商業與工業後供需模擬持續運作", async ({ page }) => {
	await page.goto("/");
	// 先鋪道路，再放置商業與工業（皆需緊鄰道路才會發展）
	await page.locator('.tool[data-tool="road"]').click();
	await page.locator("#game").click({ position: { x: 140, y: 140 } });

	await page.locator('.tool[data-tool="com"]').click();
	await page.locator("#game").click({ position: { x: 180, y: 180 } });

	await page.locator('.tool[data-tool="ind"]').click();
	await page.locator("#game").click({ position: { x: 120, y: 180 } });

	// 供需模擬模組執行時不應使城市資金異常
	const money = await page.locator("#money").textContent();
	expect(money).toMatch(/^\$/);
	await expect(page.locator("#game")).toBeVisible();
});
