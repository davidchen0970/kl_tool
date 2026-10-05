/**
 * 遊戲主迴圈 — 以 requestAnimationFrame 驅動模擬 tick（每 1200ms 推進一個月）。
 */

export function createLoop({ getCity, onTick }) {
	let last = 0;
	let tickAcc = 0;

	function loop(t) {
		if (!last) last = t;
		const delta = t - last;
		last = t;

		if (!getCity().paused) {
			tickAcc += delta;
			if (tickAcc > 1200) {
				tickAcc = 0;
				onTick();
			}
		}
		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}
