# Intelligent Manufacturing Platform — 專案說明（給未來任何 Claude Code 視窗看）

> 這份文件是「隨時可能更新」的活文件（living doc）。任何新開的對話視窗，
> 請先讀這份文件再開始工作，不需要使用者再重講一次背景。

## 這是什麼

一個**個人作品（portfolio project）**：設備 Alarm Code 分析平台。
作者背景：傳統封裝（BGA / LeadFrame）設備工程師，熟悉 Hitachi DB800、
Esec 2000 的操作模式，目前想轉職到「智慧製造 / 製造數據分析」領域，
曾參加過資料清洗、BI、分類相關競賽。

**這個作品的目的不只是做出一個網頁，而是要讓作者透過製作過程，
補齊「一個像樣的資料分析平台需要具備什麼」的知識空缺。**
因此本專案的文件，除了寫「做了什麼」，更重要的是寫**「為什麼這樣分析 / 這樣設計」**。

## 核心功能（目前共識，仍在細化中，見下方「待確認」）

- 針對設備 Alarm Code，統計 7 天內各 Alarm 名稱與發生次數。
- 依故障根因分三類：
  - **部品問題** → 小問題
  - **機構問題** → 大問題
  - **材料問題**（例：wafer film 膠太黏、一次吸兩顆）→ 需要被「排除」/獨立標示，不算設備本身責任
- 派工邏輯（概念上，不一定全部要做進系統）：
  - 一般情況：自動派工給「設備工程師」群組
  - 機構問題 / 材料問題，或 Alarm 次數異常高 / Alarm Code 情況特殊：升級給「主管們」群組
  - 主管討論後的結論，要能讓設備、PM 等角色看到，作為後續措施依據
- 資料來源：**沒有真實系統可串接**。優先找網路公開資料，找不到就自行生成合成資料，
  兩種都要在文件中標註「資料來源 / 生成規則 / 分類權重與理由」。
- 形式：Web 互動頁面，可能是**純前端（無後端）**，使用者按「隨機產生」→ 產生一組
  設備 / 部品錯誤情境與良率影響（良率隨 Alarm 次數升高而下降），設計約 10 種情境。
- 顧慮公開性：機台資料希望「專業但不涉密」，優先用網路上找得到的公開資訊，
  不確定能否公開的細節（例如作者自己記得的真實 Alarm Code 對照表）需要作者逐項確認。

## 工作方式（Workflow）

本專案採用「先 grill 後 spec」的兩階段流程：

1. **grill-me（grilling-zh skill）**：用連續提問，把需求拆成 decision tree，
   一輪一輪問，直到雙方對範圍、邊界、規則都有共識，不留下「被默默假設」的東西。
   grilling 過程中同時會：
   - 派 sub-agent 去查「事實類」問題（例如網路上是否有 DB800 / Esec 2000 的公開 Alarm Code 資料），
     不會反過來問使用者這種本來可以自己查到的事。
   - 對於作者本身在學的部分（一般製造平台該有什麼），Claude 也會主動反問作者，
     幫助雙方一起釐清系統邊界與操作方式，而不是單方面幫作者做決定。
2. **spec-kit**（已安裝在 `.specify/` 與 `.claude/skills/speckit-*`）：
   grill-me 收斂後，用 spec-kit 產生正式規格與計畫：
   - `/speckit-constitution` 建立專案原則
   - `/speckit-specify` 產生規格
   - `/speckit-clarify`（選用）在 plan 前先排除模糊地帶
   - `/speckit-plan` 產生實作計畫
   - `/speckit-tasks` 產生任務清單
   - `/speckit-implement` 執行實作
   - `/speckit-converge` 之後每次迭代用來盤點/補任務

## 文件組織原則（作者明確要求，非常重要）

作者的三個顧慮，之後所有文件產出都要遵守：

1. **不要迷路**：迭代過程中要能清楚知道「目前做到哪、整體專案長什麼樣」，
   不能沒有目錄、越迭代越亂。
2. **不要過度複雜**：文件結構要精簡、有關聯性，不要為了結構而結構。
3. **每份文件要清楚寫明自己的定位/目的**：例如某份文件只是「這次迭代對系統做的變更說明」，
   就要明確標示這只是「迭代/變更紀錄」，不是「整個系統架構」文件；
   如果這次迭代牽動到系統架構，要明確做出關聯（見下一點）。

因此文件慣例訂為：

- 每份 Markdown 文件開頭用 YAML frontmatter 標明 `目的`（這份文件是做什麼用的：
  spec / plan / iteration-note / architecture / decision-log 等）與 `關聯`（相關文件的 wikilink）。
