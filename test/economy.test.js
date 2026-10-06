import { test } from "node:test";
import assert from "node:assert/strict";
import { createCity, place } from "../src/core/state.js";
import { computeDemand } from "../src/core/economy.js";
import { DEMAND_MIN, DEMAND_MAX, DEMAND_STARVING } from "../src/core/constants.js";

/** 造一座有固定居民（seed=0 簡化計算）的城市。n 座 level 住宅 *3。 */
function makeCityWithResidents(n) {
	const city = createCity();
	for (let i = 0; i < n; i++) {
		place(city, "res", i, 0);
		city.grid[0][i].level = 3;
		city.grid[0][i].seed = 0; // 每人 3*(8+0)=24
	}
	return city;
}

test("更多工作 → 更高住宅需求 (resMul)", () => {
	const unemployed = createCity();
	// 有大量居民卻沒工作
	for (let i = 0; i < 10; i++) {
		place(unemployed, "res", i, 0);
		unemployed.grid[0][i].level = 3;
		unemployed.grid[0][i].seed = 0;
	}
	const employed = createCity();
	// 少許居民
	place(employed, "res", 0, 0);
	employed.grid[0][0].level = 3;
	employed.grid[0][0].seed = 0; // 24 人
	// 大量商業職缺
	for (let i = 0; i < 20; i++) {
		const x = i % 10;
		const y = 1 + Math.floor(i / 10);
		place(employed, "com", x, y);
		employed.grid[y][x].level = 1; // jobs = 20*1*4 = 80
	}
	const dLow = computeDemand(unemployed);
	const dHigh = computeDemand(employed);
	assert.ok(dHigh.resMul > dLow.resMul, `預期有工>無工 (${dHigh.resMul} > ${dLow.resMul})`);
	assert.ok(dHigh.resMul > 1, "職缺遠多於人口時住宅需求應偏強 (got " + dHigh.resMul + ")");
});

test("無工作時住宅需求低落", () => {
	const city = makeCityWithResidents(5);
	assert.equal(computeDemand(city).resMul, DEMAND_STARVING);
});

test("需求倍率收斂在合理範圍", () => {
	const city = makeCityWithResidents(10);
	// 塞爆工作與商店
	for (let i = 0; i < 40; i++) {
		place(city, "com", i % 10, 2);
		place(city, "ind", i % 10, 3);
		city.grid[2][i % 10].level = 3;
		city.grid[3][i % 10].level = 3;
	}
	const d = computeDemand(city);
	for (const k of ["resMul", "comMul", "indMul"]) {
		assert.ok(d[k] >= DEMAND_MIN, `${k} 不應低於下限`);
		assert.ok(d[k] <= DEMAND_MAX, `${k} 不應高於上限`);
	}
});

test("有居民但無商店 → 商業需求高 (comMul)", () => {
	const city = makeCityWithResidents(5);
	const d = computeDemand(city);
	assert.equal(d.comMul, DEMAND_MAX, "居民在但無商店時商業需求應最強");
});

test("空城 → 商業與工業需求低落", () => {
	const city = createCity();
	const d = computeDemand(city);
	assert.equal(d.comMul, DEMAND_STARVING);
	assert.equal(d.indMul, DEMAND_STARVING);
});

test("有居民但無工業 → 工業需求高 (indMul)", () => {
	const city = makeCityWithResidents(5);
	assert.equal(computeDemand(city).indMul, DEMAND_MAX);
});

test("每級商業累加就業機會 (jobs)", () => {
	const city = makeCityWithResidents(0);
	// 純以就業導向測 jobs 累加
	for (let i = 0; i < 3; i++) {
		place(city, "com", i, 5);
		city.grid[5][i].level = 2; // jobs = 2*JOBS_PER_COM
	}
	const d = computeDemand(city);
	assert.equal(d.jobs, 3 * 2 * 4);
});
