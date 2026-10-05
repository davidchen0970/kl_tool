/**
 * 輸入 — 滑鼠 / 觸控繪製與拆除、滾輪縮放、鍵盤捷徑。
 */

export function setupPointerInput({ canvas, camera, hover, onPlace, onBulldoze, getTool, onInspect }) {
	const mouse = { down: false, button: 0 };

	/** 依按鍵與目前工具決定動作：右鍵拆除；查詢工具左鍵則選取方塊；其餘左鍵建造。 */
	function doAction(button, x, y) {
		if (button === 2) {
			onBulldoze(x, y);
			return;
		}
		if (getTool && getTool() === "info") {
			if (onInspect) onInspect(x, y);
			return;
		}
		onPlace(x, y);
	}

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
		if (mouse.down) doAction(mouse.button, cell.x, cell.y);
	});
	canvas.addEventListener("pointerdown", (e) => {
		mouse.down = true;
		mouse.button = e.button;
		const cell = toCell(e);
		doAction(e.button, cell.x, cell.y);
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
	const map = ["road", "res", "com", "ind", "park", "power", "info"];
	addEventListener("keydown", (e) => {
		if (e.code === "Space") {
			e.preventDefault();
			onTogglePause();
		}
		const n = +e.key;
		if (n >= 1 && n <= map.length) onToolSelect(map[n - 1]);
	});
}
