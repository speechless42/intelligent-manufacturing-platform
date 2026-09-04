(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.views = window.AlarmApp.views || {};

  // 介紹頁（spec.md FR-014、FR-017，2026-09-06 迭代拆頁）：作品說明 + 分類色卡圖例 +
  // 材料批號風險與本批命中狀況總覽。不含隨機產生按鈕/圖表/清單，那些在「資料頁」（DataView）。
  window.AlarmApp.views.HomeView = {
    components: {
      MaterialLotRiskList: AlarmApp.components.MaterialLotRiskList,
    },
    setup() {
      const store = AlarmApp.store;
      return {
        state: store.state,
        materialLotRisks: store.materialLotRisks,
      };
    },
    template: `
      <div class="home-view">
        <section class="intro">
          <p>
            這是一個模擬設備 Alarm（警報）資料的分析作品：每次「隨機產生」都會生成一批 7 天份量的
            Alarm 事件，系統依 Alarm 現象搭配伴隨的機台參數（真空度、Bond Force 等）趨勢，
            判斷問題比較像<strong>部品問題</strong>（小問題）還是<strong>機構問題</strong>（大問題），
            兩者以外，如果剛好命中已知風險的<strong>材料</strong>批號，也可以人工回報修正；
            最後依規則建議要派給「設備工程師」還是「主管們」處理。所有資料皆為程式即時生成的合成資料，
            不對應任何真實機台或真實事件。
          </p>
          <ul class="legend">
            <li><span class="tag tag-component">部品問題</span>零星耗材/元件老化，派給設備工程師</li>
            <li><span class="tag tag-mechanism">機構問題</span>結構性磨損或位移，一律升級主管們</li>
            <li><span class="tag tag-material">材料問題-已回報</span>經人工回報確認，一律升級主管們</li>
            <li><span class="badge badge-escalate">主管們</span>機構/材料，或部品但異常高頻</li>
          </ul>
        </section>

        <MaterialLotRiskList :lots="materialLotRisks" :events="state.events" />

        <router-link to="/data" class="primary-btn nav-cta">查看本批 Alarm 資料 →</router-link>
      </div>
    `,
  };
})();
