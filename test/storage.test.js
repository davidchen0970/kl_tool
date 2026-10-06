import { test } from "node:test";
import assert from "node:assert/strict";
import { saveCity, loadCity, clearSave, SAVE_KEY } from "../src/core/storage.js";
import { createCity, place } from "../src/core/state.js";

/** 以記憶體模擬 localStorage 的簡易 shim，讓測試可在 node --test 執行。 */
function memoryStorage() {
	const map = new Map();
	return {
		getItem: (k) => (map.has(k) ? map.get(k) : null),
		setItem: (k, v) => map.set(k, String(v)),
		removeItem: (k) => map.delete(k),
	};
}

test("儲存後可完整還原城市", () => {
	const storage = memoryStorage();
	const city = createCity();
	place(city, "road", 5, 5);
	place(city, "res", 6, 6);
	city.money = 12345;
	city.pop = 99;
	city.happy = 85;
	city.year = 3;

	assert.equal(saveCity(city, storage), true);
	const loaded = loadCity(storage);
	assert.notEqual(loaded, null);
	assert.equal(loaded.money, 12345);
	assert.equal(loaded.pop, 99);
	assert.equal(loaded.happy, 85);
	assert.equal(loaded.year, 3);
	assert.equal(loaded.grid[5][5].type, "road");
	assert.equal(loaded.grid[6][6].type, "res");
	assert.equal(loaded.grid.length, 24);
	assert.equal(loaded.grid[0].length, 32);
});

test("沒有存檔時 loadCity 回傳 null", () => {
	assert.equal(loadCity(memoryStorage()), null);
});

test("JSON 解析失敗時 loadCity 回傳 null", () => {
	const storage = memoryStorage();
	storage.setItem(SAVE_KEY, "not-json{{{");
	assert.equal(loadCity(storage), null);
});

test("grid 尺寸不正確時 loadCity 回傳 null", () => {
	const storage = memoryStorage();
	storage.setItem(SAVE_KEY, JSON.stringify({ grid: [] }));
	assert.equal(loadCity(storage), null);

	const storage2 = memoryStorage();
	const raw = { grid: [[{}]] };
	storage2.setItem(SAVE_KEY, JSON.stringify(raw));
	assert.equal(loadCity(storage2), null);
});

test("缺欄位的 tile 會被正規化補回預設值", () => {
	const storage = memoryStorage();
	const raw = {
		grid: Array.from({ length: 24 }, () => Array(32).fill({})),
		money: 777,
	};
	storage.setItem(SAVE_KEY, JSON.stringify(raw));
	const loaded = loadCity(storage);
	assert.notEqual(loaded, null);
	assert.equal(loaded.money, 777);
	assert.equal(loaded.grid[0][0].type, "empty");
	assert.equal(loaded.grid[0][0].level, 0);
	assert.equal(loaded.grid[0][0].age, 0);
	assert.ok(Number.isFinite(loaded.grid[0][0].seed));
});

test("clearSave 移除存檔", () => {
	const storage = memoryStorage();
	const city = createCity();
	saveCity(city, storage);
	clearSave(storage);
	assert.equal(loadCity(storage), null);
});
