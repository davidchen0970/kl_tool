import { test, expect } from "@playwright/test";

test("動畫期間建造操作仍可使用", async ({ page }) => {
	await page.goto("/");
	await page.locator(".tool[data-tool=\"power\"]").click();
	await page.locator("#game").click({ position: { x: 200, y: 200 } });
	// 電廠閃爍動畫與 HUD 同時運作
	await expect(page.locator("#power")).toContainText("/");
});
