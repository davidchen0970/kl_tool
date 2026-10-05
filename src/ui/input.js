/**
 * 輸入 — 滑鼠 / 觸控繪製與拆除、滾輪縮放、鍵盤捷徑。
 */

export function setupPointerInput({ canvas, camera, hover, onPlace, onBulldoze }) {
	const mouse = { down: false, button: 0 };

	const toCell = (e) => {
		const rect = canvas.getBoundingClientRect();
		const p = e.touches ? e.touches[0] : e;
		const cell = camera.getCell(p.clientX - rect.left, p.clientY - rect.top);
		hover.x = cell.x;
		hover.y = cell.y;
		return cell;
	};

	canvas.addEventListener("pointermove", (e) => {
		const cell = toCell(e);
		if (mouse.down) (mouse.button === 2 ? onBulldoze : onPlace)(cell.x, cell.y);
	});
	canvas.addEventListener("pointerdown", (e) => {
		mouse.down = true;
		mouse.button = e.button;
		const cell = toCell(e);
		(e.button === 2 ? onBulldoze : onPlace)(cell.x, cell.y);
	});
	window.addEventListener("pointerup", () => {
		mouse.down = false;
	});
	canvas.addEventListener("contextmenu", (e) => e.preventDefault());
	canvas.addEventListener(
		"wheel",
		(e) => {
			e.preventDefault();
			camera.zoomBy(e.deltaY);
		},
		{ passive: false }
	);
}

export function setupKeyboard({ onToolSelect, onTogglePause }) {
	const map = ["road", "res", "com", "ind", "park", "power"];
	addEventListener("keydown", (e) => {
		if (e.code === "Space") {
			e.preventDefault();
			onTogglePause();
		}
		const n = +e.key;
		if (n >= 1 && n <= 6) onToolSelect(map[n - 1]);
	});
}
