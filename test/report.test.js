import { test } from "node:test";
import assert from "node:assert/strict";
import { createCity, place } from "../src/core/state.js";
import { simulate } from "../src/core/simulate.js";
import {
	appendHistory,
	buildReport,
	tileInfo,
	HISTORY_MAX,
	POWER_UPKEEP,
} from "../src/core/report.js";

test("appendHistory 依序累加事件", () => {
	const arr = appendHistory([], "a");
	assert.deepEqual(arr, ["a"]);
	assert.deepEqual(appendHistory(arr, "b"), ["a", "b"]);
});

test("appendHistory 忽略非字串", () => {
	assert.deepEqual(appendHistory([], 42), []);
	assert.deepEqual(appendHistory([], ""), []);
	assert.deepEqual(appendHistory(["x"], null), ["x"]);
});

test("appendHistory 超過上限時截掉最舊的", () => {
	const grown = ["1", "2", "3", "4"].reduce((acc, e) => appendHistory(acc, e, 3), []);
	assert.equal(grown.length, 3);
	assert.deepEqual(grown, ["2", "3", "4"]);
});

test("appendHistory 預設上限為 HISTORY_MAX", () => {
	let h = [];
	for (let i = 0; i < HISTORY_MAX + 10; i++) h = appendHistory(h, "e" + i);
	assert.equal(h.length, HISTORY_MAX);
});

test("createCity 初始化歷史與財政欄位", () => {
	const city = createCity();
	assert.deepEqual(city.history, []);
	assert.equal(city.lastFinance, null);
});

test("buildReport 計算維護、收入與淨額", () => {
	const city = createCity();
	place(city, "power", 0, 0);
	city.lastFinance = { year: 1, month: 2, income: 500, upkeep: 400, net: 100 };
	const r = buildReport(city);
	assert.equal(r.income, 500);
	assert.equal(r.upkeep, POWER_UPKEEP); // 一座電廠
	assert.equal(r.net, 500 - POWER_UPKEEP);
	assert.equal(r.counts.power, 1);
});

test("buildReport 計算住宅居民與型別數量", () => {
	const city = createCity();
	place(city, "res", 5, 5);
	city.grid[5][5].level = 2;
	city.grid[5][5].seed = 0; // occupants = 2 * (8 + 0) = 16
	place(city, "park", 6, 6);
	const r = buildReport(city);
	assert.equal(r.occupants, 16);
	assert.equal(r.counts.res, 1);
	assert.equal(r.counts.park, 1);
});

test("buildReport 沒有 lastFinance 時收入為 0", () => {
	const city = createCity();
	const r = buildReport(city);
	assert.equal(r.income, 0);
});

test("tileInfo 越界回傳 null", () => {
	const city = createCity();
	assert.equal(tileInfo(city, -1, 0), null);
	assert.equal(tileInfo(city, 32, 0), null);
});

test("tileInfo 回傳道路資訊", () => {
	const city = createCity();
	place(city, "road", 2, 2);
	const t = tileInfo(city, 2, 2);
	assert.equal(t.type, "road");
	assert.equal(t.level, 1);
	assert.equal(t.occupants, 0);
	assert.equal(typeof t.description, "string");
	assert.equal(typeof t.color, "string");
});

test("simulate 建立財政快照與事件紀錄", () => {
	const city = createCity();
	city.month = 11;
	simulate(city);
	assert.equal(city.month, 12);
	assert.ok(city.lastFinance);
	assert.equal(city.lastFinance.month, 12);
	assert.equal(city.lastFinance.year, 1);
	assert.ok(Array.isArray(city.history));
	assert.equal(city.history.length, 1);
});

test("simulate 滿一年同時寫入里程碑事件", () => {
	const city = createCity();
	city.month = 12;
	city.year = 1;
	simulate(city);
	assert.equal(city.month, 1);
	assert.equal(city.year, 2);
	// 每月財政一筆 + 里程碑一筆
	assert.equal(city.history.length, 2);
	assert.ok(city.history.some((s) => s.includes("城市成立滿一年")));
});
