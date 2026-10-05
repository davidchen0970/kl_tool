/**
 * 晝夜迴圈 — 純函式、DOM-free，可於 node --test 單元測試。
 *
 * 以真實毫秒輸入，回傳「夜晚程度」數值：
 *   nightness(t) ∈ [0, 1]，
 *   0 = 全晝、1 = 深夜；晝夜之間以餘弦平滑昇降，絕無跳動。
 */

/** 一個完整晝夜週期的毫秒數（48 秒轉一圈）。 */
export const CYCLE_MS = 48_000;

/** 一個週期內屬於白晝的相位比例（0.6 = 六成時間為白天）。 */
export const DAY_PORTION = 0.6;

/** 夜中相位（晝夜交界之後的中央位置）。 */
export const NIGHT_CENTER = DAY_PORTION + (1 - DAY_PORTION) / 2;

/**
 * 把毫秒換算成 0..1（未含 1）的晝夜相位。
 * 採用「先取餘數再加週期再取餘數」，讓負數 / 超大輸入也穩定落於 [0,1)。
 */
export function phase(t) {
	const m = CYCLE_MS;
	return (((t % m) + m) % m) / m;
}

/** 取兩相位間的最小環形距離（落於 [0, 0.5]）。 */
function ringDist(a, b) {
	const d = Math.abs(a - b);
	return Math.min(d, 1 - d);
}

/**
 * 夜晚程度 0..1。
 * 以到「夜中相位」的環形距離衡量，距夜中愈近愈接近 1，越過夜窗半徑即降為 0。
 */
export function nightness(t) {
	const distance = ringDist(phase(t), NIGHT_CENTER);
	const halfNight = (1 - DAY_PORTION) / 2;
	// 先收斂到 [0,1] 再套餘弦，輸出從 1（夜中）平滑降至 0（夜窗外）。
	const k = Math.min(1, distance / halfNight);
	return 0.5 * (1 + Math.cos(k * Math.PI));
}

/** 根據夜晚程度回傳 HUD 用圖示（☀️ 白天 / 🌙 夜晚）。 */
export function dayNightIcon(t) {
	return nightness(t) > 0.5 ? "🌙" : "☀️";
}
