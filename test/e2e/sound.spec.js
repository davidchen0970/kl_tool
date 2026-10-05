import { test, expect } from "@playwright/test";

const MUTE_KEY = "mini_city_builder:muted";

test("點按音效按鈕後套用 mute 設定", async ({ page }) => {
	// 確保全新頁面（無任何已存 mute 偏好），避免干擾。
	await page.addInitScript((key) => localStorage.removeItem(key), MUTE_KEY);
	await page.goto("/");

	// 第一次點按 ⇒ 由「未靜音」切為「靜音」⇒ 寫入 "1"。
	await page.locator("#sound").click();
	await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), MUTE_KEY)).toBe("1");

	// 第二次點按 ⇒ 切回「未靜音」⇒ 寫入 "0"。
	await page.locator("#sound").click();
	await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), MUTE_KEY)).toBe("0");
});
