# 設備 Alarm 根因分析台（Intelligent Manufacturing Platform）

個人作品：模擬半導體封裝設備（黏晶機 / Die Bonder）的 Alarm Code 分析平台。
作者具傳統封裝設備工程背景（Hitachi DB800、Esec 2000 操作經驗），本作品用來練習並展示
「製造數據分析」所需的能力：不只是畫圖表，而是說明**為什麼這樣分類、為什麼這樣派工**。

**線上展示（GitHub Pages）**：https://REPLACE_WITH_USERNAME.github.io/intelligent-manufacturing-platform/
**互動雛形（Claude Artifact）**：https://claude.ai/code/artifact/4f744405-a14c-4117-afa8-2a1328dd3cf1

> 本專案沒有串接任何真實設備或資料庫。所有 Alarm 事件、機台參數、材料批號風險都是
> 依產業公開文獻整理出的通用故障類別，即時生成的合成資料，僅供分析邏輯展示之用。

## 這個作品在做什麼

按下「隨機產生」，即時生成一批（模擬 7 天份量的）設備 Alarm 事件，平台會：

- 依 Alarm 代號統計次數，並標示「單次發生 / 重複發生・持續觀察 / 重複發生・待商議」
- 將根因分成三類：**部品問題**（小問題）、**機構問題**（大問題）、**材料問題**（批號風險，需人工回報確認）
- 對曖昧 Alarm（例如 Pick up miss 可能是部品或機構問題）顯示「推測分類 + 推理依據」
  （真空度趨勢／Bond Force 異常／累積動作次數，依 Alarm 的物理性質分派對應邏輯）
- 依規則自動決定派工對象：一般部品問題 → 設備工程師；機構/材料問題或異常高頻 → 主管們
- 顯示每個 Alarm 代號橫跨幾個生產批次，幫助判斷「重複發生」是分散的正常波動還是集中的警訊
- 提供材料批號風險清單，並與當次生成的資料連動顯示實際命中次數

詳細的分類規則、資料生成邏輯與每一輪反覆修正的原因，記錄在 [claude.md](claude.md)（專案活文件）
與 [specs/001-equipment-alarm-analysis/](specs/001-equipment-alarm-analysis/)（spec-kit 規格、計畫、任務追溯）。

## 技術棧

純前端、無後端、無資料持久化：

- **Vue 3**（CDN 全域建置版，不使用建置工具/SFC，直接用 `<script>` 載入）
- **Vue Router 4**（hash history，介紹頁／資料頁兩頁導覽）
- **Chart.js**（Alarm 次數統計圖表）
- **Anime.js**（互動動畫）

選擇「CDN 全域版、無建置流程」是為了讓同一份程式碼可以同時在 Claude Artifact 沙箱與
GitHub Pages 靜態託管上直接執行，不需要 Node.js 建置步驟。詳細評估過程見
[research.md](specs/001-equipment-alarm-analysis/research.md)。

## 本機執行

不需要安裝任何套件或啟動伺服器，直接用瀏覽器開啟 [web/index.html](web/index.html) 即可。

## 專案文件結構

- [claude.md](claude.md) — 專案活文件：需求釐清過程、決策紀錄、每輪迭代的問題與修正
- [specs/001-equipment-alarm-analysis/](specs/001-equipment-alarm-analysis/) — spec-kit 產出的正式規格
  （spec.md / plan.md / research.md / data-model.md / quickstart.md / tasks.md）
- [web/](web/) — 原始碼（HTML / CSS / Vue 元件 / 分類與派工邏輯）

## 開發流程

本專案採用「先 grill 後 spec」的兩階段流程（用連續提問釐清需求，收斂後再用
[spec-kit](https://github.com/github/spec-kit) 產生正式規格與任務清單），並在每次使用者實測回饋後
同步更新程式碼與文件，詳見 claude.md。

## 授權與資料聲明

僅供作品展示與學習用途。所有 Alarm 代號、機台參數、批號風險資料皆為合成資料，
不對應任何真實機台的專屬代號或商業機密資訊。
