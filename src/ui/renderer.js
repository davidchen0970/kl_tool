/**
 * 渲染器 — 把地圖畫上 canvas，並處理 DPR resize。加入輕量的程序動畫：
 * 行車粒子、建築生成跳出、電廠閃爍、公園搖曳與草地夜幕水光。所有動畫
 * 皆以純 canvas / 時間計算，絕不更動遊戲狀態。
 */

import { GRID_W, GRID_H, COLORS, COSTS, GROWABLE } from "../core/constants.js";
import { poweredNetwork } from "../core/power.js";
import { nightness } from "./daynight.js";
import { easeOutBack, easeOutCubic, hash01, osc, tween01 } from "./anim.js";

/** 建築生成動畫的持續毫秒數。 */
const POP_MS = 450;
/** 行車粒子在單一道路格上行進一個周期所需的毫秒數。 */
const TRAFFIC_MS = 2600;
/** 道路格中「會出現粒子」的比例（控制車流量）。 */
const TRAFFIC_DENSITY = 0.4;

export function createRenderer({ canvas, camera, getCity, getTool, getHover, getSelected }) {
	const ctx = canvas.getContext("2d");

	// 每個格子的上一幀指紋（"type:level"），用於偵測「新蓋 / 升級」以觸發生成跳出。
	let prevSig = null;
	// 最近跳出的建築：key = "x,y"，value = 觸發時間。
	const spawns = new Map();

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	/**
	 * 比對地圖指紋，找出「growable 且 level>0」的新出現 / 升級格，並排進生成動畫佇列。
	 * O(cells)，與繪圖同量級、很便宜。
	 */
	function noteChange(grid, now) {
		const W = GRID_W;
		const H = GRID_H;
		const cur = new Array(W * H);
		for (let y = 0; y < H; y++) {
			const row = grid[y];
			for (let x = 0; x < W; x++) {
				const c = row[x];
				cur[y * W + x] = c.type + ":" + c.level;
			}
		}
		if (prevSig) {
			for (let j = 0; j < cur.length; j++) {
				if (cur[j] === prevSig[j]) continue;
				const x = j % W;
				const y = (j / W) | 0;
				const c = grid[y][x];
				if (GROWABLE.includes(c.type) && c.level > 0) {
					spawns.set(x + "," + y, now);
				}
			}
		}
		prevSig = cur;
	}

	/** 主動補一顆生成動畫（外部若有需要可呼叫；內部 noteChange 已自動偵測）。 */
	function pulse(x, y, now = performance.now()) {
		spawns.set(x + "," + y, now);
	}

	/** 清掉已結束的生成動畫，避免佇列無限累積。 */
	function sweepSpawns(now) {
		for (const [k, t] of spawns) {
			if (now - t > POP_MS) spawns.delete(k);
		}
	}

	function draw() {
		const o = camera.origin();
		const s = o.s;
		const city = getCity();
		const grid = city.grid;
		const W = GRID_W;
		const H = GRID_H;
		const now = performance.now();

		noteChange(grid, now);
		sweepSpawns(now);

		// 電網狀態（每幀重算，3×3 格子很便宜）。
		const { network, powered } = poweredNetwork(city);
		const glow = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(now / 420));

		// 晝夜：以真實時間自算夜晚程度（0..1），純 canvas、零狀態變更。
		const night = nightness(now);

		ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
		ctx.fillStyle = "#173047";
		ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

		ctx.save();
		ctx.shadowColor = "#0008";
		ctx.shadowBlur = 14;
		ctx.fillStyle = "#4f8d48";
		ctx.fillRect(o.x, o.y, W * s, H * s);
		ctx.shadowBlur = 0;

		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				const c = grid[y][x];
				const px = o.x + x * s;
				const py = o.y + y * s;
				const key = x + "," + y;
				// 同格確定性相位種子，供底下各種動畫共用（同格每幀相位一致）。
				const h = hash01(x, y);

				// 基底色
				ctx.fillStyle = COLORS[c.type];
				ctx.fillRect(px + 0.5, py + 0.5, s - 1, s - 1);

				// 空地的草地雜點
				if (c.type === "empty") {
					ctx.fillStyle = c.seed > 0.7 ? "#6bab5b" : "#57994d";
					ctx.fillRect(px + s * 0.2, py + s * 0.22, 2, 2);
				}

				// 夜晚時，草地浮著極淡的月光水光（微微撲閃）。
				if (c.type === "empty" && night > 0.02) {
					const tw = osc(now + h * 1200, 620);
					ctx.fillStyle = "rgba(200,225,255," + (night * 0.12 * tw).toFixed(3) + ")";
					ctx.fillRect(px + s * 0.6, py + s * 0.55, 1.5, 1.5);
				}

				// 道路
				if (c.type === "road") {
					ctx.fillStyle = "#8b9299";
					ctx.fillRect(px, py + s * 0.44, s, s * 0.12);
					ctx.fillRect(px + s * 0.44, py, s * 0.12, s);
					ctx.fillStyle = "#d8c66a";
					ctx.fillRect(px + s * 0.48, py + s * 0.06, s * 0.04, s * 0.22);
					ctx.fillRect(px + s * 0.48, py + s * 0.72, s * 0.04, s * 0.22);

					// 行車粒子：僅一部分道路格有車，車子在車道上隨時間移動。
					if (h < TRAFFIC_DENSITY) {
						const p = ((now / TRAFFIC_MS) + h) % 1;
						const vertical = hash01(x, y, 7) < 0.5;
						// 沿車道中心行進的相位位移。
						const along = (vertical ? py : px) + p * s;
						const center = (vertical ? px : py) + s * 0.5;
						ctx.fillStyle = hash01(x, y, 3) > 0.5 ? "#ffd166" : "#e76f9a";
						ctx.fillRect(
							(vertical ? center - s * 0.016 : along - s * 0.016),
							(vertical ? along - s * 0.03 : center - s * 0.016),
							s * 0.032,
							s * 0.032
						);
					}
				}

				// 成長中的建築（夜間窗戶會點亮成暖黃），含「生成跳出」動畫。
				if (GROWABLE.includes(c.type) && c.level > 0) {
					const margin = s * (0.27 - 0.04 * c.level);
					const baseH = s * (0.3 + 0.13 * c.level);
					// 若此格正在「生成跳出」，先算縮放與殘影。
					let sc = 1;
					let st = 0;
					if (spawns.has(key)) {
						const started = spawns.get(key);
						const p = tween01(started, now, POP_MS);
						sc = easeOutBack(p);
						if (p >= 1) spawns.delete(key);
						st = p;
					}
					const h = Math.max(s * 0.06, baseH * sc);
					// 天黑時建築本體略為轉暗。
					const bodyA = 1 - night * 0.22;
					const bodyBase = c.type === "res" ? "#e8f0e0" : c.type === "com" ? "#cce9ff" : "#5d5143";
					ctx.globalAlpha = bodyA;
					ctx.fillStyle = bodyBase;
					ctx.strokeStyle = "#26384c";
					ctx.lineWidth = 1;
					ctx.fillRect(px + margin, py + s - margin - h, s - 2 * margin, h);
					ctx.strokeRect(px + margin, py + s - margin - h, s - 2 * margin, h);
					// 窗戶：白天淡，夜晚轉暖黃並漸亮。
					ctx.globalAlpha = Math.max(0.25, night * 1.15);
					ctx.fillStyle = night > 0.15 ? "#ffd272" : c.type === "ind" ? "#f5b84a" : "#ffffff";
					// 生成跳出殘影：白亮覆蓋隨時間淡出。
					if (st > 0 && st < 1) {
						ctx.globalAlpha = (1 - easeOutCubic(st)) * 0.45;
						ctx.fillStyle = "#ffffff";
						ctx.fillRect(px + margin, py + s - margin - h, s - 2 * margin, h);
					}
					ctx.globalAlpha = 1;
				}

				// 公園樹冠：隨風輕搖。
				if (c.type === "park") {
					const wind = Math.sin(now / 1100 + h * Math.PI * 2);
					const lean = wind * s * 0.045;
					const cx = px + s * 0.52 + lean;
					const cy = py + s * 0.4;
					const r = s * 0.3;
					ctx.fillStyle = "#2e8c4e";
					ctx.beginPath();
					ctx.arc(cx, cy, r, 0, Math.PI * 2);
					ctx.fill();
					ctx.fillStyle = "#3aa95f";
					ctx.beginPath();
					ctx.arc(cx + s * 0.16, cy - s * 0.12, r * 0.7, 0, Math.PI * 2);
					ctx.fill();
					// 樹幹
					ctx.fillStyle = "#6d4c33";
					ctx.fillRect(px + s * 0.46, py + s * 0.58, s * 0.08, s * 0.26);
				}

				// 電廠：本體 + 慢速變壓器脈衝 + 微妙閃爍光暈。
				if (c.type === "power") {
					ctx.fillStyle = "#493458";
					ctx.fillRect(px + s * 0.2, py + s * 0.45, s * 0.6, s * 0.37);
					// 閃爍光暈（隨時間細微抖動 + 慢速脈動）。
					const flick = 0.75 + 0.25 * osc(now + h * 300, 55);
					const pulseAmp = osc(now + h * 900, 1500);
					ctx.globalAlpha = (0.14 + 0.22 * pulseAmp) * flick;
					ctx.fillStyle = "#ffd9ff";
					ctx.fillRect(px + s * 0.1, py + s * 0.34, s * 0.8, s * 0.5);
					ctx.globalAlpha = 1;
					// 高壓線 + 變壓器芯的脈衝小圓點。
					ctx.strokeStyle = "#ebccff";
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(px + s * 0.52, py + s * 0.14);
					ctx.lineTo(px + s * 0.38, py + s * 0.5);
					ctx.lineTo(px + s * 0.57, py + s * 0.42);
					ctx.lineTo(px + s * 0.48, py + s * 0.72);
					ctx.stroke();
					const tr = s * (0.05 + 0.045 * pulseAmp);
					ctx.fillStyle = "#ffe8b0";
					ctx.beginPath();
					ctx.arc(px + s * 0.62, py + s * 0.28, tr, 0, Math.PI * 2);
					ctx.fill();
				}

				// 電網發光：供電的導體（路 / 電廠）與被供電的分區，微微脈動。
				if (network.has(key) || powered.has(key)) {
					ctx.globalAlpha = glow;
					ctx.fillStyle = "#fff6b0";
					ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
					ctx.globalAlpha = 1;
				}
			}
		}

		// 夜晚：於整張地圖覆上一層深藍夜幕，夜幕愈深色愈重。
		if (night > 0.02) {
			ctx.fillStyle = "rgba(10,18,38," + (night * 0.58).toFixed(3) + ")";
			ctx.fillRect(o.x, o.y, W * s, H * s);
		}

		// 滑鼠高亮框
		const hover = getHover();
		if (hover.x >= 0 && hover.y >= 0 && hover.x < W && hover.y < H) {
			ctx.strokeStyle = city.money >= COSTS[getTool()] ? "#fff" : "#ff6969";
			ctx.lineWidth = 2;
			ctx.strokeRect(o.x + hover.x * s + 1, o.y + hover.y * s + 1, s - 2, s - 2);
		}

		// 選取方塊（查詢工具）— 用虛線高亮標示
		const sel = getSelected && getSelected();
		if (sel && sel.x >= 0 && sel.y >= 0 && sel.x < W && sel.y < H) {
			ctx.strokeStyle = "#58c7ff";
			ctx.lineWidth = 2;
			ctx.setLineDash([4, 3]);
			ctx.strokeRect(o.x + sel.x * s + 1, o.y + sel.y * s + 1, s - 2, s - 2);
			ctx.setLineDash([]);
		}

		// 勝利後在整張地圖外框加一道金色光暈。
		if (city.won) {
			ctx.strokeStyle = "#e8b84f";
			ctx.lineWidth = 3;
			ctx.strokeRect(o.x + 1, o.y + 1, W * s - 2, H * s - 2);
		}

		ctx.restore();
		requestAnimationFrame(draw);
	}

	function start() {
		requestAnimationFrame(draw);
	}

	return { draw, resize, start, pulse };
}
