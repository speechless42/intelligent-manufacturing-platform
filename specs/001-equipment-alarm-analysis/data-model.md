---
目的: plan 附屬產出 — 把 spec.md 的 Key Entities 展開成具體欄位與狀態轉移（Phase 1）
關聯: "[[plan]]"、"[[spec]]"
---

# Data Model: 設備 Alarm Code 分析平台

本文件把 [spec.md](spec.md) 的 Key Entities 展開為具體欄位定義，供 `/speckit-tasks` 拆解實作任務、以及日後對照程式碼時使用。所有實體都只存在於瀏覽器記憶體中（依 FR-012 不持久化），這裡的「欄位」對應到 JavaScript 物件的屬性，不是資料庫欄位。

## 1. AlarmCatalogEntry（Alarm 目錄項目）

固定清單，約 10-15 筆，程式啟動時就已定義好，不會變動（對應 [[spec]] 的 Clarifications 第 1 題）。
所有項目必須屬於同一種設備（本作品鎖定 BGA/LeadFrame 封裝的黏晶機/Die Bonder）的製程範圍
（FR-021，2026-09-06 迭代修正：原本混入了打線機/Wire Bonder 專屬的故障類型，已替換）。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `code` | string | 系統自定義代號，如 `E-01`，目錄內唯一 |
| `name` | string | 通用/模糊化名稱，如 `Pick up miss`（FR-013：不得對應真實機台代號） |
| `description` | string | 白話描述這個 Alarm 代表設備發生了什麼事（FR-015，2026-09-05 迭代新增），例如「設備嘗試吸取晶片/元件失敗」 |
| `possibleRootCauses` | string[]（列舉：`部品`、`機構`） | 長度 1 表示分類明確；長度 2（同時含部品與機構）表示這是刻意設計的曖昧 Alarm |
| `reasoningSignal` | string \| undefined（列舉：`vacuum`、`bondForce`、`cycleCount`） | 僅曖昧 Alarm 需要：指定用哪一項遙測參數推理分類，必須跟該 Alarm 的物理性質相關（FR-005，2026-09-06 修正：先前不分 Alarm 種類一律用真空度/Bond Force，導致「傳送卡料」類 Alarm 也顯示真空度理由） |
| `telemetryBaseline` | object | 該 Alarm 類型的遙測數值「正常範圍」基準，供 generate-events 依情境規則決定要不要讓數值偏離正常範圍 |

**驗證規則**：`code` 在目錄內必須唯一；`possibleRootCauses` 不可為空陣列。

## 2. MaterialLotRisk（材料批號風險紀錄）

固定的靜態展示資料（對應 Clarifications 第 3 題：需有獨立清單可瀏覽）。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `lotId` | string | 批號 ID |
| `riskType` | string | 風險類型，如「黏度過高」 |
| `recommendedAction` | string | 建議措施，如「冷藏 4 小時」 |
| `riskLevel` | string（列舉：`低`、`中`、`高`） | 風險等級 |

**驗證規則**：`lotId` 唯一。

## 3. ScenarioProfile（情境設定）

對應 spec.md 的 5 種預先定義情境 + 完全隨機，共 6 個 profile。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string（列舉：`normal`、`mechanism-decay`、`material-lot-hit`、`component-random-wear`、`mixed-ambiguous`、`random`） | 情境代號 |
| `label` | string | 顯示用名稱（如「機構緩慢退化」） |
| `eventVolumeRange` | [number, number] | 本次生成的 Alarm 事件總數範圍 |
| `catalogWeighting` | Record<code, number> | 各 Alarm 目錄項目被抽中的相對權重 |
| `telemetryTrendRules` | object | 例如「真空度隨時間下降的斜率範圍」「Bond Force 異常嚴重度分布」 |
| `materialLotHitProbability` | number（0-1） | 本次生成的事件命中材料批號風險的機率 |

**驗證規則**：`eventVolumeRange[0] <= eventVolumeRange[1]`；`materialLotHitProbability` 介於 0 與 1 之間。

## 3.5 ProductionBatch（生產批次）（FR-020，2026-09-06 迭代新增）

每次生成資料時，把模擬的 7 天時間窗口切成數個連續時段，代表「這一批 7 天資料裡實際跑了幾個生產批次」，數量依本次事件量抓 4-10 個之間的合理範圍。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | 本次生成範圍內唯一，如 `batch-1` |
| `label` | string | 顯示用名稱，如「第 1 批」 |
| `start` / `end` | number | 這個批次在 7 天窗口內的起訖時間點 |

**驗證規則**：同一次生成的所有批次時段首尾相接、覆蓋整個 0-7 範圍，不重疊。

## 4. TelemetrySnapshot（遙測快照）

附屬於單一 AlarmEvent，非獨立儲存的實體。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `vacuumLevel` | number | 真空度/吸力數值 |
| `vacuumTrend` | string（列舉：`stable`、`declining`） | 過去連續事件的真空度趨勢，`declining` 是判斷機構問題（管路漏氣）的依據 |
| `cumulativeCycleCount` | number | 累積動作次數（自上次保養以來） |
| `bondForceValue` | number | Bond Force/下壓力數值 |
| `bondForceSeverity` | string（列舉：`normal-drift`、`severe`） | 對應 FR-005：輕微偶發 vs 嚴重/頻繁 |
| `visionConfidenceScore` | number（0-1） | 影像辨識信心分數（合成模擬值，非真實 ML 推論） |

