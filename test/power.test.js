import { test } from "node:test";
import assert from "node:assert/strict";
import { createCity, place } from "../src/core/state.js";
import { poweredNetwork, isPowered, cellKey } from "../src/core/power.js";

test("poweredNetwork 電力沿相連道路擴散", () => {
	const city = createCity();
	place(city, "power", 0, 0);
	place(city, "road", 1, 0);
	place(city, "road", 2, 0);
	place(city, "road", 3, 0);

	const { network, powered } = poweredNetwork(city);
	for (const [x, y] of [[0, 0], [1, 0], [2, 0], [3, 0]]) {
		assert.ok(network.has(cellKey(x, y)), `${x},${y} 應在電網內`);
	}
	// 與這些道路 4 鄰近的空地無分區，powered 為空
	assert.equal(powered.size, 0);
});

test("poweredNetwork 孤立的道路不會導電", () => {
	const city = createCity();
	place(city, "power", 0, 0);
	place(city, "road", 1, 0);
	place(city, "road", 10, 10); // 遠離電廠，不相連

	const { network } = poweredNetwork(city);
	assert.ok(network.has("1,0"));
	assert.ok(!network.has("10,10"), "孤立的道路不應通電");
});

test("poweredNetwork 導體被分區阻斷", () => {
	const city = createCity();
	place(city, "power", 0, 0);
	place(city, "road", 1, 0);
	place(city, "road", 3, 0);
	// 在 (2,0) 放一住宅，擋在兩段道路之間，且它自己鄰近(1,0)而被供電
	place(city, "res", 2, 0);

	const { network, powered } = poweredNetwork(city);
	assert.ok(network.has("0,0"));
	assert.ok(network.has("1,0"));
	assert.ok(!network.has("3,0"), "電網不應穿過分區");
	assert.ok(powered.has("2,0"), "住宅 4 鄰近供電道路 → 被供電");
});

test("isPowered 依座標查詢", () => {
	const city = createCity();
	place(city, "power", 0, 0);
	place(city, "road", 1, 0);
	place(city, "res", 1, 1);

	const status = poweredNetwork(city);
	assert.equal(isPowered(status.powered, 1, 1), true);
	assert.equal(isPowered(status.powered, 9, 9), false);
	// 未提供集時回傳 false
	assert.equal(isPowered(undefined, 1, 1), false);
});

test("poweredNetwork 空城無電網", () => {
	const city = createCity();
	const status = poweredNetwork(city);
	assert.equal(status.network.size, 0);
	assert.equal(status.powered.size, 0);
});
