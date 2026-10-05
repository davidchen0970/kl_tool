/**
 * 城市模擬 — 每個月的人口、成長、治安、稅收。
 */

import { GROWABLE, GROWTH_CHANCE, MAX_LEVEL } from "./constants.js";
import { roadNear, powerStats } from "./state.js";
import { poweredNetwork, isPowered } from "./power.js";
import { computeDemand } from "./economy.js";
import { appendHistory, upkeepFor } from "./report.js";
import { pickEvent, checkGoals } from "./events.js";

/** 取得該分區的需求倍率。 */
function mulFor(c, demand) {
	if (c.type === "res") return demand.resMul;
	if (c.type === "com") return demand.comMul;
	return demand.indMul;
}

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

	// 先算好整張電網與當月的需求倍率（每個月一致、逐格套用）。
	const demand = computeDemand(city);
	const powered = poweredNetwork(city).powered;

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
				const p = isPowered(powered, x, y);
				// 成長：需要 道路 + 單格供電 + 未滿級，機率 = 基礎 × 該區需求。
				if (
					roadNear(city, x, y) &&
					p &&
					c.level < MAX_LEVEL &&
					Math.random() < GROWTH_CHANCE * mulFor(c, demand)
				) {
					c.level++;
				}
				// 衰退：離道路太遠。
				if (!roadNear(city, x, y) && c.level > 0 && Math.random() < 0.12) c.level--;
				// 衰退：供電中斷（單格停電）。
				if (!p && c.level > 0 && Math.random() < 0.08) c.level--;
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

	let msg = city.year === 2 && city.month === 1 ? "城市成立滿一年！" : null;
	if (msg) city.history = appendHistory(city.history, `第 ${city.year} 年・${city.month} 月：${msg}`);

	// 突發事件：本月機率觸發，套用後把詳細內容寫入事件紀錄。
	const ev = pickEvent(city);
	if (ev) {
		const line = ev.apply(city);
		city.history = appendHistory(city.history, `第 ${city.year} 年・${city.month} 月：${line}`);
		if (!msg) msg = ev.label;
	}

	// 勝利目標：首次達成時標記城市並寫入勝利紀錄。
	const goal = checkGoals(city);
	if (goal.won && !city.won) {
		city.won = true;
		city.history = appendHistory(
			city.history,
			`第 ${city.year} 年・${city.month} 月：🏆 達成勝利目標！人口 ${city.pop.toLocaleString()}・滿意度 ${city.happy}%`
		);
		msg = "🏆 達成勝利目標！";
	}

	return msg;
}
