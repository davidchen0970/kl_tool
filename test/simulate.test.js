import { test } from "node:test";
import assert from "node:assert/strict";
import { createCity, place } from "../src/core/state.js";
import { simulate } from "../src/core/simulate.js";

test("simulate 推進一個月", () => {
	const city = createCity();
	city.month = 5;
	simulate(city);
	assert.equal(city.month, 6);
	assert.equal(city.year, 1);
});

test("simulate 跨年重置月份", () => {
	const city = createCity();
	city.month = 12;
	city.year = 1;
	simulate(city);
	assert.equal(city.month, 1);
	assert.equal(city.year, 2);
});

test("simulate 滿一年回傳事件訊息", () => {
	const city = createCity();
	city.month = 12;
	city.year = 1;
	const msg = simulate(city);
	assert.equal(msg, "城市成立滿一年！");
});

test("simulate 不讓資金變負", () => {
	const city = createCity();
	city.money = 0;
	for (let i = 0; i < 60; i++) simulate(city);
	assert.ok(city.money >= 0);
});

test("simulate 提升有道路且供電的住宅", () => {
	const city = createCity();
	// 固定隨機數，讓成長判定必定成立（Math.random() < 0.22）
	const origRandom = Math.random;
	Math.random = () => 0;

	try {
		// 電廠提供電力，住宅(1,11) 的上面鋪一條路(1,10)
		place(city, "power", 0, 0);
		place(city, "road", 1, 10);
		place(city, "res", 1, 11); // 位於 grid[11][1]
		simulate(city);
		assert.equal(city.grid[11][1].level, 1); // level 0 -> 1
	} finally {
		Math.random = origRandom;
	}
});
