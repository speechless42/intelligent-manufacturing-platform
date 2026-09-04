---
目的: tasks — 把 plan.md 的架構拆成可逐一執行的實作任務（Phase 2 產出），供 /speckit-implement 使用
關聯: "[[plan]]"、"[[spec]]"
---

# Tasks: 設備 Alarm Code 分析平台

**Input**: Design documents from `specs/001-equipment-alarm-analysis/`

**Prerequisites**: [plan.md](plan.md)（必要）、[spec.md](spec.md)（必要，使用者故事）、[data-model.md](data-model.md)、[research.md](research.md)、[quickstart.md](quickstart.md)

**Tests**: spec.md 未要求 TDD／自動化測試，依 research.md 的決策採手動驗收（見 Polish 階段的 quickstart 驗證任務），本清單不包含自動化測試任務。

**Organization**: 任務依 spec.md 的使用者故事分組（US1～US4，依優先權 P1→P4），每個故事都能獨立實作與驗證。

## Format: `[ID] [P?] [Story] Description`

- **[P]**：可平行執行（不同檔案、無相依）
- **[Story]**：對應 spec.md 的使用者故事（US1、US2、US3、US4）
- 每個任務都附上明確檔案路徑（對應 plan.md 的 Project Structure）

## Path Conventions

單一純前端專案，所有原始碼在 `web/` 底下（見 plan.md 的 Project Structure），沒有 `backend/`、`tests/` 目錄。

---

## Phase 1: Setup（專案初始化）

**Purpose**: 建立目錄骨架與頁面進入點，還不含任何 Alarm 分析邏輯

- [x] T001 依 plan.md 的 Project Structure 建立目錄骨架：`web/`、`web/src/data/`、`web/src/scenarios/`、`web/src/logic/`、`web/src/charts/`、`web/src/components/`
- [x] T002 [P] 建立 `web/index.html`：以 `<script>` 載入 Vue 3 全域建置版（jsdelivr `/npm/vue@3/dist/vue.global.js`）、Chart.js（cdnjs）、Anime.js（cdnjs），加入 `#app` 掛載點與 `styles.css`、`src/app.js` 的載入順序
- [x] T003 [P] 建立 `web/styles.css`：基礎版面（頁首、Alarm 清單區、詳情面板區、情境選擇區的版面骨架與間距、字體）

**Checkpoint**: 開啟 `web/index.html` 應該能看到空白頁面骨架，瀏覽器主控台沒有 CDN 載入錯誤。

---

## Phase 2: Foundational（所有使用者故事的共用基礎，必須先完成）

**Purpose**: 建立 Alarm 目錄、資料生成、分類、派工這條核心資料管線，是後面每個使用者故事都要用到的地基

**⚠️ CRITICAL**: 這個 Phase 完成前，不要開始任何使用者故事的任務

- [x] T004 [P] 依 [data-model.md](data-model.md) §1 建立固定 Alarm 目錄（10-15 筆，含 `code`/`name`/`possibleRootCauses`/`telemetryBaseline`）於 `web/src/data/alarm-catalog.js`
- [x] T005 [P] 依 [data-model.md](data-model.md) §2 建立材料批號風險靜態清單（`lotId`/`riskType`/`recommendedAction`/`riskLevel`）於 `web/src/data/material-lot-risk.js`
- [x] T006 [P] 依 [data-model.md](data-model.md) §3 與 spec.md 的 5 種情境描述，建立 6 個 ScenarioProfile（5 種預定義 + `random`）於 `web/src/scenarios/scenario-profiles.js`
- [x] T007 實作 `web/src/logic/generate-events.js`：依傳入的 ScenarioProfile，從 Alarm 目錄與材料批號清單抽樣出一批 AlarmEvent（含 TelemetrySnapshot），純函式、不依賴 Vue（依賴 T004、T005、T006）
- [x] T008 實作 `web/src/logic/classify.js`：依 FR-003～FR-005，對每筆 AlarmEvent 做根因分類；曖昧 Alarm（`possibleRootCauses.length === 2`）需依真空度趨勢／Bond Force 嚴重度產生 `classificationReason`，並記錄 `systemInitialGuess`（依賴 T007）
- [x] T009 實作 `web/src/logic/dispatch-rules.js`：依 FR-008 計算 `dispatchTarget`（機構/材料一律主管們；部品問題次數 ≥ 本次平均次數 2 倍也主管們），並依 spec.md Assumptions 計算 4 級 `YieldImpactLevel`（依賴 T008）
- [x] T010 實作 `web/src/app.js`：Vue 3 `createApp` 根元件，持有共用狀態（目前這批 `events`、`materialLotRisks`、`selectedScenario`），提供 `regenerate(scenarioId)` method 串接 T007→T008→T009（依賴 T007、T008、T009）

