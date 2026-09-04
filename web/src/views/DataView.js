(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.views = window.AlarmApp.views || {};

  // 資料頁（spec.md User Story 1-4，2026-09-06 迭代拆頁）：隨機產生/情境選擇、良率與統計摘要、
  // Alarm 圖表與清單、Alarm 詳情面板。作品說明與材料批號總覽移到「介紹頁」（HomeView）。
  window.AlarmApp.views.DataView = {
    components: {
      AlarmTable: AlarmApp.components.AlarmTable,
      AlarmDetailPanel: AlarmApp.components.AlarmDetailPanel,
      ScenarioSelector: AlarmApp.components.ScenarioSelector,
    },
    setup() {
      const store = AlarmApp.store;
      return {
        state: store.state,
        profiles: store.profiles,
        regenerate: store.regenerate,
        reportMaterial: store.reportMaterial,
        openDetail: store.openDetail,
        closeDetail: store.closeDetail,
      };
    },
    template: `
      <div class="data-view">
        <section class="controls">
          <button class="primary-btn" type="button" @click="regenerate('random')">隨機產生</button>
          <ScenarioSelector :profiles="profiles" :selected="state.selectedScenario" @select-scenario="regenerate" />
        </section>

        <section v-if="state.hasGenerated" class="stat-row">
          <div class="stat-tile" :class="'yield-' + state.yieldImpactLevel">
            <span class="stat-label">良率影響</span>
            <span class="stat-value">{{ state.yieldImpactLevel }}</span>
          </div>
          <div class="stat-tile">
            <span class="stat-label">本批 Alarm 總數</span>
            <span class="stat-value mono">{{ state.events.length }}</span>
          </div>
          <div class="stat-tile">
            <span class="stat-label">異常高頻門檻（平均 × 2）</span>
            <span class="stat-value mono">{{ state.anomalyThreshold.toFixed(1) }}</span>
          </div>
        </section>

        <AlarmTable :events="state.events" @select-event="openDetail" />

        <AlarmDetailPanel :event="state.selectedEvent" @close="closeDetail" @report-material="reportMaterial" />
      </div>
    `,
  };
})();
