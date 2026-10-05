import { test } from "node:test";
import assert from "node:assert/strict";
import { createCity } from "../src/core/state.js";
import { EVENT_CHANCE, GOAL_POP, GOAL_HAPPY } from "../src/core/constants.js";
import { pickEvent, checkGoals, EVENT_POOL } from "../src/core/events.js";

/** 建一座只有一個已成長分區的城市，方便區分火災/停電並使隨機選取確定。 */
function cityWithOneZone(x = 5, y = 5) {
	const city = createCity();
	city.grid[y][x] = { type: "res", level: 1, age: 5, seed: 0.5 };
	city.pop = 20;
	city.happy = 70;
	return city;
}

/** 依 id 取出事件描述。 */
function eventById(id) {
	return EVENT_POOL.find((e) => e.id === id);
}

test("pickEvent 在隨機值 >= EVENT_CHANCE 時回傳 null", () => {
	const orig = Math.random;
	Math.random = () => 1;
	try {
		assert.equal(pickEvent(createCity()), null);
	} finally {
		Math.random = orig;
	}
});

test("pickEvent 在隨機值 < EVENT_CHANCE 時觸發可用事件", () => {
	const orig = Math.random;
	Math.random = () => 0;
	try {
		// 空城可用事件只有 boom / crime，權重第一個是 boom。
		const ev = pickEvent(createCity());
		assert.notEqual(ev, null);
		assert.equal(ev.id, "boom");
	} finally {
		Math.random = orig;
	}
});

test("經濟繁榮 apply 增加金錢並提升滿意度", () => {
	const city = createCity();
	city.pop = 100;
	city.happy = 50;
	const before = city.money;
	const line = eventById("boom").apply(city);
	assert.ok(city.money > before, "金錢應增加");
	assert.ok(city.happy > 50, "滿意度應上升");
	assert.ok(typeof line === "string" && line.length > 0);
});

test("火災 apply 將已成長分區夷為平地並扣款", () => {
	const city = cityWithOneZone();
	city.money = 2000;
	const before = city.money;
	eventById("fire").apply(city);
	assert.equal(city.grid[5][5].type, "empty");
	assert.equal(city.grid[5][5].level, 0);
	assert.ok(city.money < before, "火災應造成金錢損失");
});

test("火災不會讓金錢低於零", () => {
	const city = cityWithOneZone();
	city.money = 100;
	eventById("fire").apply(city);
	assert.ok(city.money >= 0);
});

test("停電 apply 降低一處分區等級", () => {
	const city = cityWithOneZone();
	city.grid[5][5].level = 2;
	eventById("blackout").apply(city);
	assert.ok(city.grid[5][5].level < 2);
});

test("移民潮提升住宅等級（當就業 > 人口時可用）", () => {
	const city = createCity();
	// 3 級商業 = 12 職缺；res 等級 1（seed 0 → 8 居民），確保 jobs > residents。
	city.grid[6][6] = { type: "com", level: 3, age: 2, seed: 0.5 };
	city.grid[5][5] = { type: "res", level: 1, age: 1, seed: 0 };
	city.pop = 20;
	city.happy = 70;

	const ev = eventById("immigration");
	assert.equal(ev.applicable(city), true);
	const before = city.grid[5][5].level;
	ev.apply(city);
	assert.ok(city.grid[5][5].level >= before, "住宅等級不應下降");
});

test("火災 / 停電在沒有任何成長分區時不可用", () => {
	const city = createCity();
	assert.equal(eventById("fire").applicable(city), false);
	assert.equal(eventById("blackout").applicable(city), false);
});

test("checkGoals 在低於目標時未達成", () => {
	const city = createCity();
	city.pop = GOAL_POP - 1;
	city.happy = GOAL_HAPPY;
	assert.equal(checkGoals(city).won, false);

	city.pop = GOAL_POP;
	city.happy = GOAL_HAPPY - 1;
	assert.equal(checkGoals(city).won, false);
});

test("checkGoals 剛好達到目標即達成", () => {
	const city = createCity();
	city.pop = GOAL_POP;
	city.happy = GOAL_HAPPY;
	const r = checkGoals(city);
	assert.equal(r.won, true);
	assert.equal(r.popTarget, GOAL_POP);
	assert.equal(r.happyTarget, GOAL_HAPPY);
});

test("checkGoals 超過目標仍達成", () => {
	const city = createCity();
	city.pop = GOAL_POP + 500;
	city.happy = GOAL_HAPPY + 20;
	assert.equal(checkGoals(city).won, true);
});

test("EVENT_CHANCE 為正的合理值（0 < p < 1）", () => {
	assert.ok(EVENT_CHANCE > 0 && EVENT_CHANCE < 1);
});
