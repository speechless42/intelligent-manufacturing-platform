---
目的: plan — 定義「設備 Alarm Code 分析平台」怎麼做（技術棧、架構、驗證方式），承接 [[spec]] 的「做什麼/為什麼」
關聯: "[[spec]]"、"[[claude]]"
---

# Implementation Plan: 設備 Alarm Code 分析平台

**Branch**: `001-equipment-alarm-analysis` | **Date**: 2026-09-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-equipment-alarm-analysis/spec.md`

## Summary

一個純前端、無後端、無持久化的單頁 Web 互動作品：使用者按下「隨機產生」或選擇特定情境，即時從一份固定的 Alarm 目錄（10-15 種）抽樣出 7 天份量的合成 Alarm 事件與伴隨遙測參數，前端自行完成分類推論、派工/升級規則判斷、良率影響呈現，並用圖表與少量動畫展示分析邏輯。技術上採「先用 Claude Artifact 快速做出可互動雛形（驗證動畫與圖表手感）→ 確認方向後把同一套邏輯落地成這個 repo 底下的原始碼」的兩階段作法，兩者共用同一份資料/邏輯設計，最終原始碼可再部署到 GitHub Pages 之類的靜態託管。畫面互動邏輯用 Vue 3（作者日常慣用的框架）撰寫，但刻意不使用需要建置工具的 SFC/Vite 流程，改用 Vue 3 官方的全域建置版（global build）＋選項式元件（template 字串），確保同一份程式碼能同時在 Claude Artifact（僅允許 CDN `<script>`、無建置環境）與本機瀏覽器直接執行。

## Technical Context

**Language/Version**: HTML5 + Vue 3（CDN 全域建置版，`vue.global.js`）＋ CSS3；不使用 Vite/Nuxt 等建置工具、不使用 `.vue` 單檔元件，元件以 JS 物件（`template` 字串 + `data`/`computed`/`methods`，或 Composition API 的 `setup()`）撰寫，直接以 `<script>` 載入

**Primary Dependencies**: Vue 3（畫面狀態管理與元件化，作者日常熟悉的框架）、Vue Router 4（介紹頁／資料頁的分頁導覽，2026-09-06 迭代新增，同樣用 CDN 全域建置版，`createWebHashHistory` 不需伺服器端路由設定）、Chart.js（統計圖表：長條圖/折線圖呈現 Alarm 名稱與次數、遙測趨勢）、Anime.js（畫面互動的小動畫，例如分類結果出現、派工標籤變化的過場效果），皆透過 CDN（cdnjs 優先，Vue／Vue Router 用 jsdelivr 的 `/npm/vue@3/dist/vue.global.js`、`/npm/vue-router@4/dist/vue-router.global.prod.js`）載入

**Storage**: N/A — 依 spec.md FR-012，不持久化任何產生的資料，所有狀態僅存在於當次頁面的記憶體（JS 變數）中

**Testing**: 手動驗收測試，逐條對照 spec.md 的 Acceptance Scenarios 與 Success Criteria 檢查；因屬靜態展示型作品、無長期維運需求，本階段不引入自動化測試框架（可作為未來加強項，見 Complexity Tracking 下方說明）

**Target Platform**: 現代桌面瀏覽器（Chrome/Edge/Safari 最新版）；行動裝置版面非本次必要範圍

**Project Type**: 純前端單頁應用（single-page web application，無後端）

**Performance Goals**: 對應 SC-001，「隨機產生」觸發後 5 秒內完成資料生成、分類推論與圖表渲染

**Constraints**: 不串接任何後端/資料庫；僅能使用 Claude Artifact 允許清單內的 CDN（cdnjs、jsdelivr 等）載入外部函式庫，以確保 Artifact 版本與 repo 版本行為一致；不需離線可用

**Scale/Scope**: 單頁面、單一使用者（無多人協作/多帳號情境）；Alarm 目錄約 10-15 種、單次生成的 7 天份量事件數預估數十到約 150 筆量級

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` 目前仍是初始範本（尚未填入專案專屬原則），因此本階段沒有額外的治理閘門需要檢查。若之後想針對本專案訂立原則（例如「文件必須寫明目的與關聯」這類已經在 [[claude]] 中口頭約定的規則），可另外執行 `/speckit-constitution` 補上，不影響本次 plan 的進行。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
web/
├── index.html            # 單頁進入點：版面骨架、載入 Vue / Vue Router / Chart.js / Anime.js CDN、掛載 #app
├── styles.css            # 版面與動畫用到的樣式
└── src/
    ├── data/
    │   ├── alarm-catalog.js      # 固定的 10-15 種 Alarm 目錄定義（代號、名稱、可能根因方向）
    │   └── material-lot-risk.js  # 材料批號風險清單的靜態展示資料
    ├── scenarios/
    │   └── scenario-profiles.js  # 5 種情境設定（含隨機）的資料生成規則參數
    ├── logic/
    │   ├── generate-events.js    # 依情境規則從目錄抽樣出 7 天份量的 Alarm 事件與遙測快照（純函式，不依賴 Vue）
    │   ├── classify.js           # 根因分類推論（部品/機構/曖昧推測理由）＋材料回報覆寫邏輯（純函式）
    │   └── dispatch-rules.js     # 派工/升級規則（含「平均次數 2 倍」異常高頻判斷）與良率等級換算（純函式）
    ├── charts/
    │   └── render-charts.js      # 包裝 Chart.js，畫出 Alarm 次數統計與遙測趨勢圖；供 Vue 元件在 mounted/watch 時呼叫
    ├── components/
    │   ├── AlarmTable.js          # Vue 元件：Alarm 清單/統計圖表呈現
    │   ├── AlarmDetailPanel.js    # Vue 元件：曖昧 Alarm 的推測分類理由、回報材料問題按鈕
    │   ├── MaterialLotRiskList.js # Vue 元件：材料批號風險清單
    │   └── ScenarioSelector.js    # Vue 元件：隨機產生／情境選擇的操作區
    ├── store.js                   # 共用狀態（events/選中情境/選中事件等）與 regenerate 等 action，介紹頁與資料頁共用（2026-09-06 迭代新增）
    ├── views/
    │   ├── HomeView.js            # 介紹頁：作品說明、分類圖例、材料批號風險總覽（2026-09-06 迭代新增）
    │   └── DataView.js            # 資料頁：隨機產生/情境選擇、統計摘要、Alarm 圖表與清單（2026-09-06 迭代新增）
    ├── router.js                  # Vue Router 設定（hash history，`/home`、`/data` 兩個路由，2026-09-06 迭代新增）
    └── app.js                     # 根 Vue 元件（`Vue.createApp`）：固定頁首/導覽列 + `<router-view>`，實際內容交給 views/
