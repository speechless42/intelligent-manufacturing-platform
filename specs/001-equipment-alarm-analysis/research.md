---
目的: plan 附屬產出 — 記錄技術選型的決策與理由（Phase 0），供之後回顧「為什麼選這個」
關聯: "[[plan]]"
---

# Research: 設備 Alarm Code 分析平台

本文件記錄 `/speckit-plan` Phase 0 對每個技術決策的理由與備選方案，對應 [plan.md](plan.md) 的 Technical Context。Technical Context 中沒有殘留的 `NEEDS CLARIFICATION`，本文件是把已經跟作者討論定案的技術選擇，補上完整的理由與比較，方便日後回顧。

## 1. 前端框架：Vue 3（CDN 全域建置版，不用 SFC/建置工具）

- **Decision**: 使用 Vue 3 的全域建置版（`vue.global.js`，透過 jsdelivr CDN 載入），以選項式元件（`template` 字串 + `data`/`methods`/`computed`）撰寫畫面，不使用 `.vue` 單檔元件、不使用 Vite/Nuxt 等建置工具。
- **Rationale**: (1) 作者日常開發慣用 Vue／Nuxt，用同一套心智模型能讓他自己也看得懂、之後有能力維護與微調，符合「透過作品理解系統」的學習目的；(2) 這個作品必須能同時以 Claude Artifact 形式運作——Artifact 環境不支援任意 npm 套件與建置步驟，只能透過 CDN 載入單一 `<script>`；Vue 3 官方剛好提供不需建置的全域版本，能在 `<script>` 標籤內直接使用，因此可以維持「Artifact 版與 repo 版共用同一套程式碼」的目標；(3) 專案規模雖小，但有多個需要互相連動的畫面狀態（Alarm 清單、詳情面板、情境選擇、材料回報），Vue 的響應式資料綁定比純手動操作 DOM 更不容易出錯、也更好維護。
- **Alternatives considered**:
  - 純原生 JavaScript + DOM API：完全不需要框架，最輕量，但作者本身較常用 Vue，改用原生 DOM 操作反而增加他理解程式碼的難度，不符合「這個作品也是用來學習」的初衷。
  - Nuxt：作者最熟悉的完整框架，檔案式路由、SSR 等功能對這個單頁無路由的小作品而言用不到，且 Nuxt 需要 Node.js 建置/開發伺服器，**無法直接在 Claude Artifact 的沙箱環境中執行**——若採用 Nuxt，之前規劃的「先在 Artifact 做雛形」這一步就必須改成本機執行 `npm run dev`，或改用 Vercel/Netlify 之類的託管取代 Artifact 連結；因此若之後想升級成正式的多頁面/求職作品集網站，可以把這裡的 Vue 元件與 `logic/` 純函式幾乎原封不動搬進 Nuxt 專案，屬於自然的升級路徑，但非本次 MVP 選擇。
  - React + Vite：元件化程度高，但作者不熟悉 React，且同樣需要建置工具，與 Vue-CDN 方案相比沒有額外優勢。

## 2. 圖表庫：Chart.js

- **Decision**: 使用 Chart.js（透過 cdnjs CDN 載入）繪製 Alarm 名稱次數統計圖與遙測趨勢圖。
- **Rationale**: Chart.js 內建長條圖、折線圖等標準圖表型態，API 簡單（設定資料與選項物件即可），完全符合「7 天 Alarm 統計」這類標準商業圖表的需求；且在 Claude Artifact 允許的 CDN 清單（cdnjs）內，可以同時滿足 Artifact 雛形與 repo 正式版兩種交付形式。
- **Alternatives considered**:
  - D3.js：更適合客製化、互動性強的視覺化（例如把曖昧 Alarm 的推理邏輯畫成關聯圖），但學習曲線與程式碼複雜度高很多，對「作者不太會寫程式、依賴 AI 完成」的協作模式不利，且非本次 MVP 的必要需求（spec.md 只要求標準的名稱/次數統計圖表）。可在後續迭代若想做更進階的視覺化時再評估導入。

## 3. 動畫庫：Anime.js

- **Decision**: 使用 Anime.js（透過 cdnjs CDN 載入）做畫面互動的過場動畫（例如分類結果出現、派工標籤變化、材料回報後的比對訊息淡入等）。
- **Rationale**: 作者已自行研究過 Anime.js，是明確的個人偏好；Anime.js 專注在 DOM 元素的補間動畫，API 簡潔、不需要額外的渲染引擎或畫布，跟「原生 JS + Chart.js」的技術棧能自然搭配，且同樣在 CDN 允許清單內。
- **Alternatives considered**:
  - 純 CSS transition/animation：更輕量，但對「分類結果出現時的序列式動畫」（例如多個數值依序淡入、按重要程度做不同時間差）這類稍微複雜的編排能力較弱，Anime.js 的 timeline 功能更適合這裡想要的效果。
  - GSAP：功能更強大也更成熟，但授權條款對商業用途有限制條件，對一個公開展示的作品集項目而言不必要地複雜；Anime.js 的免費開源授權更單純。

## 4. 交付形式：Artifact 雛形 + Repo 正式原始碼並行

- **Decision**: 先在 Claude Artifact 上做一版可互動、有動畫的雛形，驗證圖表/動畫的實際手感；方向確認後，把同一套資料結構與邏輯（`web/src/` 底下的模組）落地成這個專案 repo 的正式原始碼，未來可再部署到 GitHub Pages 等靜態託管。
- **Rationale**: Artifact 版本能最快讓作者「看到、玩到」實際效果並給回饋，縮短「寫程式 → 才發現方向不對 → 重寫」的來回成本；但作品集最終仍需要有可以放在 GitHub 上、履歷可附連結的原始碼版本，兩者並行可以兼顧「快速試錯」與「正式成品的可攜性/可審視性」。
- **Alternatives considered**:
  - 只做 Artifact：交付最快，但程式碼不會出現在作者的 GitHub，面試官無法瀏覽原始碼本身，只能看到執行結果。
  - 只做 repo 版：省去雛形驗證的彈性，但作者不熟悉前端開發，若動畫效果一開始设计得不理想，來回除錯成本較高。

## 5. 測試策略：手動驗收，不引入自動化測試框架

- **Decision**: 依 spec.md 的 Acceptance Scenarios 與 Success Criteria 做手動驗收測試，不在本次導入 Jest/Playwright 等自動化測試框架。
- **Rationale**: 這是靜態展示型的作品集項目，沒有長期維運、持續整合或多人協作的需求，自動化測試框架帶來的維護成本（尤其對不熟悉前端測試工具的作者）大於其效益；手動對照 spec.md 的驗收情境逐條檢查，已足以確保功能符合規格。
- **Alternatives considered**: 導入輕量的瀏覽器端測試（如純手寫的 assert 函式）—— 評估後認為對這個規模的專案是過度設計，暫不採用；若後續作品規模擴大或想額外展示「測試能力」，可再另立規格討論。

## Phase 0 結論

Technical Context 中所有項目均已定案，無殘留的 `NEEDS CLARIFICATION`，可進入 Phase 1（data-model.md、quickstart.md）。
