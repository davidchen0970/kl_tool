/**
 * 音效 — 以 WebAudio 即時合成短暫嗶聲，不依賴任何音檔。
 *
 * AudioContext 採「惰性建立」：只在首次使用者手勢（pointerdown / keydown）後
 * 才建立，以滿足瀏覽器 autoplay 政策。所有播放呼叫皆包在 try/catch，
 * 缺 WebAudio 或任何錯誤都不會打斷遊戲。
 *
 * 靜音偏好以 localStorage 保存；本檔不碰 document（除非呼叫端建立按鈕事件），
 * 純邏輯測試不需要載入本檔。
 */

/** localStorage 的靜音偏好金鑰（"1" = 靜音）。 */
export const MUTE_KEY = "mini_city_builder:muted";

/** 讀取儲存的靜音偏好；缺值 / 錯誤一律視為未靜音。 */
export function loadMuted(storage = globalThis.localStorage) {
	try {
		return storage.getItem(MUTE_KEY) === "1";
	} catch {
		return false;
	}
}

/** 寫入靜音偏好；任何錯誤忽略。 */
export function saveMuted(value, storage = globalThis.localStorage) {
	try {
		storage.setItem(MUTE_KEY, value ? "1" : "0");
	} catch {
		/* 忽略：靜音偏好失敗不影響遊戲 */
	}
}

/**
 * 建立音效控制物件。
 * @param {() => boolean} [getMuted] 選用的偏好 getter（通常由呼叫端包一層讀取）；缺則讀自身內部狀態。
 * @returns 帶 place / bulldoze / build / event / victory / toggle / getMuted / setMuted 的物件。
 */
export function createSound(getMuted) {
	let ctx = null;
	let internalMuted = loadMuted();

	function isMuted() {
		return getMuted ? !!getMuted() : internalMuted;
	}

	function setMuted(value) {
		internalMuted = value;
		saveMuted(value);
	}

	/** 取得已建立或惰性建立的 AudioContext；不可用回傳 null。 */
	function ensure() {
		if (ctx) return ctx;
		const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
		if (!AC) return null;
		try {
			ctx = new AC();
		} catch {
			return null;
		}
		return ctx;
	}

	/** 播放一個簡短合成嗶聲；全部安全包住。 */
	function blip(freq, dur, kind, gain, delay = 0) {
		try {
			const c = ensure();
			if (!c || isMuted()) return;
			const osc = c.createOscillator();
			const g = c.createGain();
			osc.type = kind;
			osc.frequency.value = freq;
			const t0 = c.currentTime + delay;
			g.gain.setValueAtTime(0.0001, t0);
			g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
			osc.connect(g);
			g.connect(c.destination);
			osc.start(t0);
			osc.stop(t0 + dur + 0.03);
		} catch {
			/* 忽略：音效失敗不影響遊戲 */
		}
	}

	/** 要在首次使用者手勢時呼叫，讓 AudioContext 可恢復並真正出聲。 */
	function unlock() {
		try {
			const c = ensure();
			if (c && c.state === "suspended") c.resume();
		} catch {
			/* 忽略 */
		}
	}

	/** 成功放置 — 兩個上昇方波短嗶。 */
	function place() {
		blip(440, 0.09, "square", 0.1);
		blip(660, 0.12, "square", 0.1, 0.06);
	}

	/** 拆除 — 下降的鋸齒短嗶。 */
	function bulldoze() {
		blip(360, 0.14, "sawtooth", 0.09);
		blip(220, 0.16, "sawtooth", 0.09, 0.08);
	}

	/** 建築升級（levelUp）或一般建造。 */
	function build(levelUp = false) {
		if (levelUp) {
			blip(523, 0.1, "triangle", 0.12);
			blip(659, 0.1, "triangle", 0.12, 0.08);
			blip(784, 0.14, "triangle", 0.12, 0.16);
		} else {
			blip(520, 0.11, "triangle", 0.12);
		}
	}

	/** 每月事件（繁榮 / 火災等）— 兩音提醒。 */
	function event() {
		blip(300, 0.12, "sine", 0.14);
		blip(200, 0.2, "sine", 0.14, 0.06);
	}

	/** 達成勝利 — 明亮上揚琶音。 */
	function victory() {
		blip(523, 0.16, "triangle", 0.14);
		blip(659, 0.16, "triangle", 0.14, 0.1);
		blip(784, 0.16, "triangle", 0.14, 0.2);
		blip(1047, 0.3, "triangle", 0.15, 0.3);
	}

	/** 切換靜音並回傳新狀態。 */
	function toggle() {
		const next = !isMuted();
		setMuted(next);
		return isMuted();
	}

	// 注意：這個回傳的方法名稱刻意不用 getMuted，避免與 createSound(getMuted)
	// 的參數同名而遮罩掉 injected getter，導致 isMuted() 無限遞迴溢位。
	function getMutedState() {
		return isMuted();
	}

	return { place, bulldoze, build, event, victory, toggle, getMuted: getMutedState, setMuted, unlock };
}