- 使用 `[[檔名]]` 形式的 wikilink 標示關聯文件，讓整個專案資料夾**可以直接用 Obsidian 開啟，
  並看得到 Graph View 關聯圖**（待確認：作者是否真的會用 Obsidian 打開這個資料夾，見待確認事項）。
- 保留一份頂層索引文件（例如 `README.md` 或 `INDEX.md`）串起 spec-kit 的 spec / plan / tasks，
  避免文件散落找不到入口。
- spec-kit 本身產生的 `specs/<feature>/spec.md` 等文件維持原生結構，
  只在其 frontmatter 補上「目的」與「關聯」欄位，不額外重造一套目錄。

## 最終決策（grill-me 三輪收斂結果，`/speckit-specify` 的依據）

**Alarm 命名與代號**
- Alarm Code 由本專案自行生成（如 `E-xxxx`），名稱刻意保持通用/模糊（例如 "Pick up miss"），
  不對應任何機台真實代號，避免公開性疑慮。查證結果：Hitachi DB800、ESEC 該年代機型
  （實際型號為 2007/2008 系列）皆無公開 Alarm Code 對照表；已用同類設備公開手冊
  （TPT HB16、F&S Bondtec 53XX 等）與產業文獻整理出的通用故障類別作為命名基礎
  （Pick-up/真空異常、Vision/辨識錯誤、Bond Force/高度異常、USG 異常、Wire Clamp/EFO 異常、
  運動/伺服軸異常、物料處理異常、安全連鎖等）。
- 刻意保留「模稜兩可」的 Alarm（如 Pick up miss 可能是部品或機構問題），
  靠搭配的機台參數趨勢去輔助判斷，而不是每個 Alarm 都能一次分類到底。
- **2026-09-06 修正**：上面查證階段參考的公開手冊（TPT HB16、F&S Bondtec）其實是打線機
  （Wire Bonder）的手冊，其中「USG 異常、Wire Clamp/EFO 異常」屬於打線製程，跟本作品鎖定的
  黏晶機（Die Bonder，上片/貼裝製程）是不同機台，混在同一份 Alarm 目錄裡不合理（作者實測時
  發現「一下打線 Alarm、一下上片 Alarm」的矛盾）。已把這 3 種替換成黏晶機製程範圍內的故障類型
  （頂針卡滯、點膠量異常、晶圓膜破損），詳見 [spec.md](specs/001-equipment-alarm-analysis/spec.md)
  的 Clarifications 與 FR-021。

**合成遙測參數**（伴隨每筆 Alarm 事件產生，用來輔助判斷曖昧 Alarm 的根因）
- 真空度/吸力數值 — 持續下降 → 傾向管路漏氣（機構問題）；正常波動 → 傾向吸嘴單純堵塞（部品問題）
- 累積動作次數（自上次保養以來）— 判斷零件磨損趨勢
- Bond Force/下壓力數值 — 輕微/偶發異常 = 正常調機漂移；嚴重或頻繁 = 疑似機構問題
- 影像辨識信心分數 — 模擬「異常影像可用於機器學習」的概念（本專案為合成分數，非真的跑影像 ML，
  文件需註明這是簡化模擬）
- 已評估但**不納入 MVP**：軸/治具溫度（作者本身對此不熟悉，證據不足）；
  「倒吸造成影像誤檢」的機構層面洞察記錄為**未來可延伸方向**，尚未有對應部品可歸因，
  不放進這次核心參數範圍。

**材料問題處理邏輯**
- 材料問題不是靠 Alarm 自動推斷，而是「已知批號風險」機制：生產前每個材料批號有對應風險紀錄
  （批號 ID、風險類型如「黏度過高」、建議措施如「冷藏 X 小時」、風險等級）。
- 系統對 Alarm 先嘗試依風險批號提示使用者留意，但最終需要「使用者回報此次 Alarm 為材料問題」的
  按鈕做人工修正——這個回報同時也是驗收用途：讓使用者事後核對「系統原本的推測分類猜對了嗎」，
  以利文件說明系統在什麼情況會誤判、為什麼。

**曖昧 Alarm 的呈現方式**
- 畫面上對曖昧 Alarm 顯示「推測分類 + 簡短理由」（例如：連續 3 天真空度下降超過 X% → 傾向機構問題），
  讓圖表本身也是在說明「系統怎麼推論」，符合作者想透過作品理解分析邏輯的目的。

**派工升級規則**
- 機構問題、材料問題（含使用者回報確認）→ 一律升級給「主管們」群組
- 部品問題但該 Alarm Code 的 7 天內出現次數落在前 10%（異常高頻）→ 同樣升級
- 其餘一般部品問題 → 自動派工給「設備工程師」群組
- 主管討論結論需能讓設備、PM 等角色看到，作為後續措施依據（此為概念性需求，實作範圍在
  `/speckit-plan` 階段再決定要做到多完整）