**Checkpoint**: 地基完成——雖然還沒有畫面元件，但可以在瀏覽器主控台手動呼叫 `regenerate()` 並印出結果，確認資料管線正確。

---

## Phase 3: User Story 1 - 產生並檢視 7 天 Alarm 統計與分類 (Priority: P1) 🎯 MVP

**Goal**: 使用者按「隨機產生」，看到 7 天份量 Alarm 的統計圖表、分類與派工標示

**Independent Test**: 開啟頁面、點擊「隨機產生」，確認圖表與分類/派工標示都正確顯示，且再次點擊會完全取代舊資料

### Implementation for User Story 1

- [x] T011 [P] [US1] 實作 `web/src/charts/render-charts.js`：包裝 Chart.js，提供依 AlarmEvent[] 畫出「各 Alarm 名稱次數」長條圖的函式
- [x] T012 [US1] 實作 `web/src/components/AlarmTable.js`（Vue 選項式元件，`template` 字串）：渲染 Alarm 清單（代號、名稱、分類、派工對象）並掛載 T011 的圖表（依賴 T010、T011）
- [x] T013 [US1] 在 `web/index.html` / `web/src/app.js` 加上「隨機產生」按鈕與初始空狀態提示（Edge Case），點擊後呼叫 `app.js` 的 `regenerate('random')` 並更新畫面（依賴 T010、T012）
- [x] T014 [US1] 在 `AlarmTable.js` 對機構問題/主管們派工的列加上明顯樣式（例如標籤顏色），確認 FR-008 的規則在畫面上可辨識（依賴 T012）

**Checkpoint**: User Story 1 應可獨立完整運作與展示。

---

## Phase 4: User Story 2 - 檢視曖昧 Alarm 的推測分類與理由 (Priority: P2)

**Goal**: 點開曖昧 Alarm 能看到「推測分類 + 簡短理由」，而非黑盒標籤

**Independent Test**: 在 US1 產生的資料中點開一筆曖昧 Alarm，確認理由文字有引用遙測趨勢；點開一筆 Bond Force 輕微異常的 Alarm，確認顯示「正常調機漂移、不升級」

### Implementation for User Story 2

- [x] T015 [P] [US2] 實作 `web/src/components/AlarmDetailPanel.js`（Vue 元件）：顯示單筆 AlarmEvent 詳情，含 `classificationReason`（曖昧時）與 Bond Force 判定說明（依賴 T010）
- [x] T016 [US2] 在 `AlarmTable.js` 的每列加上點擊事件，開啟 `AlarmDetailPanel.js` 並傳入對應的 AlarmEvent（依賴 T012、T015）
- [x] T017 [US2] 用 Anime.js 為 `AlarmDetailPanel.js` 加上開啟/理由文字出現的過場動畫（依賴 T015）

**Checkpoint**: User Story 1 + 2 應可同時獨立運作。

---

## Phase 5: User Story 3 - 回報材料問題並核對系統判斷 (Priority: P3)

**Goal**: 使用者可瀏覽材料批號風險清單，並對命中風險的 Alarm 回報為材料問題，看到系統原判斷與回報結果的比對

**Independent Test**: 開啟材料批號風險清單確認資料正確；對一筆命中風險的 Alarm 按「回報為材料問題」，確認分類與派工對象更新、且顯示比對訊息

### Implementation for User Story 3