```

**Structure Decision**: 採單一純前端專案結構（上方 `web/` 目錄），不使用 backend/frontend 分離的 Option 2、也不需要 Option 3 的行動裝置專屬結構，因為 spec.md 已明確排除後端與真實系統整合。`logic/` 底下的分類、派工、資料生成規則刻意寫成不依賴 Vue 的純函式，只回傳資料，讓 `/speckit-tasks` 拆任務與之後寫測試時可以獨立驗證，不用啟動整個 Vue 元件樹；`components/` 是可重用的畫面元件，`views/` 是掛在路由上的頁面（組裝 `components/` + 讀寫 `store.js`），`app.js` 只剩下固定頁首與 `<router-view>` 出口。Claude Artifact 版本的雛形會先在 Artifact 平台上以單一 HTML 檔（內嵌或 `<script>` 引用同樣的 `logic/`、`components/`、`views/` 程式碼）驗證動畫/圖表手感，方向確認後再把同一套 `src/` 檔案搬進本目錄，兩邊共用一致的程式碼，避免重工。

## Complexity Tracking

Constitution Check 沒有違規項目（尚無正式 constitution）。雖然這次改用 Vue 3 而非最初規劃的純原生 JS，但刻意選擇「CDN 全域建置版、無 SFC、無建置工具」的用法，複雜度增量僅止於「多一個框架的學習/心智模型」，沒有引入建置流程、打包工具或額外的部署步驟，因此不視為需要在此表格特別論證的違規項目。
