/**
 * 程式進入點 — 組裝各模組、綁定事件並啟動迴圈。
 *
 * 依賴方向：main → app / ui → core（core 不依賴任何 UI）。
 */

import { createCity, place, bulldoze } from "./core/state.js";
import { simulate } from "./core/simulate.js";
import { saveCity, loadCity, clearSave } from "./core/storage.js";
import { createCamera } from "./ui/camera.js";
import { createRenderer } from "./ui/renderer.js";
import { createHud } from "./ui/hud.js";
import { createPanel } from "./ui/panel.js";
import { setupPointerInput, setupKeyboard } from "./ui/input.js";
import { setupToolbar } from "./app/toolbar.js";
import { createLoop } from "./app/loop.js";

const canvas = document.querySelector("#game");

const city = loadCity() ?? createCity();
const hover = { x: -1, y: -1 };
const selected = { x: -1, y: -1 };
const camera = createCamera(canvas);
const hud = createHud({ getCity: () => city });

function setSelected(x, y) {
	selected.x = x;
	selected.y = y;
}

function save() {
	if (saveCity(city)) hud.saved();
}

function togglePause() {
	city.paused = !city.paused;
	hud.update();
	panel.render();
	save();
}

function onNew() {
	clearSave();
	Object.assign(city, createCity());
	setSelected(-1, -1);
	hud.update();
	panel.render();
}

const toolbar = setupToolbar({ onTogglePause: togglePause, onNew });

const renderer = createRenderer({
	canvas,
	camera,
	getCity: () => city,
	getTool: toolbar.getTool,
	getHover: () => hover,
	getSelected: () => selected,
});

const panel = createPanel({ getCity: () => city, getSelected: () => selected, setSelected });

function onInspect(x, y) {
	setSelected(x, y);
	panel.render();
	hud.update();
}

function onPlace(x, y) {
	const result = place(city, toolbar.getTool(), x, y);
	if (result === "no-money") hud.toast("資金不足！");
	if (result === "ok") {
		hud.update();
		panel.render();
		save();
	}
}

function onBulldoze(x, y) {
	if (bulldoze(city, x, y) !== 0) {
		hud.update();
		panel.render();
		save();
	}
}

function onTick() {
	const msg = simulate(city);
	if (msg) hud.toast(msg);
	hud.update();
	panel.render();
	save();
}

setupPointerInput({ canvas, camera, hover, onPlace, onBulldoze, getTool: toolbar.getTool, onInspect });
setupKeyboard({ onToolSelect: toolbar.selectTool, onTogglePause: togglePause });
addEventListener("resize", () => renderer.resize());

renderer.resize();
renderer.start();
createLoop({ getCity: () => city, onTick });
hud.update();
panel.render();