- [x] T018 [P] [US3] 實作 `web/src/components/MaterialLotRiskList.js`（Vue 元件）：渲染 `material-lot-risk.js` 的完整清單，使用者可隨時瀏覽（依賴 T005、T010）
- [x] T019 [US3] 在 `web/src/logic/classify.js` 新增 `reportAsMaterialIssue(event)` 函式：將 `rootCauseClassification` 覆寫為 `材料問題-已回報`，保留原本的 `systemInitialGuess` 供比對（依賴 T008）
- [x] T020 [US3] 在 `AlarmDetailPanel.js` 加上「回報此次 Alarm 為材料問題」按鈕，呼叫 T019 並顯示「系統原判斷／使用者回報」比對訊息，同步觸發 `dispatch-rules.js` 重新計算 `dispatchTarget`（依賴 T009、T015、T019）
- [x] T021 [US3] 在 `AlarmTable.js` / `AlarmDetailPanel.js` 對 `materialLotRiskRef` 不為 null 的事件顯示風險命中提示（依賴 T005、T012）

**Checkpoint**: User Story 1、2、3 應可同時獨立運作。

---

## Phase 6: User Story 4 - 選擇特定情境模式產生資料 (Priority: P4)

**Goal**: 使用者可從 5 種預定義情境中選擇一種，產生符合情境特徵的資料

**Independent Test**: 選擇「機構緩慢退化」情境，確認 Pick up miss 次數遞增、真空度呈下降趨勢；選擇「正常運作」確認 Alarm 稀疏且無趨勢

### Implementation for User Story 4

- [x] T022 [P] [US4] 實作 `web/src/components/ScenarioSelector.js`（Vue 元件）：列出 5 種情境名稱 + 隨機選項供使用者選擇（依賴 T006、T010）
- [x] T023 [US4] 將 `ScenarioSelector.js` 的選擇結果串接到 `app.js` 的 `regenerate(scenarioId)`，取代/並存於 US1 的「隨機產生」按鈕（依賴 T007、T013、T022）

**Checkpoint**: 全部 4 個使用者故事應可同時獨立運作。

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事的收尾、動畫細節與最終驗收

- [x] T024 [P] 為 `render-charts.js` 的圖表渲染與 `AlarmTable.js` 的派工標籤變化加上 Anime.js 進場動畫
- [x] T025 [P] 在畫面上呈現 4 級良率影響等級（正常/輕微/中度/嚴重），依 `dispatch-rules.js` 算出的 `YieldImpactLevel` 顯示於頁面頂部摘要區
- [x] T026 依 [quickstart.md](quickstart.md) 的 5 個驗證場景逐條手動測試，修正發現的落差
- [x] T027 [P] 將 `web/src/` 的程式碼整理成單一 HTML 檔（內嵌或以 `<script>` 引用相同邏輯），發布為 Claude Artifact 雛形，對照 plan.md 的雙軌交付策略
- [x] T028 依專案慣例（見 [[claude]]），把本次實作的關鍵決策回頭補上「規格/任務 → 檔案:行號」的追溯註記

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**：無相依，可立即開始
- **Foundational (Phase 2)**：依賴 Setup 完成，**封鎖所有使用者故事**
- **User Stories (Phase 3-6)**：都依賴 Foundational 完成；彼此之間 US2/US3 會用到 US1 建立的 `AlarmTable.js`（點擊列開啟詳情），US4 會用到 US1 建立的 `regenerate` 觸發流程，因此建議依 P1→P2→P3→P4 順序實作，但每個故事完成後都應可獨立驗證
- **Polish (Phase 7)**：依賴所有想要的使用者故事完成

### Within Each User Story

- US1：圖表包裝（T011）先於元件（T012），元件先於畫面串接（T013），最後補樣式（T014）
- US2：元件（T015）可與 US1 平行開發，但串接（T016）需要 T012 完成
- US3：清單元件（T018）可提早開發，但回報邏輯（T020）需要 T015（詳情面板）已存在
- US4：選單元件（T022）可提早開發，但串接（T023）需要 T013 的 `regenerate` 觸發流程已存在

### Parallel Opportunities

- Setup 的 T002、T003 可平行
- Foundational 的 T004、T005、T006 可平行（不同檔案、無相依）
- Foundational 完成後，T011（US1 圖表）、T015（US2 詳情面板骨架）、T018（US3 清單）、T022（US4 選單）四個元件的「骨架」可平行開發，但各自的「串接」任務（T013、T016、T020、T023）仍需等對應的前置任務完成

---