## 5. AlarmEvent（Alarm 事件）

核心實體，每次「隨機產生」或情境選擇會產出一批 AlarmEvent。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | 本次生成範圍內唯一 |
| `catalogRef` | string | 對應 `AlarmCatalogEntry.code` |
| `name` / `description` | string | 從 `AlarmCatalogEntry` 複製過來的名稱與白話描述（FR-015），方便畫面直接顯示不用另外查表 |
| `timestampOffset` | number | 在模擬 7 天窗口內的相對時間點（不對應真實日曆時間，FR-001） |
| `batchId` / `batchLabel` | string | 依 `timestampOffset` 落在哪個 `ProductionBatch` 區間決定（FR-020） |
| `telemetry` | TelemetrySnapshot | 見上 |
| `rootCauseClassification` | string（列舉：`部品問題`、`機構問題`、`材料問題-已回報`） | 初始由分類邏輯依 `possibleRootCauses` 與遙測數值決定為 `部品問題` 或 `機構問題`；使用者回報後才會出現 `材料問題-已回報`。實作時發現規格原本設想的「材料問題-待確認」中間態沒有必要——命中材料風險前，畫面維持系統原本推測分類，材料風險只作為獨立提示（`materialLotRiskRef`），不是第三種分類值 |
| `classificationReason` | string \| null | 僅曖昧 Alarm（`possibleRootCauses.length === 2`）需要，需引用至少一項遙測數值/趨勢（FR-004） |
| `systemInitialGuess` | string | 保留系統「原本」的推測分類，即使之後被使用者回報覆寫也不清除，供 User Story 3 的核對訊息使用 |
| `materialLotRiskRef` | string \| null | 若本次事件命中某筆 `MaterialLotRisk.lotId`，記錄關聯 |
| `dispatchTarget` | string（列舉：`設備工程師`、`主管們`） | 由 dispatch-rules 依 FR-008 規則計算 |

### 狀態轉移

```
生成 (generate-events)
  └─> 分類推論 (classify)：依 possibleRootCauses 數量 →
        ├─ 明確分類（部品 或 機構）
        └─ 曖昧 → 依 vacuumTrend / bondForceSeverity 推測 → 部品問題 或 機構問題（+ classificationReason）
  └─> 若 materialLotRiskRef 存在 → 顯示提示（不自動改分類）
  └─> [可選] 使用者按下「回報為材料問題」
        └─> rootCauseClassification = 材料問題-已回報（systemInitialGuess 保留原值供比對）
  └─> dispatch-rules 依最終 rootCauseClassification 與統計結果計算 dispatchTarget
```

## 6. 派生統計（不是獨立實體，屬於畫面呈現用的計算結果）

- **AlarmCountByCode**：本次生成的事件依 `catalogRef` 分組計數，供 FR-009 的統計圖表使用。
- **AnomalyThreshold**：`本次所有代號平均次數 × 2`（Clarifications 第 2 題），用於判斷部品問題是否升級。
- **YieldImpactLevel**：列舉 `正常`／`輕微影響`／`中度影響`／`嚴重影響`（4 級，見 spec.md Assumptions），依機構/材料類別占比計算（實作時拿掉了原本「事件總數 ≥ 20」的門檻，因為情境事件量拉高後這個門檻永遠成立，導致「正常運作」情境永遠顯示不出「正常」等級）。
- **LotHitSummary**（FR-017，2026-09-05 迭代新增）：對每筆 `MaterialLotRisk`，從本次 `AlarmEvent[]` 篩出 `materialLotRiskRef` 相符的事件，得到 `hitCount`（命中次數）與 `hits`（命中的 AlarmEvent 清單），供材料批號風險清單顯示「本批命中 N 次」與展開明細。
- **AlarmCodeSummary**（FR-018、FR-019，2026-09-06 迭代新增）：把本次 `AlarmEvent[]` 依 `catalogRef` 分組彙總，得到 `count`（本批次數，用於排序）、`classCounts`（各分類次數，如「部品問題 ×7、機構問題 ×10」）、`dispatchTarget`（只要組內任一事件升級給主管們，整組就顯示主管們）、`status`（`單次發生` / `重複發生・持續觀察` / `重複發生・待商議`，判斷規則見 FR-019）、`batchCounts`（各 `ProductionBatch.label` 對應的命中次數）與 `batchSpan`（涉及的批次數，FR-020）。圖表與清單皆以此彙總結果依 `count` 由高到低排序呈現，取代原本逐筆事件的流水帳呈現方式。

## 實體關聯圖（文字版）

```
ScenarioProfile ──(決定抽樣規則)──> AlarmEvent[] ──(catalogRef)──> AlarmCatalogEntry
                                        │
                                        ├─(telemetry)──> TelemetrySnapshot
                                        ├─(batchId)──────> ProductionBatch
                                        └─(materialLotRiskRef，可能為 null)──> MaterialLotRisk
```
