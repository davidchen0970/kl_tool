/**
 * 攝影機 — 縮放與平移、螢幕座標 ↔ 地圖座標換算。
 */

import { GRID_W, GRID_H } from "../core/constants.js";

export function createCamera(canvas) {
	let zoom = 1;
	let camX = 0;
	let camY = 0;

	/** 目前每格的像素大小。 */
	function tileSize() {
		return Math.max(
			16,
			Math.min(30, Math.floor(Math.min(canvas.clientWidth / GRID_W, canvas.clientHeight / GRID_H) * zoom))
		);
	}

	/** 地圖原點（左上角）與格寬。 */
	function origin() {
		const s = tileSize();
		return {
			x: (canvas.clientWidth - GRID_W * s) / 2 + camX,
			y: (canvas.clientHeight - GRID_H * s) / 2 + camY,
			s,
		};
	}

	/** 由螢幕座標換算地圖格。 */
	function getCell(px, py) {
		const o = origin();
		return { x: Math.floor((px - o.x) / o.s), y: Math.floor((py - o.y) / o.s) };
	}

	/** 滾輪縮放（deltaY < 0 表示放大）。 */
	function zoomBy(deltaY) {
		zoom = Math.max(0.65, Math.min(1.7, zoom + (deltaY < 0 ? 0.1 : -0.1)));
	}

	return { origin, getCell, zoomBy };
}
