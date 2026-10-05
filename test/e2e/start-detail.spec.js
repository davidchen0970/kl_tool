import { test, expect } from "@playwright/test";

// 與 src/core/storage.js 的 SAVE_KEY 一致
const SAVE_KEY = "mini_city_builder:v1";
// 起始道路的實際座標（src/core/state.js：GRID_H=24 時 START_SEGMENT_Y=12、
// GRID_W=32、START_LENGTH=5 時 START_SEGMENT_X=13，道路佔 (13..17, 12)）
const START_X = 13;
const START_Y = 12;
const START_LENGTH = 5;

test("起始道路地圖的起始格子存在於地圖核心", async ({ page }) => {
	// 保證全新頁面（無既有存檔）才開局
	await page.addInitScript((k) => localStorage.removeItem(k), SAVE_KEY);
	await page.goto("/");

	// 新建城市後，存檔會由啟動流程「異步」寫入；先等它實際寫好再讀取
	await page.waitForFunction((k) => localStorage.getItem(k) !== null, SAVE_KEY);

	const raw = await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY);
	expect(raw).not.toBeNull();
	const city = JSON.parse(raw);

	// 起始道路必須精確位在地圖中央的 (13,12)..(17,12) 五格，且都是 road
	expect(city.grid[START_Y][START_X].type).toBe("road");
	for (let x = START_X; x < START_X + START_LENGTH; x++) {
		expect(city.grid[START_Y][x]).toMatchObject({ type: "road" });
	}
	// 道路兩側外一格不應誤放
	expect(city.grid[START_Y][START_X - 1].type).not.toBe("road");
	expect(city.grid[START_Y][START_X + START_LENGTH].type).not.toBe("road");
});
