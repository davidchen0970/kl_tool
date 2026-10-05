/**
 * 核心常數與靜態設定 — 地圖尺寸、建築成本、色票、可成長分區。
 */

export const GRID_W = 32;
export const GRID_H = 24;

/** 各工具的建造成本。 */
export const COSTS = {
	road: 40,
	res: 90,
	com: 120,
	ind: 140,
	park: 350,
	power: 1500,
};

/** 地圖色票（以 tile type 對應顏色）。 */
export const COLORS = {
	empty: "#5c9e51",
	road: "#626b76",
	res: "#46c86d",
	com: "#478fe2",
	ind: "#dcad3d",
	park: "#15995d",
	power: "#a458d0",
};

/** 會隨時間成長的分區（住宅 / 商業 / 工業）。 */
export const GROWABLE = ["res", "com", "ind"];

/** 放置後即為完整的物件（道路/公園/電廠）。 */
export const INSTANT = ["road", "park", "power"];
