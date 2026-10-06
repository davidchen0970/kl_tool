import { test } from "node:test";
import assert from "node:assert/strict";
import {
	createCity,
	place,
	roadNear,
	START_SEGMENT_X,
	START_SEGMENT_Y,
	START_LENGTH,
	isStartSegment,
} from "../src/core/state.js";
import { saveCity, loadCity, SAVE_KEY } from "../src/core/storage.js";

/** 以記憶體模擬 localStorage 的簡易 shim，讓測試可在 node --test 執行。 */
function memoryStorage() {
	const map = new Map();
	return {
		getItem: (k) => (map.has(k) ? map.get(k) : null),
		setItem: (k, v) => map.set(k, String(v)),
		removeItem: (k) => map.delete(k),
	};
}

test("新城市包含中央起始道路，且為 level 1 道路", () => {
	const city = createCity();
	for (let i = 0; i < START_LENGTH; i++) {
		const c = city.grid[START_SEGMENT_Y][START_SEGMENT_X + i];
		assert.equal(c.type, "road");
		assert.equal(c.level, 1);
	}
});

test("起始道路位置在 isStartSegment 內", () => {
	const city = createCity();
	for (let i = 0; i < START_LENGTH; i++) {
		assert.equal(isStartSegment(START_SEGMENT_X + i, START_SEGMENT_Y), true);
	}
	// 段外左一格的同一列不算起始道路
	assert.equal(isStartSegment(START_SEGMENT_X - 1, START_SEGMENT_Y), false);
	assert.equal(city.grid[START_SEGMENT_Y][START_SEGMENT_X - 1].type, "empty");
	// 上下相鄰列也不算起始道路
	assert.equal(isStartSegment(START_SEGMENT_X, START_SEGMENT_Y - 1), false);
	assert.equal(isStartSegment(START_SEGMENT_X, START_SEGMENT_Y + 1), false);
});

test("起始道路佔據的格子無法再放置", () => {
	const city = createCity();
	// 起始道路本身不是 empty，疊放應回報 blocked
	assert.equal(place(city, "res", START_SEGMENT_X, START_SEGMENT_Y), "blocked");
});

test("起始道路相鄰格可偵測到道路（可直接蓋住宅）", () => {
	const city = createCity();
	// 起點路的上方 / 下方 / 後一格都算緊鄰道路
	assert.equal(roadNear(city, START_SEGMENT_X, START_SEGMENT_Y - 1), true);
	assert.equal(roadNear(city, START_SEGMENT_X, START_SEGMENT_Y + 1), true);
	assert.equal(roadNear(city, START_SEGMENT_X + 1, START_SEGMENT_Y), true);
});

test("normalize 不會強制把起始道路加回被清除的存檔", () => {
	// 玩家可能鏟掉起始道路；存檔應保留「玩家實際建的 grid」。
	const storage = memoryStorage();
	const raw = {
		grid: Array.from({ length: 24 }, () =>
			Array.from({ length: 32 }, () => ({ type: "empty", level: 0, age: 0 })),
		),
		money: 10000,
	};
	storage.setItem(SAVE_KEY, JSON.stringify(raw));
	const loaded = loadCity(storage);
	assert.notEqual(loaded, null);
	// 起始道路位置必須維持 empty（不被 normalize 重新塞回 starter）。
	assert.equal(loaded.grid[START_SEGMENT_Y][START_SEGMENT_X].type, "empty");
});

test("normalize 保留已蓋好的存檔格（含起始道路）", () => {
	const storage = memoryStorage();
	const city = createCity(); // 內含起始道路
	place(city, "res", START_SEGMENT_X + 2, START_SEGMENT_Y - 1);
	assert.equal(saveCity(city, storage), true);
	const loaded = loadCity(storage);
	assert.notEqual(loaded, null);
	assert.equal(loaded.grid[START_SEGMENT_Y][START_SEGMENT_X].type, "road");
	assert.equal(loaded.grid[START_SEGMENT_Y - 1][START_SEGMENT_X + 2].type, "res");
});