## Parallel Example: Foundational Phase

```bash
# Foundational 資料層可同時進行：
Task: "建立固定 Alarm 目錄於 web/src/data/alarm-catalog.js"
Task: "建立材料批號風險清單於 web/src/data/material-lot-risk.js"
Task: "建立 6 個情境設定於 web/src/scenarios/scenario-profiles.js"
```

---

## Implementation Strategy

### MVP First（User Story 1 only）

1. 完成 Phase 1：Setup
2. 完成 Phase 2：Foundational（關鍵地基，封鎖所有故事）
3. 完成 Phase 3：User Story 1
4. **停下來驗證**：對照 [quickstart.md](quickstart.md) 場景 1 手動測試
5. 這時就已經是一個可以展示「Alarm 現象 → 分類 → 派工建議」核心邏輯的 MVP，可先拿去用 Claude Artifact 發布雛形（T027 可提前）

### Incremental Delivery

1. Setup + Foundational → 地基就緒
2. + User Story 1 → 獨立驗證 → 可展示的 MVP
3. + User Story 2 → 獨立驗證 → 加上「系統怎麼想」的說服力
4. + User Story 3 → 獨立驗證 → 加上材料問題的人機協作亮點
5. + User Story 4 → 獨立驗證 → 加上情境選單，方便面試時主動展示特定案例
6. Polish → 動畫細節、良率呈現、正式 quickstart 驗收、Artifact 發布

---

## Phase 8: 迭代二 — 使用者體驗回饋（2026-09-05，對應 spec.md FR-014～FR-017）

**Purpose**: 作者實際玩過第一版 Artifact 雛形後回饋的 4 個真實功能缺口，補進 spec.md 後在此落地

- [x] T029 [P] 在 `web/src/app.js` 的頁首下方加入「這是什麼」說明段落與分類色卡圖例（FR-014）
- [x] T030 [P] 為 `web/src/data/alarm-catalog.js` 每一筆 Alarm 目錄項目加上 `description` 白話描述欄位（FR-015），並在 `web/src/logic/generate-events.js` 把此欄位複製到產生的 AlarmEvent 上
- [x] T031 [US2] 在 `web/src/components/AlarmDetailPanel.js` 顯示 Alarm 的 `description`，並在 `web/src/components/AlarmTable.js` 的名稱欄加上 `title` 提示，滑鼠停留即可看到說明（FR-015）
- [x] T032 [US2] 重寫 `AlarmDetailPanel.js` 的伴隨機台參數區塊：每項數值都附一行白話說明（尤其「累積動作次數」，說明次數越高代表磨損風險越高）（FR-016）
- [x] T033 [US3] 重寫 `web/src/components/MaterialLotRiskList.js`：改為接收 `events` prop，依批號計算本次資料中的命中次數與命中明細，並提供展開檢視（FR-017）
- [x] T034 在 `web/src/app.js` 把 `:events="events"` 傳入 `MaterialLotRiskList`，串接 T033 的資料連動
- [x] T035 [P] 更新 `web/styles.css`：新增說明區塊、圖例、批號卡片、遙測說明列的樣式，沿用既有雙主題 token

**Checkpoint**: 用 Playwright 重新跑過一次完整互動流程（含材料批號展開、Alarm 詳情），主控台無錯誤，畫面在淺色/深色主題下皆正常。

---

## Phase 9: 迭代三 — 分類理由修正與排序/彙總重寫（2026-09-06，對應 spec.md FR-005、FR-018、FR-019）

**Purpose**: 作者實測抓出的兩個問題：曖昧 Alarm 推理理由與 Alarm 本身物理性質不符、清單排序與呈現方式看不懂

