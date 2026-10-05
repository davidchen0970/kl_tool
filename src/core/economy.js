/**
 * 供需系統 — 每個月根據就業 / 消費者 / 勞動力計算各分區的需求倍率。
 * 純邏輯，不碰 DOM。
 */

import {
	JOBS_PER_COM,
	JOBS_PER_IND,
	DEMAND_MIN,
	DEMAND_MAX,
	DEMAND_STARVING,
} from "./constants.js";

/** 把 v 收斂到 [min, max]。 */
function clamp(v, min, max) {
	return v < min ? min : v > max ? max : v;
}

/** num / den，den<=0 時回傳 1（避免除零）。 */
function ratio(num, den) {
	return den <= 0 ? 1 : num / den;
}

/**
 * 計算各項供需指標與需求倍率。
 * @returns {{ resMul, comMul, indMul, jobs, residents, resTiles, comTiles, indTiles }}
 */
export function computeDemand(city) {
	let residents = 0;
	let resTiles = 0;
	let comTiles = 0;
	let indTiles = 0;
	let comJobs = 0;
	let indJobs = 0;

	for (const row of city.grid) {
		for (const c of row) {
			if (c.type === "res") {
				resTiles++;
				residents += c.level * (8 + Math.floor(c.seed * 5));
			} else if (c.type === "com") {
				comTiles++;
				comJobs += c.level * JOBS_PER_COM;
			} else if (c.type === "ind") {
				indTiles++;
				indJobs += c.level * JOBS_PER_IND;
			}
		}
	}

	const jobs = comJobs + indJobs;

	// 住宅需求：有職缺可填才吸引人口；失業（工作 < 人口）或不景氣時走弱。
	let resMul;
	if (jobs === 0) {
		resMul = DEMAND_STARVING;
	} else if (residents === 0) {
		// 有職缺卻沒人 → 強力吸引人口。
		resMul = 1.2;
	} else {
		resMul = clamp(0.85 * ratio(jobs, residents), DEMAND_MIN, DEMAND_MAX);
	}

	// 商業需求：需要居民消費。商店稀缺而居民多時需求高。
	let comMul;
	if (residents === 0) {
		comMul = DEMAND_STARVING;
	} else if (comTiles === 0) {
		comMul = DEMAND_MAX;
	} else {
		comMul = clamp(0.9 * ratio(residents, comTiles), DEMAND_MIN, DEMAND_MAX);
	}

	// 工業需求：需要有勞動力；居民稀少時走弱。
	let indMul;
	if (residents === 0) {
		indMul = DEMAND_STARVING;
	} else if (indTiles === 0) {
		indMul = DEMAND_MAX;
	} else {
		indMul = clamp(0.8 * ratio(residents, indTiles), DEMAND_MIN, DEMAND_MAX);
	}

	return { resMul, comMul, indMul, jobs, residents, resTiles, comTiles, indTiles };
}
