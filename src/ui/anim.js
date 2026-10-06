/**
 * 動畫輔助 — 燈飾 / 現場動畫用的小型純函式集合，DOM-free，可單元測試。
 *
 * 全都是「給數字回數字」的純函式：不碰 canvas、不讀網頁，任何輸入都落在封閉區間，
 * 讓 renderer.js 能在每幀以 O(cells) 代價畫出貝偏偏移的即時動畫。
 */

/** 把輸入收斂到 [0, 1]。 */
export function clamp01(v) {
	return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 由格子座標產生一個「確定性」的 0..1（未含 1）雜湊。
 * 同一 (x, y, salt) 恆回傳相同值，可用來讓同一個格子在每幀維持一致的相位 / 顏色，
 * 不會因時間跳動而閃爍。salt 可讓同一格子上不同圖層拿到不同相位。
 */
export function hash01(x, y, salt = 0) {
	let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salt, 1442695041)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h = (h ^ (h >>> 16)) >>> 0;
	return h / 4294967296;
}

/** 最簡 Possion 平滑：0..1，起點為 0、終點為 1（無 overshoot）。 */
export function easeOutCubic(t) {
	t = clamp01(t);
	return 1 - Math.pow(1 - t, 3);
}

/** 帶一點回彈 overshoot 的「跳出」曲線：結尾輕微超過 1 再落回 1，常用於生成動畫。 */
export function easeOutBack(t) {
	if (t <= 0) return 0;
	if (t >= 1) return 1;
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * 把「從 start 開始、歷時 duration 毫秒、現在為 now」線性投影到 0..1。
 * now <= start 時為 0，now >= start + duration 時為 1，中間線性，外插一律收斂。
 */
export function tween01(start, now, duration) {
	if (duration <= 0) return 1;
	return clamp01((now - start) / duration);
}

/** 慢速正弦振盪，回傳 [0, 1]（ms 為一個完整週期的毫秒數）。 */
export function osc(now, ms) {
	if (ms <= 0) return 0.5;
	const p = (now / ms) % 1;
	return 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
}