- [x] T036 [P] 在 `web/src/data/alarm-catalog.js` 為 3 種曖昧 Alarm（E-01、E-02、E-11）各自加上 `reasoningSignal`（`vacuum`／`bondForce`／`cycleCount`），並在 `web/src/logic/generate-events.js` 複製到 AlarmEvent 上（FR-005）
- [x] T037 [US2] 重寫 `web/src/logic/classify.js`：依 `reasoningSignal` 分派到對應的推理函式（`reasonFromVacuum`／`reasonFromBondForce`／`reasonFromCycleCount`），修正先前所有曖昧 Alarm 一律套用真空度/Bond Force 理由的問題（FR-005）
- [x] T038 [US1] 修改 `web/src/charts/render-charts.js`：圖表依本批次數由高到低排序，不再依目錄固定順序（FR-018）
- [x] T039 [US1] 重寫 `web/src/components/AlarmTable.js`：從「逐筆事件流水帳」改為「依 Alarm 代號彙總」，依次數由高到低排序，每列可展開看個別事件；新增 `status`（單次發生／重複發生・持續觀察／重複發生・待商議）與分類次數彙總（FR-018、FR-019）
- [x] T040 [P] 更新 `web/styles.css`：新增彙總列、展開區、狀態徽章樣式，移除已不再使用的 `<table>` 相關樣式

**Checkpoint**: 用 Playwright 驗證圖表與清單排序一致（都依次數由高到低）、E-11 類事件的推測理由提到「累積動作次數」而非真空度、重複發生且含機構問題的代號正確標示「重複發生・待商議」。

---

## Phase 10: 迭代四 — 生產批次追蹤與 Alarm 目錄機台一致性（2026-09-06，對應 spec.md FR-020、FR-021）

**Purpose**: 作者提出兩點：(1) 想知道同一個 Alarm 代號的多次發生分別落在哪個生產批次；(2) 以設備工程背景指出 Alarm 目錄混了打線機（Wire Bonder）跟黏晶機（Die Bonder）兩種不同機台的故障類型，不合理

- [x] T041 [P] 在 `web/src/logic/generate-events.js` 新增 `generateBatches`/`findBatch`：把 7 天窗口切成 4-10 個生產批次，每筆事件依 `timestampOffset` 歸屬到一個批次（`batchId`/`batchLabel`）（FR-020）
- [x] T042 [US1] 在 `web/src/components/AlarmTable.js` 的 `summaryRows` 加上 `batchCounts`/`batchSpan`，畫面顯示「跨 N 批」與批次分布明細；展開的個別事件列也顯示所屬批次（FR-020）
- [x] T043 [US2] 在 `web/src/components/AlarmDetailPanel.js` 的標頭顯示事件所屬批次
- [x] T044 [P] 修正 `web/src/data/alarm-catalog.js`：把 E-07/E-08/E-09 從打線機專屬故障類型（USG 訊號、夾線裝置、EFO 點火）換成黏晶機製程範圍內的故障類型（頂針卡滯、點膠量異常、晶圓膜破損），維持原本的 `possibleRootCauses`（單一部品問題）不變，不需調整 `scenarios/scenario-profiles.js` 的權重設定（FR-021）
- [x] T045 [P] 更新 `web/styles.css`：新增批次分布、批次標籤的樣式

**Checkpoint**: 用 Playwright 確認畫面文字不再出現「USG」「Wire clamp」「EFO」；展開任一重複發生的 Alarm 代號，能看到每筆事件所屬批次與「跨 N 批」摘要。

---

## Phase 11: 迭代五 — 派工標籤去重與雙頁面導覽（2026-09-06，對應 spec.md FR-022、FR-023）

**Purpose**: 作者提出兩點：(1) 展開的事件明細中，同一代號的派工對象在每一筆都重複顯示，太雜；(2) 希望拆成「介紹」與「資料」兩個可導覽的頁面，共用同一份資料狀態

- [x] T046 [US1] 修改 `web/src/components/AlarmTable.js`：展開明細的個別事件列拿掉重複的派工對象徽章，只在彙總列的標題顯示一次（FR-023）
- [x] T047 [P] 新增 `web/src/store.js`：把原本在 `app.js` 的共用狀態（`events`/`selectedScenario`/`selectedEvent` 等）與 `regenerate`/`reportMaterial`/`openDetail`/`closeDetail` 抽出成獨立 store，供介紹頁與資料頁共用（FR-022）
- [x] T048 [P] 新增 `web/src/views/HomeView.js`（介紹頁：作品說明、分類圖例、材料批號風險總覽）與 `web/src/views/DataView.js`（資料頁：隨機產生/情境選擇、統計摘要、Alarm 圖表與清單），皆從 `AlarmApp.store` 讀寫共用狀態（FR-022）
- [x] T049 新增 `web/src/router.js`：用 Vue Router 的 `createWebHashHistory` 設定 `/home`、`/data` 兩個路由，不需伺服器端路由設定即可在本機檔案與 Artifact 皆正常運作（FR-022）
- [x] T050 重寫 `web/src/app.js`：根元件只保留固定頁首與導覽列（`router-link` 切換介紹/資料），實際內容交給 `<router-view>`
- [x] T051 更新 `web/index.html`：新增 Vue Router CDN `<script>`（需在 Vue 之後、其餘應用程式碼之前載入），並依相依順序載入 `store.js`、`views/*.js`、`router.js`
- [x] T052 [P] 更新 `web/styles.css`：新增導覽列（`.top-nav`）與頁面容器樣式

