import { test, expect } from "@playwright/test";

test("資訊面板與收支報表區塊載入", async ({ page }) => {
	await page.goto("/");
	const info = page.locator("#info");
	await expect(info).toBeVisible();
	await expect(page.locator("#fin-date")).toContainText("年");
	await expect(page.locator("#fin-income")).toContainText("$");
	await expect(page.locator("#fin-net")).toContainText("$");
});

test("工具列含「檢視」工具並可切換顯示資訊面板", async ({ page }) => {
	await page.goto("/");
	const inspect = page.locator('.tool[data-tool="info"]');
	await expect(inspect).toBeVisible();
	const toggle = page.locator("#info-toggle");
	await expect(toggle).toBeVisible();
	await toggle.click();
	await expect(page.locator("#info")).toBeAttached();
});
