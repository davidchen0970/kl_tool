/**
 * HUD — 更新頁首數值與 Toast 提示，並切換暫停按鈕文字。
 */

import { powerStats } from "../core/state.js";

export function createHud({ getCity }) {
	const q = (id) => document.querySelector(id);
	const moneyEl = q("#money");
	const popEl = q("#pop");
	const happyEl = q("#happy");
	const powerEl = q("#power");
	const dateEl = q("#date");
	const pauseBtn = q("#pause");
	const toastEl = q("#toast");

	function update() {
		const city = getCity();
		const ps = powerStats(city);
		moneyEl.textContent = "$" + city.money.toLocaleString();
		popEl.textContent = city.pop.toLocaleString();
		happyEl.textContent = city.happy + "%";
		powerEl.textContent = ps.used + " / " + ps.cap;
		powerEl.className = ps.used > ps.cap ? "bad" : "good";
		dateEl.textContent = `第 ${city.year} 年・${city.month} 月`;
		pauseBtn.textContent = city.paused ? "▶ 繼續" : "⏸ 暫停";
	}

	let timer = 0;
	function toast(msg) {
		toastEl.textContent = msg;
		toastEl.classList.add("show");
		clearTimeout(timer);
		timer = setTimeout(() => toastEl.classList.remove("show"), 1600);
	}

	return { update, toast };
}
