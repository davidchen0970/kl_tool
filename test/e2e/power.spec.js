import { test, expect } from "@playwright/test";

test("畫布與電力統計欄位載入", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("#game")).toBeVisible();
	await expect(page.locator("#power")).toContainText("/");
});

test("放置電廠後供電容量提升至 80", async ({ page }) => {
	await page.goto("/");
	await page.locator('.tool[data-tool="power"]').click();

	// 座標換算（見 src/ui/camera.js 的 origin()/getCell）：
	// 畫布寬高為 CSS 100%（<main> 的 1fr 列），tile = clamp(floor(min(w/32,h/24)),16,30)，
	// 原點 = ((w-32*tile)/2, (h-24*tile)/2)。在預設 1280x720 viewport 下 tile 約為 25，
	// 因此固定 (200,140) 會映射到 off-map 而無法放置。這裡在瀏覽器內依實際畫布尺寸
	// 推算格 (4,4) 的中心點：(4,4) 確定在地圖內、且遠離起始道路（y=12、x=13..17）。
	const { x, y } = await page.locator("#game").evaluate((canvas) => {
		const GRID_W = 32;
		const GRID_H = 24;
		const cw = canvas.clientWidth;
		const ch = canvas.clientHeight;
		const tile = Math.max(16, Math.min(30, Math.floor(Math.min(cw / GRID_W, ch / GRID_H))));
		const ox = (cw - GRID_W * tile) / 2;
		const oy = (ch - GRID_H * tile) / 2;
		const gx = 4;
		const gy = 4;
		return { x: ox + gx * tile + tile / 2, y: oy + gy * tile + tile / 2 };
	});
	await page.locator("#game").click({ position: { x, y } });

	// HUD 在放置後更新（見 src/main.js 的 onPlace → hud.update），採 polling 待其穩定。
	await expect
		.poll(() => page.locator("#power").textContent(), { timeout: 5000 })
		.toMatch(/\/\s*80$/);
});
