/**
 * 城市狀態與地圖操作 — 純邏輯，不碰 DOM。
 * 提供地圖建立、查詢、放置、拆除與電力統計。
 */

import { GRID_W, GRID_H, COSTS, GROWABLE, INSTANT } from "./constants.js";

/** 建立空白地圖（W x H，每一格帶隨機種子供景觀與成長使用）。 */
export function makeGrid() {
	const grid = [];
	for (let y = 0; y < GRID_H; y++) {
		const row = [];
		for (let x = 0; x < GRID_W; x++) {
			row.push({ type: "empty", level: 0, age: 0, seed: Math.random() });
		}
		grid.push(row);
	}
	return grid;
}

/** 建立一座全新城市。 */
export function createCity() {
	return {
		grid: makeGrid(),
		money: 25000,
		pop: 0,
		happy: 70,
		month: 1,
		year: 1,
		paused: false,
		history: [],
		lastFinance: null,
	};
}

/** 座標是否在地圖內。 */
export function isInBounds(city, x, y) {
	return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
}

/** 相鄰四格是否包含道路。 */
export function roadNear(city, x, y) {
	return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
		return isInBounds(city, x + dx, y + dy) && city.grid[y + dy][x + dx].type === "road";
	});
}

/** 電力統計：{ cap, used }。 */
export function powerStats(city) {
	const flat = city.grid.flat();
	const cap = flat.filter((c) => c.type === "power").length * 80;
	const used = flat
		.filter((c) => GROWABLE.includes(c.type) && c.level > 0)
		.reduce((sum, c) => sum + c.level, 0);
	return { cap, used };
}

/**
 * 放置一個方塊。
 * @returns {string} "ok" | "no-money" | "blocked" | "offmap"
 */
export function place(city, tile, x, y) {
	if (!isInBounds(city, x, y)) return "offmap";
	const c = city.grid[y][x];
	if (c.type !== "empty") return "blocked";
	if (city.money < COSTS[tile]) return "no-money";

	city.money -= COSTS[tile];
	Object.assign(c, { type: tile, level: 0, age: 0 });
	if (INSTANT.includes(tile)) c.level = 1;
	return "ok";
}

/**
 * 拆除一個方塊，退回 15% 成本。
 * @returns {number} 退回金額（拆空 / 越界為 0）。
 */
export function bulldoze(city, x, y) {
	if (!isInBounds(city, x, y)) return 0;
	const c = city.grid[y][x];
	if (c.type === "empty") return 0;
	const refund = Math.floor((COSTS[c.type] || 0) * 0.15);
	city.money += refund;
	city.grid[y][x] = { type: "empty", level: 0, age: 0, seed: Math.random() };
	return refund;
}
