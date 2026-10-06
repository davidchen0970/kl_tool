/**
 * 財政月報與方塊詳細資訊 — 由城市狀態算出快照，供資訊面板與測試使用。
 * 純邏輯，不碰 DOM。
 */

import { GROWABLE, COSTS, COLORS } from "./constants.js";
import { isInBounds } from "./state.js";
import { computeDemand } from "./economy.js";
import { poweredNetwork } from "./power.js";

/** 每個月每座發電廠的維護成本（估算）。 */
export const POWER_UPKEEP = 200;

/** 事件紀錄最多保留的筆數。 */
export const HISTORY_MAX = 30;

/** 各型別方塊的人類可讀說明。 */
const DESCRIPTIONS = {
	empty: "空地，尚未開發。",
	road: "道路，方便交通並帶動周邊發展。",
	res: "住宅區，容納市民居住，是人口的來源。",
	com: "商業區，提供工作機會並貢獻部分稅收。",
	ind: "工業區，生產製造，稅收較高但也影響環境。",
	park: "公園，為城市增添綠意並提升滿意度。",
	power: "發電廠，為城市供電；每月需要維護費。",
};

/**
 * 把一筆字串事件加入紀錄，並維持最大筆數（回傳新陣列）。
 * @param {string[]} history
 * @param {string} entry
 * @param {number} [max]
 */
export function appendHistory(history, entry, max = HISTORY_MAX) {
	const arr = Array.isArray(history) ? history.slice() : [];
	if (typeof entry === "string" && entry.length > 0) arr.push(entry);
	if (arr.length > max) arr.splice(0, arr.length - max);
	return arr;
}

/** 依目前地圖計算每月維護成本。 */
export function upkeepFor(city) {
	let plants = 0;
	for (const row of city.grid) for (const c of row) if (c.type === "power") plants++;
	return plants * POWER_UPKEEP;
}

/**
 * 建立一份財政與地圖快照：收入 / 維護 / 淨額 / 居民 / 各型別數量。
 */
export function buildReport(city) {
	const counts = { empty: 0, road: 0, res: 0, com: 0, ind: 0, park: 0, power: 0 };
	let occupants = 0;
	for (const row of city.grid) {
		for (const c of row) {
			counts[c.type] = (counts[c.type] || 0) + 1;
			if (c.type === "res") occupants += c.level * (8 + Math.floor(c.seed * 5));
		}
	}
	const income =
		city.lastFinance && Number.isFinite(city.lastFinance.income) ? city.lastFinance.income : 0;
	const upkeep = upkeepFor(city);
	const demand = computeDemand(city);
	const { network, powered } = poweredNetwork(city);
	return {
		income,
		upkeep,
		net: income - upkeep,
		occupants,
		counts,
		jobs: demand.jobs,
		residents: demand.residents,
		demand: {
			res: demand.resMul,
			com: demand.comMul,
			ind: demand.indMul,
		},
		poweredCoverage: powered.size,
		poweredRoads: network.size,
	};
}

/** 估算一方塊的價值（金錢）。 */
function estimatedValue(c) {
	const base = COSTS[c.type] || 0;
	return GROWABLE.includes(c.type) ? base * Math.max(1, c.level) : base;
}

/**
 * 回傳一格的詳細資訊；越界時回傳 null。
 * @returns {{ type, level, age, occupants, description, value, color }|null}
 */
export function tileInfo(city, x, y) {
	if (!isInBounds(city, x, y)) return null;
	const c = city.grid[y][x];
	return {
		type: c.type,
		level: c.level,
		age: c.age,
		occupants: c.type === "res" ? c.level * (8 + Math.floor(c.seed * 5)) : 0,
		description: DESCRIPTIONS[c.type] || "未知方塊。",
		value: estimatedValue(c),
		color: COLORS[c.type],
	};
}
