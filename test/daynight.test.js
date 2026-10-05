import { test } from "node:test";
import assert from "node:assert/strict";
import {
	CYCLE_MS,
	DAY_PORTION,
	NIGHT_CENTER,
	phase,
	nightness,
	dayNightIcon,
} from "../src/ui/daynight.js";

test("phase 落於 [0,1) 且為週期（modulo）", () => {
	assert.ok(phase(0) >= 0 && phase(0) < 1);
	assert.equal(phase(0), 0);
	assert.equal(phase(CYCLE_MS), 0);
	assert.equal(phase(2 * CYCLE_MS), 0);
	// 負數也穩定落入 [0,1)
	assert.ok(phase(-1) >= 0 && phase(-1) < 1);
	// 相位隨時間前進而增加
	assert.ok(phase(100) > phase(0));
});

test("nightness 在夜中相位為 1（全夜）", () => {
	assert.equal(nightness(NIGHT_CENTER * CYCLE_MS), 1);
});

test("nightness 在清晨 / 白天相位為 0（全晝）", () => {
	assert.equal(nightness(0), 0);
	assert.equal(nightness((DAY_PORTION / 2) * CYCLE_MS), 0);
});

test("nightness 恆落於 [0,1]", () => {
	for (let i = 0; i <= 240; i++) {
		const t = (i / 240) * CYCLE_MS;
		const v = nightness(t);
		assert.ok(v >= 0 && v <= 1, `nightness(${t}) = ${v}`);
	}
});

test("nightness 在夜中有最大值、白天墊最低", () => {
	let max = -Infinity;
	let min = Infinity;
	for (let i = 0; i < 240; i++) {
		const v = nightness((i / 240) * CYCLE_MS);
		max = Math.max(max, v);
		min = Math.min(min, v);
	}
	assert.equal(max, 1);
	assert.equal(min, 0);
});

test("nightness 平滑連續（相鄰取樣差距小）", () => {
	let prev = null;
	for (let i = 0; i < 240; i++) {
		const v = nightness((i / 240) * CYCLE_MS);
		if (prev !== null) {
			assert.ok(Math.abs(v - prev) < 0.06, `跳變 at sample ${i}`);
		}
		prev = v;
	}
});

test("dayNightIcon 依閾值切換圖示", () => {
	assert.equal(dayNightIcon(0), "☀️");
	assert.equal(dayNightIcon(0), "☀️");
	assert.equal(dayNightIcon(NIGHT_CENTER * CYCLE_MS), "🌙");
	// 晝夜交界前後應各擇一
	const before = dayNightIcon((NIGHT_CENTER * CYCLE_MS) - 100);
	const after = dayNightIcon(NIGHT_CENTER * CYCLE_MS);
	assert.ok(before === "☀️" || before === "🌙");
	assert.equal(after, "🌙");
});

test("夜中相位居於晝段之後", () => {
	assert.ok(NIGHT_CENTER > DAY_PORTION);
	assert.ok(NIGHT_CENTER < 1);
});
