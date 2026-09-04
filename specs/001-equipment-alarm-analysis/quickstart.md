---
目的: plan 附屬產出 — 驗證這個功能「做出來後怎麼確認它是對的」的操作指南（Phase 1），不是使用手冊
關聯: "[[plan]]"、"[[spec]]"
---

# Quickstart: 設備 Alarm Code 分析平台

這份文件是給 `/speckit-implement` 完成後（或開發過程中）用來手動驗證功能是否符合 [spec.md](spec.md) 的操作指南，對應 [research.md](research.md) 決定的「手動驗收測試」策略。驗收情境的完整敘述請見 spec.md 的 Acceptance Scenarios，這裡只列操作步驟與預期結果的對照。

## 前置需求

- 一個現代瀏覽器（Chrome/Edge/Safari 最新版）
- 不需要安裝任何套件、不需要建置步驟——`web/index.html` 直接用瀏覽器開啟即可（或開啟已發布的 Claude Artifact 連結）

## 啟動方式

- **本機原始碼版本**：直接在瀏覽器開啟 `web/index.html`（純靜態檔案，不需要啟動伺服器）
- **Artifact 雛形版本**：開啟該次發布的 Artifact 連結

## 驗證場景

### 1. 核心產生流程（對應 User Story 1）

1. 開啟頁面，確認初始畫面顯示「尚未產生資料」的空狀態提示（Edge Case）。
2. 點擊「隨機產生」。
3. **預期**：5 秒內（SC-001）畫面出現 7 天份量的 Alarm 統計圖表，每筆 Alarm 都標示根因分類（部品/機構/材料-待確認）與派工對象（設備工程師／主管們）。
4. 再次點擊「隨機產生」。
5. **預期**：舊資料完全被新資料取代（FR-012），不會有殘留的前一批資料混在圖表裡。

### 2. 曖昧 Alarm 的推理呈現（對應 User Story 2）

1. 從 [data-model.md](data-model.md) 的 AlarmCatalogEntry 找一筆 `possibleRootCauses` 長度為 2 的曖昧 Alarm（例如 Pick up miss）。
2. 在畫面上點開一筆該類型的 Alarm。
3. **預期**：顯示「推測分類 + 簡短理由」，理由文字需引用真空度趨勢或 Bond Force 嚴重度（FR-004、FR-005）。
4. 找一筆 `bondForceSeverity = normal-drift` 的事件。
5. **預期**：畫面顯示判定為正常調機漂移、不升級。

### 3. 材料批號風險與人工回報（對應 User Story 3）

1. 在尚未產生任何 Alarm 資料前，開啟「材料批號風險清單」。
2. **預期**：顯示目前所有已知風險批號（批號 ID、風險類型、建議措施、風險等級）。
3. 產生資料後，找一筆 `materialLotRiskRef` 不為 null 的事件。
4. **預期**：該筆事件旁顯示材料風險命中提示。
5. 點擊「回報此次 Alarm 為材料問題」。
6. **預期**：該筆分類更新為「材料問題-已回報」，派工對象更新為「主管們」，並顯示「系統原判斷／使用者回報」的比對訊息（`systemInitialGuess` vs 回報結果）。

### 4. 情境選擇（對應 User Story 4）

1. 從情境選單選擇「機構緩慢退化」。
2. **預期**：生成的資料中，Pick up miss 類型的事件次數隨時間呈遞增趨勢，且對應的 `vacuumTrend` 多數為 `declining`。
3. 選擇「正常運作」。
4. **預期**：Alarm 總數量偏少、多數分類為部品問題，沒有明顯的遞增趨勢。
5. 依序選完其餘 3 種情境（材料批號命中風險、部品隨機老化、混合曖昧情境），逐一確認資料特徵符合 spec.md 對應的情境描述（SC-005）。

### 5. 派工升級規則（對應 FR-008、SC-003）

1. 產生一批資料後，手動列出所有 `rootCauseClassification = 機構問題` 或 `材料問題-已回報` 的事件。
2. **預期**：這些事件的 `dispatchTarget` 全部是「主管們」。
3. 計算本次所有 Alarm 代號的平均次數 × 2（AnomalyThreshold），找出次數達到此門檻的部品問題代號。
4. **預期**：這些代號的所有事件 `dispatchTarget` 也是「主管們」；其餘部品問題事件為「設備工程師」。

## 驗收完成的判斷標準

以上 5 個場景全數通過、且對照 spec.md 的 Success Criteria（SC-001 ~ SC-005）逐條檢查無誤，即視為本功能驗收通過，可以視為 `/speckit-implement` 的完成依據。
