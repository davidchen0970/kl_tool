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

/** 分區可成長的最高等級。 */
export const MAX_LEVEL = 3;

/** 分區每個月的基礎成長機率（再乘上該區的需求倍率）。 */
export const GROWTH_CHANCE = 0.25;

/** 每級商業提供的就業機會。 */
export const JOBS_PER_COM = 4;

/** 每級工業提供的就業機會。 */
export const JOBS_PER_IND = 6;

/** 需求倍率的下限與上限（resMul / comMul / indMul 收斂區間）。 */
export const DEMAND_MIN = 0.5;
export const DEMAND_MAX = 1.6;

/** 需求倍率在「沒有相對應供需」時的低落基準（低於 DEMAND_MIN）。 */
export const DEMAND_STARVING = 0.45;
