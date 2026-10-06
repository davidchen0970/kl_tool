import { test, expect } from "@playwright/test";

const SAVE_KEY = "mini_city_builder:v1";

test("頁首顯示自動存檔指示", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("#save")).toBeVisible();
});

test("建造後依圖釘右下寫入 localStorage 存檔", async ({ page }) => {
	await page.goto("/");
	// 依實際畫布尺寸推算空白格 (2,2) 的中心（見 src/ui/camera.js 的 origin()/getCell）：
	// (2,2) 在地圖內、遠離位於 y=12 的起始道路，確定可放置道路。
	const { x, y } = await page.locator("#game").evaluate((canvas) => {
		const GRID_W = 32;
		const GRID_H = 24;
		const cw = canvas.clientWidth;
		const ch = canvas.clientHeight;
		const tile = Math.max(16, Math.min(30, Math.floor(Math.min(cw / GRID_W, ch / GRID_H))));
		const ox = (cw - GRID_W * tile) / 2;
		const oy = (ch - GRID_H * tile) / 2;
		const gx = 2;
		const gy = 2;
		return { x: ox + gx * tile + tile / 2, y: oy + gy * tile + tile / 2 };
	});
	await page.locator("#game").click({ position: { x, y } });

	// 放置是同步觸發的，但自動存檔發生在之後的主迴圈 tick 內，故需等待存檔鍵出現再讀取。
	await page.waitForFunction((key) => localStorage.getItem(key) !== null, SAVE_KEY);
	const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
	expect(raw).not.toBeNull();
	// 解析存檔並驗證這次建造的確被持久化：已放置的那一格 (2,2) 必須是道路。
	const saved = await page.evaluate((key) => {
		const parsed = JSON.parse(localStorage.getItem(key));
		return { grid: parsed.grid, count: parsed.grid.flat().filter((t) => t.type === "road").length };
	}, SAVE_KEY);
	expect(saved.grid[2][2].type).toBe("road");
	expect(saved.count).toBeGreaterThanOrEqual(6);
});
