import { test } from "node:test";
import assert from "node:assert/strict";
import { createCity, place, bulldoze, powerStats, isInBounds, roadNear } from "../src/core/state.js";

test("createCity 有預設資金與日期", () => {
	const city = createCity();
	assert.equal(city.money, 25000);
	assert.equal(city.year, 1);
	assert.equal(city.month, 1);
	assert.equal(city.pop, 0);
	assert.equal(city.grid.length, 24);
	assert.equal(city.grid[0].length, 32);
});

test("isInBounds 檢查邊界", () => {
	const city = createCity();
	assert.equal(isInBounds(city, 0, 0), true);
	assert.equal(isInBounds(city, 31, 23), true);
	assert.equal(isInBounds(city, -1, 0), false);
	assert.equal(isInBounds(city, 32, 0), false);
	assert.equal(isInBounds(city, 0, 24), false);
});

test("place 越界回報 offmap", () => {
	const city = createCity();
	assert.equal(place(city, "road", -1, 0), "offmap");
});

test("place 道路成功並設為 level 1", () => {
	const city = createCity();
	assert.equal(place(city, "road", 3, 3), "ok");
	assert.equal(city.grid[3][3].type, "road");
	assert.equal(city.grid[3][3].level, 1);
	assert.equal(city.money, 25000 - 40);
});

test("place 不可疊在既有方塊上", () => {
	const city = createCity();
	place(city, "road", 3, 3);
	assert.equal(place(city, "res", 3, 3), "blocked");
});

test("place 資金不足回報 no-money", () => {
	const city = createCity();
	city.money = 0;
	assert.equal(place(city, "res", 0, 0), "no-money");
	assert.equal(city.grid[0][0].type, "empty");
});

test("roadNear 偵測相鄰道路", () => {
	const city = createCity();
	place(city, "road", 3, 3);
	// 與道路 (3,3) 相鄰的格子
	assert.equal(roadNear(city, 3, 2), true); // 上方
	assert.equal(roadNear(city, 3, 4), true); // 下方
	assert.equal(roadNear(city, 4, 3), true); // 右方
	assert.equal(roadNear(city, 2, 3), true); // 左方
	// 離道路兩格以上 => 不相鄰
	assert.equal(roadNear(city, 4, 4), false);
	assert.equal(roadNear(city, 8, 8), false);
});

test("bulldoze 退回 15% 成本", () => {
	const city = createCity();
	place(city, "road", 5, 5);
	const before = city.money;
	const refund = bulldoze(city, 5, 5);
	assert.equal(refund, Math.floor(40 * 0.15));
	assert.equal(city.money, before + refund);
	assert.equal(city.grid[5][5].type, "empty");
});

test("bulldoze 拆空地回傳 0", () => {
	const city = createCity();
	assert.equal(bulldoze(city, 0, 0), 0);
});

test("powerStats 計算發電量與用量", () => {
	const city = createCity();
	place(city, "power", 0, 0); // 一座電廠 => cap 80
	place(city, "res", 1, 1);
	city.grid[1][1].level = 2; // 2 級住宅耗電 2
	const ps = powerStats(city);
	assert.equal(ps.cap, 80);
	assert.equal(ps.used, 2);
});

