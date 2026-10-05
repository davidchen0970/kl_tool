/**
 * 渲染器 — 把地圖畫上 canvas，並處理 DPR resize。
 */

import { GRID_W, GRID_H, COLORS, COSTS, GROWABLE } from "../core/constants.js";

export function createRenderer({ canvas, camera, getCity, getTool, getHover, getSelected }) {
	const ctx = canvas.getContext("2d");

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function draw() {
		const o = camera.origin();
		const s = o.s;
		const grid = getCity().grid;
		const W = GRID_W;
		const H = GRID_H;

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

				// 基底色
				ctx.fillStyle = COLORS[c.type];
				ctx.fillRect(px + 0.5, py + 0.5, s - 1, s - 1);

				// 空地的草地雜點
				if (c.type === "empty") {
					ctx.fillStyle = c.seed > 0.7 ? "#6bab5b" : "#57994d";
					ctx.fillRect(px + s * 0.2, py + s * 0.22, 2, 2);
				}

				// 道路
				if (c.type === "road") {
					ctx.fillStyle = "#8b9299";
					ctx.fillRect(px, py + s * 0.44, s, s * 0.12);
					ctx.fillRect(px + s * 0.44, py, s * 0.12, s);
					ctx.fillStyle = "#d8c66a";
					ctx.fillRect(px + s * 0.48, py + s * 0.06, s * 0.04, s * 0.22);
					ctx.fillRect(px + s * 0.48, py + s * 0.72, s * 0.04, s * 0.22);
				}

				// 成長中的建築
				if (GROWABLE.includes(c.type) && c.level > 0) {
					const margin = s * (0.27 - 0.04 * c.level);
					const h = s * (0.3 + 0.13 * c.level);
					ctx.fillStyle = c.type === "res" ? "#e8f0e0" : c.type === "com" ? "#cce9ff" : "#5d5143";
					ctx.strokeStyle = "#26384c";
					ctx.lineWidth = 1;
					ctx.fillRect(px + margin, py + s - margin - h, s - 2 * margin, h);
					ctx.strokeRect(px + margin, py + s - margin - h, s - 2 * margin, h);
					ctx.fillStyle = c.type === "ind" ? "#f5c95e" : "#ffe68a";
					for (let k = 0; k < c.level; k++) {
						ctx.fillRect(px + margin + 3 + k * 5, py + s - margin - h + 4, 2, 3);
					}
				}

				// 公園
				if (c.type === "park") {
					ctx.fillStyle = "#0b613c";
					ctx.beginPath();
					ctx.arc(px + s * 0.5, py + s * 0.42, s * 0.22, 0, 7);
					ctx.fill();
					ctx.fillStyle = "#754c29";
					ctx.fillRect(px + s * 0.47, py + s * 0.5, s * 0.07, s * 0.28);
				}

				// 電廠
				if (c.type === "power") {
					ctx.fillStyle = "#493458";
					ctx.fillRect(px + s * 0.2, py + s * 0.45, s * 0.6, s * 0.37);
					ctx.strokeStyle = "#ebccff";
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(px + s * 0.52, py + s * 0.14);
					ctx.lineTo(px + s * 0.38, py + s * 0.5);
					ctx.lineTo(px + s * 0.57, py + s * 0.42);
					ctx.lineTo(px + s * 0.48, py + s * 0.72);
					ctx.stroke();
				}
			}
		}

		// 滑鼠高亮框
		const hover = getHover();
		if (hover.x >= 0 && hover.y >= 0 && hover.x < W && hover.y < H) {
			ctx.strokeStyle = getCity().money >= COSTS[getTool()] ? "#fff" : "#ff6969";
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

		ctx.restore();
		requestAnimationFrame(draw);
	}

	function start() {
		requestAnimationFrame(draw);
	}

	return { draw, resize, start };
}
