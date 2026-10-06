/**
 * 城市模擬 — 每個月的人口、成長、治安、稅收。
 */

import { GROWABLE } from "./constants.js";
import { roadNear, powerStats } from "./state.js";
import { appendHistory, upkeepFor } from "./report.js";

/**
 * 推進一個月。
 * @returns {string|null} 有事件（如「城市成立滿一年！」）時回傳訊息，否則 null。
 */
export function simulate(city) {
	city.month++;
	if (city.month > 12) {
		city.month = 1;
		city.year++;
	}

	const ps = powerStats(city);
	const powered = ps.cap > ps.used;

	let newPop = 0;
	let parks = 0;
	let industry = 0;
	let commercial = 0;

	for (let y = 0; y < city.grid.length; y++) {
		for (let x = 0; x < city.grid[y].length; x++) {
			const c = city.grid[y][x];
			if (c.type === "park") parks++;
			if (c.type === "ind") industry++;
			if (c.type === "com") commercial++;

			if (GROWABLE.includes(c.type)) {
				c.age++;
				if (roadNear(city, x, y) && powered && c.level < 3 && Math.random() < 0.22) c.level++;
				if (!roadNear(city, x, y) && c.level > 0 && Math.random() < 0.12) c.level--;
				if (!powered && c.level > 0 && Math.random() < 0.08) c.level--;
				if (c.type === "res") newPop += c.level * (8 + Math.floor(c.seed * 5));
			}
		}
	}

	city.pop = newPop;
	const ps2 = powerStats(city);
	city.happy = Math.round(
		Math.max(
			20,
			Math.min(
				98,
				62 + parks * 2 - Math.max(0, industry - parks * 2) - Math.max(0, ps2.used - ps2.cap) * 0.3
			)
		)
	);
	const tax = Math.floor(city.pop * 0.7 + commercial * 6 + industry * 8);
	city.money += tax;

	const upkeep = upkeepFor(city);
	city.lastFinance = { year: city.year, month: city.month, income: tax, upkeep, net: tax - upkeep };
	city.history = appendHistory(
		city.history,
		`第 ${city.year} 年・${city.month} 月 ─ 稅收 $${tax.toLocaleString()}・維護 $${upkeep.toLocaleString()}`
	);

	const msg = city.year === 2 && city.month === 1 ? "城市成立滿一年！" : null;
	if (msg) city.history = appendHistory(city.history, `第 ${city.year} 年・${city.month} 月：${msg}`);

	return msg;
}
