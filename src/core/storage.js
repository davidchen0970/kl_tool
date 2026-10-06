/**
 * 城市存檔 — 以 localStorage 序列化 / 還原城市狀態。
 *
 * 為讓測試可在無瀏覽器環境（node --test）中執行，所有函式都可注入
 * storage（預設是全域的 localStorage）。僅需具備 getItem / setItem / removeItem。
 */

import { GRID_W, GRID_H } from "./constants.js";
import { createCity } from "./state.js";
import { HISTORY_MAX } from "./report.js";

/** localStorage 的存檔金鑰。 */
export const SAVE_KEY = "mini_city_builder:v1";

/** 遊戲認識的所有 tile type。 */
const VALID_TYPES = ["empty", "road", "res", "com", "ind", "park", "power"];

/** 把一筆 tile 正規化成 { type, level, age, seed }，缺欄位給預設值。 */
function normalizeTile(t) {
	if (!t || typeof t !== "object") {
		return { type: "empty", level: 0, age: 0, seed: Math.random() };
	}
	const type = VALID_TYPES.includes(t.type) ? t.type : "empty";
	return {
		type,
		level: Number.isFinite(t.level) ? t.level : 0,
		age: Number.isFinite(t.age) ? t.age : 0,
		seed: Number.isFinite(t.seed) ? t.seed : Math.random(),
	};
}

/**
 * 把解析出的原始資料還原成合法的城市物件；若結構不合法回傳 null。
 * @param {unknown} raw
 * @returns {object|null}
 */
function normalize(raw) {
	if (!raw || typeof raw !== "object") return null;
	if (!Array.isArray(raw.grid) || raw.grid.length !== GRID_H) return null;

	const city = createCity();
	city.grid = [];
	for (let y = 0; y < GRID_H; y++) {
		const row = raw.grid[y];
		if (!Array.isArray(row) || row.length !== GRID_W) return null;
		const out = [];
		for (let x = 0; x < GRID_W; x++) {
			out.push(normalizeTile(row[x]));
		}
		city.grid.push(out);
	}

	if (Number.isFinite(raw.money)) city.money = raw.money;
	if (Number.isFinite(raw.pop)) city.pop = raw.pop;
	if (Number.isFinite(raw.happy)) city.happy = raw.happy;
	if (Number.isFinite(raw.month)) city.month = raw.month;
	if (Number.isFinite(raw.year)) city.year = raw.year;
	city.paused = !!raw.paused;
	city.won = !!raw.won;

	// 承載財政快照（lastFinance）— 只取數值欄位並做型別驗證。
	if (raw.lastFinance && typeof raw.lastFinance === "object") {
		const lf = {};
		for (const k of ["year", "month", "income", "upkeep", "net"]) {
			if (Number.isFinite(raw.lastFinance[k])) lf[k] = raw.lastFinance[k];
		}
		if (Object.keys(lf).length > 0) city.lastFinance = lf;
	}

	// 承載事件紀錄（history）— 只保留字串並限制筆數。
	if (Array.isArray(raw.history)) {
		city.history = raw.history.filter((e) => typeof e === "string").slice(0, HISTORY_MAX);
	}

	return city;
}

/**
 * 將城市序列化並存到 localStorage。
 * @param {object} city
 * @param {object} [storage] 可注入的 storage（預設為全域 localStorage）。
 * @returns {boolean} 是否成功。
 */
export function saveCity(city, storage = globalThis.localStorage) {
	try {
		storage.setItem(SAVE_KEY, JSON.stringify(city));
		return true;
	} catch {
		return false;
	}
}

/**
 * 讀取並還原存檔；沒有存檔、解析失敗或結構不合法時回傳 null。
 * @param {object} [storage]
 * @returns {object|null}
 */
export function loadCity(storage = globalThis.localStorage) {
	let raw;
	try {
		const str = storage.getItem(SAVE_KEY);
		if (str == null) return null;
		raw = JSON.parse(str);
	} catch {
		return null;
	}
	return normalize(raw);
}

/**
 * 清除存檔。
 * @param {object} [storage]
 */
export function clearSave(storage = globalThis.localStorage) {
	try {
		storage.removeItem(SAVE_KEY);
	} catch {
		/* 忽略：清除失敗不影響遊戲 */
	}
}
