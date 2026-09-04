(function () {
  window.AlarmApp = window.AlarmApp || {};

  // 共用狀態（原本在 app.js 的 setup() 裡），2026-09-06 迭代抽出成獨立 store，
  // 讓拆成「介紹頁」「資料頁」兩個路由畫面後，兩邊都能讀到同一份資料，不會因為切換頁面而重置。
  const { reactive } = Vue;

  const state = reactive({
    events: [],
    hasGenerated: false,
    selectedScenario: null,
    yieldImpactLevel: '正常',
    anomalyThreshold: 0,
    selectedEvent: null,
  });

  const profiles = AlarmApp.scenarios.profiles;
  const materialLotRisks = AlarmApp.data.materialLotRisks;
  const alarmCatalog = AlarmApp.data.alarmCatalog;

  function regenerate(scenarioId) {
    const id = scenarioId || 'random';
    const profile = profiles.find((p) => p.id === id) || profiles.find((p) => p.id === 'random');
    const raw = AlarmApp.logic.generateEvents(profile, alarmCatalog, materialLotRisks);
    const classified = AlarmApp.logic.classifyEvents(raw);
    const dispatched = AlarmApp.logic.applyDispatchRules(classified);

    state.events = dispatched.events;
    state.anomalyThreshold = dispatched.anomalyThreshold;
    state.yieldImpactLevel = dispatched.yieldImpactLevel;
    state.selectedScenario = id;
    state.hasGenerated = true;
    state.selectedEvent = null;
  }

  function reportMaterial(eventId) {
    const target = state.events.find((e) => e.id === eventId);
    if (!target) return;
    AlarmApp.logic.reportAsMaterialIssue(target);
    const dispatched = AlarmApp.logic.applyDispatchRules(state.events);

    state.events = dispatched.events;
    state.anomalyThreshold = dispatched.anomalyThreshold;
    state.yieldImpactLevel = dispatched.yieldImpactLevel;
    state.selectedEvent = state.events.find((e) => e.id === eventId) || null;
  }

  function openDetail(event) {
    state.selectedEvent = event;
  }

  function closeDetail() {
    state.selectedEvent = null;
  }

  // 頁面載入時先給一組「正常運作」情境的範例資料，避免使用者一開頁只看到空白（design 慣例：
  // 工具類頁面應該以真實可操作的狀態開場，而不是等待輸入的空殼）。
  regenerate('normal');

  window.AlarmApp.store = {
    state,
    profiles,
    materialLotRisks,
    alarmCatalog,
    regenerate,
    reportMaterial,
    openDetail,
    closeDetail,
  };
})();
