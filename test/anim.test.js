import { test } from "node:test";
import assert from "node:assert/strict";
import {
	clamp01,
	hash01,
	easeOutBack,
	easeOutCubic,
	tween01,
	osc,
} from "../src/ui/anim.js";

test("hash01 恆落於 [0,1) 且確定性穩定", () => {
	for (let x = 0; x < 64; x++) {
		for (let y = 0; y < 64; y++) {
			const v = hash01(x, y);
			assert.ok(v >= 0 && v < 1, `hash01(${x},${y}) = ${v}`);
			// 相同輸入必回傳相同值
			assert.equal(v, hash01(x, y));
		}
	}
});

test("hash01 對不同格子 / salt 會改變（不會全是一片均值）", () => {
	const a = new Set();
	for (let i = 0; i < 32; i++) {
		for (let j = 0; j < 32; j++) {
			a.add(hash01(i, j));
		}
	}
	assert.ok(a.size > 500, `only got ${a.size} distinct hashes`);
	// 同格子不同 salt 產出不同值
	assert.notEqual(hash01(3, 5, 1), hash01(3, 5, 2));
});

test("clamp01 收斂到 [0,1]", () => {
	assert.equal(clamp01(-2), 0);
	assert.equal(clamp01(0), 0);
	assert.equal(clamp01(1), 1);
	assert.equal(clamp01(5), 1);
	assert.equal(clamp01(0.5), 0.5);
});

test("easeOutCubic 端點正確且單調", () => {
	assert.equal(easeOutCubic(0), 0);
	assert.equal(easeOutCubic(1), 1);
	let prev = -Infinity;
	for (let i = 0; i <= 20; i++) {
		const t = i / 20;
		const v = easeOutCubic(t);
		assert.ok(v >= 0 && v <= 1, `easeOutCubic(${t}) = ${v}`);
		assert.ok(v >= prev, `easeOutCubic must be monotonic at ${t}`);
		prev = v;
	}
});

test("easeOutBack 端點為 0/1，且中段有 overshoot（回彈）", () => {
	assert.equal(easeOutBack(0), 0);
	assert.equal(easeOutBack(1), 1);
	// 中段應有超過 1 的回彈
	let max = -Infinity;
	for (let i = 1; i < 20; i++) {
		max = Math.max(max, easeOutBack(i / 20));
	}
	assert.ok(max > 1, `no overshoot, max = ${max}`);
});

test("easeOutBack 恆落於合理內界（不會爆炸）", () => {
	for (let i = 0; i <= 100; i++) {
		const v = easeOutBack(i / 100);
		assert.ok(v >= 0 && v < 2, `easeOutBack(${i / 100}) = ${v}`);
	}
});

test("tween01 線性投影並收斂到 [0,1]", () => {
	assert.equal(tween01(0, 100, 200), 0.5);
	assert.equal(tween01(0, 300, 200), 1);
	assert.equal(tween01(100, 0, 200), 0);
	assert.equal(tween01(0, 0, 200), 0);
	assert.equal(tween01(0, 500, 0), 1);
});

test("osc 振盪於 [0,1] 且對 0/半週期為端點", () => {
	for (let i = 0; i <= 40; i++) {
		const v = osc(i * 100, 4000);
		assert.ok(v >= 0 && v <= 1, `osc(${i * 100}) = ${v}`);
	}
	assert.ok(Math.abs(osc(0, 1000) - 0.5) < 1e-9);
	assert.ok(Math.abs(osc(250, 1000) - 1) < 1e-6);
});
