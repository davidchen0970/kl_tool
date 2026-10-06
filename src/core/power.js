/**
 * 電網 — 電力只沿著相連的導體（道路/電廠）擴散，而非全圖供電。
 * 純邏輯，不碰 DOM。鍵值一律以 "x,y" 表示。
 */

import { GROWABLE } from "./constants.js";

/** 四面相鄰方向。 */
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** 座標鍵值。 */
export function cellKey(x, y) {
	return x + "," + y;
}

/** 該格是否為導體（可供電力通過）。 */
function isConductor(type) {
	return type === "road" || type === "power";
}

/**
 * 由每座電廠做 4-direction BFS，透過相連的導體擴散出一張電網。
 * @returns {{ network: Set<string>, powered: Set<string> }}
 *   - network：與任一電廠相連的 road/power 格。
 *   - powered：4-鄰近電網的成長型分區格（會被供電）。
 */
export function poweredNetwork(city) {
	const H = city.grid.length;
	const W = city.grid[0].length;
	const network = new Set();
	const visited = new Set();
	const queue = [];

	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (city.grid[y][x].type === "power") {
				const k = cellKey(x, y);
				if (!visited.has(k)) {
					visited.add(k);
					network.add(k);
					queue.push([x, y]);
				}
			}
		}
	}

	while (queue.length) {
		const [x, y] = queue.pop();
		for (const [dx, dy] of DIRS) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
			if (!isConductor(city.grid[ny][nx].type)) continue;
			const k = cellKey(nx, ny);
			if (visited.has(k)) continue;
			visited.add(k);
			network.add(k);
			queue.push([nx, ny]);
		}
	}

	// 成長型分區：只要 4-鄰近任一電網格即為供電。
	const powered = new Set();
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const c = city.grid[y][x];
			if (!GROWABLE.includes(c.type)) continue;
			const nearGrid = DIRS.some(([dx, dy]) => {
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
				return network.has(cellKey(nx, ny));
			});
			if (nearGrid) powered.add(cellKey(x, y));
		}
	}

	return { network, powered };
}

/** 查詢 (x,y) 是否位於供電集內（未給集時一律 false）。 */
export function isPowered(powered, x, y) {
	return !!powered && powered.has(cellKey(x, y));
}
