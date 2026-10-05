import { test, expect } from "@playwright/test";

test("晝夜指示圖示載入", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("#night")).toBeVisible();
});

test("音效切換按鈕存在並可點按", async ({ page }) => {
	await page.goto("/");
	const sound = page.locator("#sound");
	await expect(sound).toBeVisible();
	await sound.click();
	await expect(sound).toBeVisible();
});
