/**
 * 工具列 — 切換建造工具、暫停、重新開始，並負責 active 樣式。
 */

const TOOL_ORDER = ["road", "res", "com", "ind", "park", "power", "info"];

export function setupToolbar({ onTogglePause, onNew }) {
	const buttons = [...document.querySelectorAll(".tool[data-tool]")];
	let tool = "road";

	function sync() {
		buttons.forEach((b) => b.classList.toggle("active", b.dataset.tool === tool));
	}

	function selectTool(next) {
		tool = next;
		sync();
	}

	buttons.forEach((b) => (b.onclick = () => selectTool(b.dataset.tool)));
	document.querySelector("#pause").onclick = onTogglePause;
	document.querySelector("#new").onclick = () => {
		if (confirm("重新開始一座城市？")) onNew();
	};

	sync();
	return { getTool: () => tool, selectTool, TOOL_ORDER };
}
