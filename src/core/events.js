/**
 * 突發事件與勝利目標 — 每月隨機事件與勝利條件判定。
 * 純邏輯，不碰 DOM，可於 node --test 中使用。
 */

import { EVENT_CHANCE, GOAL_POP, GOAL_HAPPY, MAX_LEVEL, GROWABLE } from "./constants.js";
import { computeDemand } from "./economy.js";

/** 把 v 收斂到 [min, max]。 */
function clamp(v, min, max) {
	return v < min ? min : v > max ? max : v;
}

/** 收集所有「已成長」（level > 0）的成長型分區。 */
function grownZones(city) {
	const out = [];
	for (let y = 0; y < city.grid.length; y++) {
		for (let x = 0; x < city.grid[y].length; x++) {
			const c = city.grid[y][x];
			if (GROWABLE.includes(c.type) && c.level > 0) out.push({ x, y, c });
		}
	}
	return out;
}

/** 隨機取一個項目（空陣列回傳 undefined）。 */
function pickOne(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 事件池 — 每個事件帶 id / label / weight / applicable / apply。
 * apply(city) 直接變更狀態並回傳一行人類可讀的事件紀錄。
 */
export const EVENT_POOL = [
	{
		id: "boom",
		label: "📈 經濟繁榮",
		weight: 16,
		applicable: () => true,
		apply(city) {
			const gain = Math.round(city.pop * 2 + 300);
			city.money += gain;
			city.happy = clamp(city.happy + 4, 0, 98);
			return `📈 經濟繁榮 — 出口大好，城市進帳 $${gain.toLocaleString()}，市民心情愉悅！`;
		},
	},
	{
		id: "immigration",
		label: "🏳️ 移民潮",
		weight: 12,
		applicable(city) {
			const d = computeDemand(city);
			return d.jobs > d.residents;
		},
		apply(city) {
			const zones = grownZones(city).filter(({ c }) => c.type === "res" && c.level < MAX_LEVEL);
			if (zones.length > 0) {
				pickOne(zones).c.level++;
			}
			city.happy = clamp(city.happy + 3, 0, 98);
			return `🏳️ 移民潮 — 工作機會吸引眾多家庭遷入，城市更加熱鬧！`;
		},
	},
	{
		id: "fire",
		label: "🔥 火災",
		weight: 9,
		applicable(city) {
			return grownZones(city).length > 0;
		},
		apply(city) {
			const z = pickOne(grownZones(city));
			// 燒毀一棟已成長建築（回到空地），並賠償損失。
			city.grid[z.y][z.x] = { type: "empty", level: 0, age: 0, seed: Math.random() };
			city.money = Math.max(0, city.money - 500);
			city.happy = clamp(city.happy - 5, 0, 98);
			return `🔥 火災 — 一棟建築被燒毀，損失 $500，滿意度下降！`;
		},
	},
	{
		id: "blackout",
		label: "⚡ 停電",
		weight: 9,
		applicable(city) {
			return grownZones(city).length > 0;
		},
		apply(city) {
			const z = pickOne(grownZones(city));
			z.c.level = Math.max(0, z.c.level - 1);
			city.happy = clamp(city.happy - 4, 0, 98);
			return `⚡ 停電 — 供電不穩導致一處分區暫時降級，滿意度下降！`;
		},
	},
	{
		id: "crime",
		label: "🚨 治安事件",
		weight: 8,
		applicable: () => true,
		apply(city) {
			const fine = Math.round(city.pop * 0.2 + 100);
			city.money = Math.max(0, city.money - fine);
			city.happy = clamp(city.happy - 6, 0, 98);
			return `🚨 治安事件 — 竊案頻傳，罰款 $${fine.toLocaleString()}，滿意度下降！`;
		},
	},
];

/**
 * 用 Math.random 決定本月是否觸發事件，並依權重挑選一個可用事件。
 * @returns {object|null} 事件描述（含 id / label / apply），本月沒事件回傳 null。
 */
export function pickEvent(city) {
	if (Math.random() >= EVENT_CHANCE) return null;
	const available = EVENT_POOL.filter((e) => !e.applicable || e.applicable(city));
	if (available.length === 0) return null;

	const total = available.reduce((s, e) => s + e.weight, 0);
	let roll = Math.random() * total;
	for (const e of available) {
		roll -= e.weight;
		if (roll < 0) return e;
	}
	return available[0];
}

/**
 * 檢查是否達成勝利目標。
 * @returns {{ won: boolean, popTarget: number, happyTarget: number }}
 */
export function checkGoals(city) {
	const won = city.pop >= GOAL_POP && city.happy >= GOAL_HAPPY;
	return { won, popTarget: GOAL_POP, happyTarget: GOAL_HAPPY };
}
