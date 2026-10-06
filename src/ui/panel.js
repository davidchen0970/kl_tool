/**
 * 資訊側邊面板 — 顯示財政月報、選取方塊資訊與事件紀錄。
 */

import { buildReport, tileInfo, HISTORY_MAX } from "../core/report.js";

export function createPanel({ getCity, getSelected, setSelected }) {
	const q = (id) => document.querySelector(id);
	const panel = q("#info");
	const toggleBtn = q("#info-toggle");
	const els = {
		date: q("#fin-date"),
		income: q("#fin-income"),
		upkeep: q("#fin-upkeep"),
		net: q("#fin-net"),
		tileNone: q("#tile-none"),
		tileDetail: q("#tile-detail"),
		tileSwatch: q("#tile-swatch"),
		tileTitle: q("#tile-title"),
		tileLevel: q("#tile-level"),
		tileAge: q("#tile-age"),
		tileOcc: q("#tile-occ"),
		tileDesc: q("#tile-desc"),
		history: q("#history-list"),
	};

	let open = false;
	function toggle(force) {
		open = typeof force === "boolean" ? force : !open;
		panel.classList.toggle("open", open);
		toggleBtn.classList.toggle("active", open);
	}

	/** 以目前城市狀態重繪整個面板。 */
	function render() {
		const city = getCity();
		const r = buildReport(city);
		els.date.textContent = `第 ${city.year} 年・${city.month} 月`;
		els.income.textContent = "$" + r.income.toLocaleString();
		els.upkeep.textContent = "-$" + r.upkeep.toLocaleString();
		els.net.textContent = "$" + r.net.toLocaleString();
		els.net.classList.toggle("neg", r.net < 0);

		const sel = getSelected();
		if (sel && sel.x >= 0 && sel.y >= 0) {
			const t = tileInfo(city, sel.x, sel.y);
			if (t) {
				els.tileNone.hidden = true;
				els.tileDetail.hidden = false;
				els.tileSwatch.style.background = t.color;
				els.tileTitle.textContent = `${t.type} 方塊 (${sel.x},${sel.y})`;
				els.tileLevel.textContent = t.level;
				els.tileAge.textContent = t.age + " 月";
				els.tileOcc.textContent = t.occupants > 0 ? t.occupants.toLocaleString() : "—";
				els.tileDesc.textContent = `${t.description} 估計價值 $${t.value.toLocaleString()}`;
			}
		} else {
			els.tileDetail.hidden = true;
			els.tileNone.hidden = false;
		}

		els.history.innerHTML = "";
		const list = city.history || [];
		const recent = list.slice(Math.max(0, list.length - HISTORY_MAX)).reverse();
		if (recent.length === 0) {
			const li = document.createElement("li");
			li.className = "muted";
			li.textContent = "尚無紀錄";
			els.history.appendChild(li);
		} else {
			for (const text of recent) {
				const li = document.createElement("li");
				li.textContent = text;
				els.history.appendChild(li);
			}
		}
	}

	toggleBtn.onclick = () => toggle();
	return { render, toggle, setSelected };
}