**Checkpoint**: 用 Playwright 確認：介紹頁與資料頁可透過導覽列/連結互相切換；在資料頁產生資料後切到介紹頁，材料批號命中次數正確反映剛產生的那批資料；切回資料頁，圖表/清單資料還在（沒有因為切頁而重置）；展開的事件明細不再重複顯示派工對象徽章。

---

## Notes

- 沒有自動化測試任務：依 research.md 的決策，本專案採手動驗收（Phase 7 的 T026），不引入 Jest/Playwright
- `[P]` 任務代表不同檔案、彼此無相依
- `[Story]` 標籤只出現在 Phase 3-6，Setup／Foundational／Polish 不掛故事標籤
- 每個使用者故事完成後都應該能獨立展示，不必等其他故事做完

## 規格與程式碼追溯（`/speckit-implement` 完成後補）

依專案慣例（見 [[claude]]），把規格階段的關鍵決策回頭對應到實際落地的程式碼位置：

- Alarm 目錄固定清單（Clarifications 第 1 題）→ `web/src/data/alarm-catalog.js:8`
- 曖昧 Alarm 分類推論（FR-004、FR-005）→ `web/src/logic/classify.js:8`（`classifyOne`）
- 使用者回報材料問題、保留系統原判斷（FR-007）→ `web/src/logic/classify.js:49`（`reportAsMaterialIssue`）
- 派工升級規則：機構/材料一律升級 + 部品異常高頻（平均 × 2，Clarifications 第 2 題）→
  `web/src/logic/dispatch-rules.js:9`（`applyDispatchRules`）、門檻判斷在 `dispatch-rules.js:24`
- 良率影響 4 級換算（Assumptions）→ `web/src/logic/dispatch-rules.js:41-48`
- 頁面開場即載入範例資料（design 慣例：不開空殼頁面）→ `web/src/app.js:62`（`regenerate('normal')`）
- 派工/分類/資料生成串接主流程 → `web/src/app.js:25`（`regenerate`）

實作過程中發現、且修正了規格階段未預料到的問題（記錄於此供之後回顧「為什麼這樣調」）：

- 「平均次數 × 2」的異常高頻門檻，在事件量偏低（原規劃 10-40 筆）時會被單一代號的隨機波動誤觸發，
  導致「正常運作」情境也大量升級給主管們。修正：情境事件量整體拉高到 25-75 筆（見 `scenario-profiles.js`），
  並在 `dispatch-rules.js:24` 額外要求絕對次數 ≥ 5 才算異常高頻，避免小樣本雜訊誤判。
- 各情境的 `catalogWeighting` 原本讓「純機構代號」在所有情境都保留一定權重，導致「正常運作」「部品隨機老化」
  情境也出現大量機構問題，不符合情境敘述。修正：依情境重新設計權重，讓純機構代號在非機構相關情境中的權重
  壓到接近 0（見 `scenario-profiles.js` 各 profile 的註解）。
- 良率影響等級原本用「機構/材料占比 + 總數門檻」雙條件，但總數門檻在拉高事件量後永遠成立，導致「正常運作」
  永遠無法呈現「正常」等級。修正：良率等級改為單純依機構/材料占比計算（`dispatch-rules.js:41-48`）。
- Chart.js 圖表在使用者連續切換情境時，偶爾會因為前一個實例的進場動畫影格在畫布重建後才觸發而噴錯
  （`Cannot read properties of null (reading 'save')`）。修正：關閉 Chart.js 內建動畫（`render-charts.js` 的
  `animation: false`），圖表本身的進場效果改由 Anime.js 處理表格列。

