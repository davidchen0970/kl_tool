import { test, expect } from "@playwright/test";

test("未選取格子時顯示提示文字", async ({ page }) => {
	await page.goto("/");
	const tileDetail = page.locator("#tile-detail");
	await expect(tileDetail).toHaveAttribute("hidden", "");
});

test("工具列提供 7 個建造/查詢工具", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator(".tool[data-tool]")).toHaveCount(7);
});
