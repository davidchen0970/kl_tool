import { test, expect } from "@playwright/test";

const SAVE_KEY = "mini_city_builder:v1";

/**
 * 以 addInitScript 在頁面任何 script（含 app 模組）執行前，就先寫好 / 清除
 * localStorage 的存檔：因 src/main.js 開機即呼叫 loadCity()，且每個模擬 tick
 * 都會呼叫 save() 覆寫存檔，舊寫法（goto 後才 evaluate）會被執行中的迴圈
 * 以記憶體城市（初始資金 $25,000）蓋掉。initScript 保證 app 啟動時就看得到
 * 種子存檔，沒有競賽問題。
 */
test("載入既有存檔後頁首反映存檔城市", async ({ context, page }) => {
	await context.addInitScript(
		([key, save]) => {
			localStorage.setItem(key, save);
		},
		[
			SAVE_KEY,
			JSON.stringify({
				money: 12345,
				pop: 99,
				happy: 85,
				year: 3,
				month: 4,
				paused: false,
				grid: Array.from({ length: 24 }, () =>
					Array.from({ length: 32 }, () => ({ type: "empty", level: 0, age: 0, seed: 0.5 }))
				),
			}),
		]
	);

	await page.goto("/");
	await expect(page.locator("#money")).toHaveText("$12,345");
});

test("清除存檔後新城市資金回到初始值", async ({ context, page }) => {
	await context.addInitScript((key) => {
		localStorage.removeItem(key);
	}, SAVE_KEY);

	await page.goto("/");
	await expect(page.locator("#money")).toHaveText("$25,000");
});
