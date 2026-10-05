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
	// 固定隨機數，讓成長判定必定成立（Math.random() < 基礎機率 × 需求）
	const origRandom = Math.random;
	Math.random = () => 0;

	try {
		// 電廠到住宅鋪一條相連道路，形成電網；住宅(1,11) 鄰近供電道路(1,10)
		place(city, "power", 0, 0);
		for (let y = 0; y <= 11; y++) place(city, "road", 1, y);
		place(city, "res", 1, 12); // 位於 grid[12][1]
		simulate(city);
		assert.equal(city.grid[12][1].level, 1); // level 0 -> 1
	} finally {
		Math.random = origRandom;
	}
});

test("simulate 不會提升未接上電網的住宅", () => {
	const city = createCity();
	const origRandom = Math.random;
	Math.random = () => 0;

	try {
		// 電廠與住宅完全分離：住宅只鄰近一條孤立道路。
		place(city, "power", 0, 0);
		place(city, "road", 10, 10);
		place(city, "res", 10, 11);
		simulate(city);
		assert.equal(city.grid[11][10].level, 0); // 未供電 → 不成長
	} finally {
		Math.random = origRandom;
	}
});
