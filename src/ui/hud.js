/**
 * HUD — 更新頁首數值與 Toast 提示，並切換暫停按鈕文字。
 */

import { powerStats } from "../core/state.js";
import { checkGoals } from "../core/events.js";
import { dayNightIcon } from "./daynight.js";

export function createHud({ getCity }) {
	const q = (id) => document.querySelector(id);
	const moneyEl = q("#money");
	const popEl = q("#pop");
	const happyEl = q("#happy");
	const powerEl = q("#power");
	const dateEl = q("#date");
	const nightEl = q("#night");
	const pauseBtn = q("#pause");
	const toastEl = q("#toast");
	const saveEl = q("#save");

	function update() {
		const city = getCity();
		const ps = powerStats(city);
		moneyEl.textContent = "$" + city.money.toLocaleString();
		popEl.textContent = city.pop.toLocaleString();
		happyEl.textContent = city.happy + "%";
		powerEl.textContent = ps.used + " / " + ps.cap;
		powerEl.className = ps.used > ps.cap ? "bad" : "good";
		dateEl.textContent = `第 ${city.year} 年・${city.month} 月`;
		if (nightEl) nightEl.textContent = dayNightIcon(performance.now());
		pauseBtn.textContent = city.paused ? "▶ 繼續" : "⏸ 暫停";

		// 勝利目標追蹤器。
		const meter = q("#goalmeter");
		const labelEl = q("#goal-label");
		const fillEl = q("#goal-fill");
		if (meter && labelEl && fillEl) {
			const goal = checkGoals(city);
			if (city.won) {
				meter.classList.add("won");
				labelEl.textContent = `🏆 已達成勝利目標！人口 ${city.pop.toLocaleString()}・滿意度 ${city.happy}%`;
				fillEl.style.width = "100%";
			} else {
				meter.classList.remove("won");
				const popP = Math.min(1, city.pop / goal.popTarget);
				const happyP = Math.min(1, city.happy / goal.happyTarget);
				const fill = Math.round(Math.max(popP, happyP) * 100);
				labelEl.textContent = `目標：人口 ${city.pop.toLocaleString()} / ${goal.popTarget.toLocaleString()}・滿意度 ${city.happy}% / ${goal.happyTarget}%`;
				fillEl.style.width = fill + "%";
			}
		}
	}

	let timer = 0;
	function toast(msg) {
		toastEl.textContent = msg;
		toastEl.classList.add("show");
		clearTimeout(timer);
		timer = setTimeout(() => toastEl.classList.remove("show"), 1600);
	}

	let savedTimer = 0;
	function saved() {
		if (!saveEl) return;
		saveEl.textContent = "💾 已儲存 " + new Date().toLocaleTimeString();
		saveEl.classList.add("saved");
		clearTimeout(savedTimer);
		savedTimer = setTimeout(() => saveEl.classList.remove("saved"), 1200);
	}

	return { update, toast, saved };
}