**迭代二（2026-09-05，FR-014～FR-017）追溯**：

- 頁面說明段落與分類色卡圖例（FR-014）→ `web/src/app.js:87`（`<section class="intro">`）
- Alarm 白話描述（FR-015）→ `web/src/data/alarm-catalog.js:13` 起每筆的 `description` 欄位；
  顯示於 `web/src/components/AlarmDetailPanel.js` 的 `alarm-description` 段落
- 伴隨機台參數白話說明（FR-016）→ `web/src/components/AlarmDetailPanel.js:67` 起的 `t-hint`
- 材料批號風險與本批命中狀況連動（FR-017）→ `web/src/components/MaterialLotRiskList.js:13`
  （`lotsWithStats` computed）；`web/src/app.js` 傳入 `:events="events"` 觸發連動
- 規格文件同步：`data-model.md` 修正了 `rootCauseClassification` 枚舉（拿掉未實際使用的
  `材料問題-待確認` 中間態）與 `YieldImpactLevel` 的計算依據（拿掉總數門檻），讓文件跟實作一致

**迭代三（2026-09-06，FR-005/FR-018/FR-019）追溯**：

- 曖昧 Alarm 依物理性質分派推理（FR-005）→ `web/src/logic/classify.js:11`（`reasonFromVacuum`）、
  `:26`（`reasonFromBondForce`）、`:47`（`reasonFromCycleCount`）、`:63`（`classifyOne` 分派邏輯）
- 圖表依次數排序（FR-018）→ `web/src/charts/render-charts.js:17`（`sortedCatalog`）
- 清單依代號彙總＋排序＋重複發生狀態（FR-018、FR-019）→ `web/src/components/AlarmTable.js:19`
  （`summaryRows` computed）

這次的根本原因：先前設計 `reasonFromVacuum`/`reasonFromBondForce` 這類推理邏輯時，
只考慮了「Pick up miss」「Bond force out of range」兩種曖昧 Alarm（兩者都真的跟真空/力道有關），
後來新增「Leadframe transport jam」當第三種曖昧 Alarm 時，忘記它是傳送機構問題、跟真空無關，
沿用了舊的判斷函式。教訓：之後如果要再加曖昧 Alarm，要先想清楚「這個 Alarm 該用哪個遙測參數
判斷才合理」，不能預設共用同一套推理。

**迭代四（2026-09-06，FR-020/FR-021）追溯**：

- 生產批次切分與歸屬（FR-020）→ `web/src/logic/generate-events.js:32`（`generateBatches`）、
  `:48`（`findBatch`）
- 批次分布彙總（FR-020）→ `web/src/components/AlarmTable.js:53`（`batchCounts`/`batchSpan`）
- Alarm 目錄機台一致性修正（FR-021）→ `web/src/data/alarm-catalog.js`（E-07/E-08/E-09）

這次的根本原因：一開始（`/speckit-plan` 前的查證階段）參考「同類設備公開手冊」時，
把 TPT HB16、F&S Bondtec 這兩份**打線機**手冊的故障類別，跟黏晶機的故障類別混在同一份研究筆記
（見 [research.md](research.md)、[[claude]]）裡，沒有先確認「這些手冊描述的到底是不是同一種設備」，
就直接拿來當 Alarm 目錄的命名基礎。教訓：引用外部參考資料做命名/分類基礎時，要先確認參考來源
彼此之間屬於同一個範疇（這裡是「同一種設備」），不能只看故障類型名稱聽起來合不合理就採用。

**迭代五（2026-09-06，FR-022/FR-023）追溯**：

- 派工對象去重（FR-023）→ `web/src/components/AlarmTable.js` 的 `summary-row-detail` 區塊
  （移除個別事件列的 dispatch badge，只留彙總列的一個）
- 共用狀態 store（FR-022）→ `web/src/store.js:60`（`window.AlarmApp.store`）
- 路由設定（FR-022）→ `web/src/router.js:8`（`createRouter`，`createWebHashHistory`）
- 介紹頁／資料頁（FR-022）→ `web/src/views/HomeView.js:7`、`web/src/views/DataView.js:7`
