# Mini City Builder

一個精簡的城市建造小遊戲：鋪道路、蓋住宅/商業/工業、建公園與電廠，讓城市隨時間成長、徵稅並維持治安與電力。

原先所有程式碼（HTML / CSS / JS）都塞在同一個檔內，現在已拆成與 `RedmineTemplateEditor` 相同風格的 ES module 專案結構。

## 如何執行

屬於純前端、使用 ES Module，**不能直接用 `file://` 開啟**，需要本機靜態伺服器：

```bash
# 方式一：npm
npm run serve          # http-server 於 :8080

# 方式二：python
python -m http.server 8080
```

然後開啟 <http://localhost:8080>。

## 玩法

- **左鍵** 建造、**右鍵** 拆除、**Space** 暫停、**1–6** 切換工具、滾輪縮放。
- 住宅 / 商業 / 工業必須緊鄰道路才會發展。
- 發展需要足夠電力（一座電廠供 80 電力）。
- 公園可提高滿意度，工業超過公園兩倍會拖累滿意度。
- 稅收來自人口、商業與工業。

## 專案結構

```
assets/styles/main.css   # 版面樣式
index.html              # 結構（只掛 CSS 與 src/main.js）
src/
  main.js              # 進入點：組裝各模組並啟動
  core/               # 純邏輯，不碰 DOM
    constants.js       # 地圖尺寸、成本、色票、分區清單
    state.js          # 狀態 / 地圖操作 / 放置、拆除、電力
    simulate.js       # 每月模擬（人口、成長、滿意度、稅收）
  ui/                # 介面
    camera.js         # 縮放平移與座標換算
    renderer.js       # canvas 繪製與 DPR
    hud.js           # 頁首數值與 Toast
    input.js         # 滑鼠 / 觸控 / 鍵盤 / 滾輪
  app/               # 組合與迴圈
    toolbar.js       # 工具列、暫停、新城市
    loop.js          # requestAnimationFrame 主迴圈
test/                # Node 內建測試（npm test）
docs/                # 設計說明
```

依賴方向：`main → app / ui → core`（`core` 不依賴任何 UI）。

## 開發（測試）

純邏輯集中在 `src/core/*`，用 Node 內建測試：`npm test`（即 `node --test`）。

## Source structure

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for module responsibilities and dependency direction.
