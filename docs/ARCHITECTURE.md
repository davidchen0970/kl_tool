# Architecture

Mini City Builder 從單一 HTML 檔重構為 ES module 專案，負責分層與 `RedmineTemplateEditor` 對齊。

## 依賴方向

```
main ──▶ app ──▶ ui ──▶ core
  │         └──────┘ ▲
  └───────────────────┘
```

- `core` 完全不依賴 DOM / UI，可獨立測試。
- `ui` / `app` 依賴 `core` 提供的純函式。
- `main.js` 是唯一的組合根（composition root），負責注入依賴。

## 模組職責

| 模組 | 職責 | 依賴 |
| --- | --- | --- |
| `core/constants.js` | 地圖尺寸、建造成本、色票、可成長分區 | 無 |
| `core/state.js` | 城市狀態與地圖操作（放置 / 拆除 / 電力 / 鄰路） | constants |
| `core/simulate.js` | 每月模擬：人口、成長、滿意度、稅收 | state, constants |
| `ui/camera.js` | 縮放 / 平移、螢幕座標 ↔ 地圖座標 | constants |
| `ui/renderer.js` | canvas 繪製地圖與滑鼠高亮、DPR resize | core, camera |
| `ui/hud.js` | 頁首數值、暫停文字、Toast 提示 | core |
| `ui/input.js` | 滑鼠 / 觸控繪製與拆除、滾輪縮放、鍵盤 | camera |
| `app/toolbar.js` | 工具列切換、暫停、新城市 | 無（DOM） |
| `app/loop.js` | requestAnimationFrame 模擬 tick | getCity / onTick |
| `main.js` | 組裝上述模組並啟動 | 全部 |

## 狀態流

- 城市狀態是一個純資料物件 `city = { grid, money, pop, happy, month, year, paused }`。
- `core/*` 提供純函式變更狀態並回傳結果碼（例如 `place()` 回傳 `"ok" | "no-money" | "blocked" | "offmap"`）。
- `main.js` 依結果碼決定是否 `hud.toast(...)` 與 `renderer` 是否需要更新。
- `renderer.js` 透過注入的 `getCity` 讀寫時狀態，自己用 rAF 持續繪製。

## 為何這樣拆

- **side-effect 與邏輯分離**：所有規則集中在 `core`，方便 `test/` 用 `node --test` 直接驗證。
- **可測試**：`npm test` 涵蓋 `state` 與 `simulate`。
- **與隔壁專案對齊**：`assets/styles`、`docs/`、`test/`、`package.json`、`.editorconfig` 命名與佈局沿用同一套約定。

## 未拆出來（刻意）

- 各 `ui/*`、`app/*` 模組仍是小型 IIFE 式容器的簡化版本，只做單一職責；尚未像 Redmine 專案引入 i18n、localStorage 持久化、多份文件管理等。
