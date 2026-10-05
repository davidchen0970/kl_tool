/**
 * 程式進入點 — 組裝各模組、綁定事件並啟動迴圈。
 *
 * 依賴方向：main → app / ui → core（core 不依賴任何 UI）。
 */

import { createCity, place, bulldoze } from "./core/state.js";
import { simulate } from "./core/simulate.js";
import { createCamera } from "./ui/camera.js";
import { createRenderer } from "./ui/renderer.js";
import { createHud } from "./ui/hud.js";
import { setupPointerInput, setupKeyboard } from "./ui/input.js";
import { setupToolbar } from "./app/toolbar.js";
import { createLoop } from "./app/loop.js";

const canvas = document.querySelector("#game");

const city = createCity();
const hover = { x: -1, y: -1 };
const camera = createCamera(canvas);
const hud = createHud({ getCity: () => city });

function togglePause() {
	city.paused = !city.paused;
	hud.update();
}

function onNew() {
	Object.assign(city, createCity());
	hud.update();
}

const toolbar = setupToolbar({ onTogglePause: togglePause, onNew });

const renderer = createRenderer({
	canvas,
	camera,
	getCity: () => city,
	getTool: toolbar.getTool,
	getHover: () => hover,
});

function onPlace(x, y) {
	const result = place(city, toolbar.getTool(), x, y);
	if (result === "no-money") hud.toast("資金不足！");
	if (result === "ok") hud.update();
}

function onBulldoze(x, y) {
	if (bulldoze(city, x, y) !== 0) hud.update();
}

function onTick() {
	const msg = simulate(city);
	if (msg) hud.toast(msg);
	hud.update();
}

setupPointerInput({ canvas, camera, hover, onPlace, onBulldoze });
setupKeyboard({ onToolSelect: toolbar.selectTool, onTogglePause: togglePause });
addEventListener("resize", () => renderer.resize());

renderer.resize();
renderer.start();
createLoop({ getCity: () => city, onTick });
hud.update();