**情境設計（MVP 最小可行情境，之後可疊加材料風險命中與否組合出更多變化）**
1. 正常運作：Alarm 稀疏、多為部品類、無趨勢
2. 機構緩慢退化：Pick up miss 頻率遞增，伴隨真空度緩慢下降
3. 材料批號命中已知風險：Film 黏度過高，連續吸附/Pick up miss 大量出現，可人工回報為材料問題
4. 部品隨機老化：吸嘴磨損零星出現 Pick up miss，次數低、無趨勢，落在正常波動內
5. 混合曖昧情境：機構退化徵兆 + 材料風險批號同時存在，比例接近，測試分類邊界

**資料與持久化**
- 沒有真實系統可串接，資料全為自行生成的合成資料（非抓取網路公開資料，因公開資料查無機台專屬
  Alarm Code，改用產業通用故障類別為基礎自建）。
- 不需要跨 session 持久化。每次使用者按「隨機產生」，都是即時生成一份「7 天份量」的資料
  （非真的橫跨 7 個日曆天），單純用來展示分析邏輯。
- 平台形式：Web 互動頁面，前端技術棧尚未決定，留到 `/speckit-plan` 階段再確認
  （spec-kit 慣例：`/speckit-specify` 只定義做什麼/為什麼，不綁定技術實作）。

**規格與程式碼追溯慣例**
- 規格撰寫當下程式碼還不存在，不預先標行號。等 `/speckit-implement` 真的把某個 task 落地後，
  回頭在 `tasks.md`（或獨立 decision-log）補一行「此決策 → 對應 `檔案:行號`」，屬於事後補追溯，
  不是規格階段的產出。

## 目前狀態

- [x] spec-kit 已安裝（`.specify/`、`.claude/skills/speckit-*`）
- [x] grill-me 三輪已完成，上方「最終決策」為 `/speckit-specify` 的輸入依據
- [x] 機台 Alarm Code 公開資料可用性已查證：無公開專屬代號，改用通用故障類別（見上方）
- [x] 執行 `/speckit-specify` 完成 → 規格文件：[specs/001-equipment-alarm-analysis/spec.md](specs/001-equipment-alarm-analysis/spec.md)
      （品質檢查清單：[specs/001-equipment-alarm-analysis/checklists/requirements.md](specs/001-equipment-alarm-analysis/checklists/requirements.md)，全數通過，無 NEEDS CLARIFICATION）
- [x] 執行 `/speckit-clarify` 完成 → 補了 3 題澄清（Alarm 目錄是否固定、異常高頻門檻算法、材料批號風險清單呈現方式），
      已整合進 spec.md 的 Clarifications 區塊
- [x] 執行 `/speckit-plan` 完成（含一次技術棧修正）→ 技術棧與架構定案：
      [specs/001-equipment-alarm-analysis/plan.md](specs/001-equipment-alarm-analysis/plan.md)
      （純前端、**Vue 3（CDN 全域建置版，不用 SFC/建置工具，因作者日常慣用 Vue/Nuxt）** + Chart.js + Anime.js，
      皆透過 CDN 載入；交付形式為「先在 Claude Artifact 做雛形 → 確認方向後落地成 `web/` 目錄下的正式原始碼」
      兩階段並行，此架構下 Vue 全域版可同時在兩邊運作；曾考慮過 Nuxt 但因需要 Node.js 建置流程、
      無法直接在 Artifact 沙箱執行而未採用，理由詳見同資料夾的
      [research.md](specs/001-equipment-alarm-analysis/research.md)、
      資料模型詳見 [data-model.md](specs/001-equipment-alarm-analysis/data-model.md)、
      驗收操作指南詳見 [quickstart.md](specs/001-equipment-alarm-analysis/quickstart.md)）
- [x] 文件資料夾慣例：`specs/`（spec-kit 原生規格，已用於本次輸出）與 `docs/`（教學/說明文件，尚未建立）分開，
      兩者之間不互相加 wikilink，各自資料夾內部才用 `[[wikilink]]` 建立 Obsidian 關聯圖
      （作者會把兩者分別匯入不同的 Obsidian 資料夾，不希望跨資料夾關聯）
- [x] 執行 `/speckit-tasks` 完成 → 任務清單：
      [specs/001-equipment-alarm-analysis/tasks.md](specs/001-equipment-alarm-analysis/tasks.md)
      （共 28 個任務，Setup 3 個、Foundational 7 個、US1~US4 各 3-4 個、Polish 5 個；
      MVP 範圍是完成 Setup + Foundational + User Story 1，即可展示「Alarm 現象 → 分類 → 派工建議」核心邏輯）
- [x] 執行 `/speckit-implement` 完成 → 全部 28 個任務（Setup、Foundational、User Story 1-4、Polish）皆已落地：
      - 原始碼：[web/](web/)（`index.html`、`styles.css`、`src/data`、`src/scenarios`、`src/logic`、`src/charts`、`src/components`、`src/app.js`）
      - 本機開啟方式：直接用瀏覽器開啟 `web/index.html`，不需啟動伺服器（純靜態檔案 + CDN script）
      - Artifact 雛形（同一套邏輯打包成單一 HTML）：https://claude.ai/code/artifact/4f744405-a14c-4117-afa8-2a1328dd3cf1
      - 已用 Playwright 自動化瀏覽器測試跑過所有情境（含 5 種預定義情境、隨機、材料回報流程、
        淺色/深色主題），互動過程中主控台無錯誤
      - 實作過程中對規格做的小調整、以及規格決策對應到的檔案位置，記錄在
        [tasks.md](specs/001-equipment-alarm-analysis/tasks.md) 最後一節「規格與程式碼追溯」
- [x] 迭代二（2026-09-05，使用者體驗回饋）→ 補了 FR-014～FR-017 並完成實作：
      主頁加入作品說明與分類色卡圖例、每個 Alarm 補白話描述、伴隨機台參數逐項加說明
      （尤其「累積動作次數」數字的意義）、材料批號風險清單改為與本次資料連動（顯示本批命中次數、
      可展開看命中的 Alarm 明細）。對應任務見 [tasks.md](specs/001-equipment-alarm-analysis/tasks.md)
      Phase 8；Artifact 連結已更新為最新版本（同一個連結）
- [x] 迭代三（2026-09-06，實測抓出的邏輯錯誤）→ 補了 FR-005 修正、FR-018、FR-019 並完成實作：
      (1) 修正曖昧 Alarm 推理理由的真正 bug——先前「Leadframe transport jam（傳送卡料）」這種
      跟真空完全無關的 Alarm，也被套用真空度理由，現在依 Alarm 物理性質分派到對應的推理邏輯
      （真空度／Bond Force／累積動作次數）；(2) 圖表與清單皆改為依本批次數由高到低排序，
      清單從「逐筆事件流水帳」改成「依代號彙總」，並標示「單次發生／重複發生・持續觀察／
      重複發生・待商議」——重複發生且曾被判定機構問題卻又再現的代號會標示「待商議」，
      提示可能沒有真正解決。對應任務見 tasks.md Phase 9，含詳細根本原因記錄。
- [x] 迭代四（2026-09-06，實測回饋）→ 補了 FR-020、FR-021 並完成實作：
      (1) 資料生成時把 7 天窗口切成數個「生產批次」，每筆 Alarm 記錄所屬批次，清單顯示「跨 N 批」
      與批次分布，讓使用者能判斷同一代號的重複發生是分散在多批（較正常）還是集中在少數批
      （較該留意）；(2) 作者以設備工程背景指出 Alarm 目錄混了打線機（Wire Bonder）與黏晶機
      （Die Bonder）兩種不同機台的故障類型不合理，已把 E-07/E-08/E-09 從打線機專屬故障
      （USG、夾線、EFO）換成黏晶機製程範圍內的故障（頂針卡滯、點膠量異常、晶圓膜破損）。
      根本原因：查證階段引用的「同類設備公開手冊」其實橫跨了兩種不同機台，沒有先確認參考來源
      彼此屬於同一範疇。對應任務見 tasks.md Phase 10。
- [x] 迭代五（2026-09-06，實測回饋）→ 補了 FR-022、FR-023 並完成實作：
      (1) 派工對象（設備工程師/主管們）原本在展開的每一筆事件明細都重複顯示，改成只在該 Alarm
      代號的彙總標題列顯示一次；(2) 新增 Vue Router（CDN 全域版、hash history，`web/src/router.js`），
      拆成「介紹」（`views/HomeView.js`：作品說明、分類圖例、材料批號風險總覽）與「資料」
      （`views/DataView.js`：隨機產生/情境選擇、統計摘要、Alarm 圖表與清單）兩個可導覽頁面，
      共用狀態抽到 `web/src/store.js`，兩頁切換不會遺失已產生的資料。對應任務見 tasks.md Phase 11。
- [ ] 下一步：作者自行檢視 Artifact／本機版本效果，若要調整視覺或補充情境，可回頭跑 `/speckit-converge`
      盤點差異後再補任務；`docs/`（教學/說明文件，解釋「為什麼這樣分析」）尚未建立，屬於後續可做的項目
