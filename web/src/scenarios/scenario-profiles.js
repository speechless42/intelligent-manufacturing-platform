(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.scenarios = window.AlarmApp.scenarios || {};

  // 6 個情境設定（spec.md User Story 4）：5 種預先定義情境 + 1 種完全隨機。
  // catalogWeighting 是「代號 -> 抽樣相對權重」，數字越大越容易被抽到；未列出的代號預設權重為 1。
  // random 情境用 randomizeTrends 讓 logic/generate-events.js 在每次呼叫時自行決定趨勢，
  // 而不是寫死一組固定規則。
  window.AlarmApp.scenarios.profiles = [
    {
      // 事件量刻意拉高到數十筆（見 plan.md Scale/Scope），讓「平均次數 x2」的異常門檻
      // 有足夠樣本數，不會被單一代號的隨機波動誤觸發（小樣本下變異數過大）。
      id: 'normal',
      label: '正常運作',
      eventVolumeRange: [40, 60],
      // 純機構代號（E-05/E-06/E-10/E-12）壓到極低權重，符合「正常運作」應以部品類為主、機構問題罕見的敘述
      catalogWeighting: {
        'E-03': 3, 'E-04': 3, 'E-07': 3, 'E-08': 3, 'E-09': 3,
        'E-01': 0.3, 'E-02': 0.3, 'E-11': 0.3,
        'E-05': 0.15, 'E-06': 0.15, 'E-10': 0.15, 'E-12': 0.15,
      },
      telemetryTrendRules: { vacuumDecline: false, bondForceSeverityBias: 'normal-drift' },
      materialLotHitProbability: 0.05,
    },
    {
      id: 'mechanism-decay',
      label: '機構緩慢退化',
      eventVolumeRange: [45, 70],
      // 大量集中在 Pick up miss（曖昧代號，搭配 vacuumDecline=true 會被推測為機構問題），
      // 其餘純機構代號中量出現，純部品代號壓低，呈現「機構問題主導」的敘述
      catalogWeighting: {
        'E-01': 8, 'E-05': 2, 'E-06': 2, 'E-10': 1.5, 'E-12': 1,
        'E-02': 0.3, 'E-11': 0.3,
        'E-03': 0.2, 'E-04': 0.2, 'E-07': 0.2, 'E-08': 0.2, 'E-09': 0.2,
      },
      telemetryTrendRules: { vacuumDecline: true, bondForceSeverityBias: 'mixed' },
      materialLotHitProbability: 0.05,
    },
    {
      id: 'material-lot-hit',
      label: '材料批號命中已知風險',
      eventVolumeRange: [45, 75],
      // 集中在會命中材料批號的曖昧代號（Pick up miss、Leadframe transport jam），
      // 純機構代號壓到極低，避免與「機構退化」情境混淆
      catalogWeighting: {
        'E-01': 6, 'E-11': 4,
        'E-05': 0.1, 'E-06': 0.1, 'E-10': 0.1, 'E-12': 0.1,
      },
      telemetryTrendRules: { vacuumDecline: false, bondForceSeverityBias: 'normal-drift' },
      materialLotHitProbability: 0.6,
    },
    {
      id: 'component-random-wear',
      label: '部品隨機老化',
      eventVolumeRange: [25, 40],
      // 以純部品代號為主、零星 Pick up miss（維持部品判定），純機構代號壓到極低
      catalogWeighting: {
        'E-03': 3, 'E-04': 3, 'E-07': 3, 'E-08': 3, 'E-09': 3,
        'E-01': 1,
        'E-05': 0.1, 'E-06': 0.1, 'E-10': 0.1, 'E-12': 0.1,
      },
      telemetryTrendRules: { vacuumDecline: false, bondForceSeverityBias: 'normal-drift' },
      materialLotHitProbability: 0.05,
    },
    {
      id: 'mixed-ambiguous',
      label: '混合曖昧情境',
      eventVolumeRange: [50, 75],
      // 曖昧代號（機構退化徵兆 + 材料風險批號）比例接近，純機構代號維持中低量作為背景雜訊
      catalogWeighting: {
        'E-01': 4, 'E-02': 3, 'E-11': 3,
        'E-05': 0.6, 'E-06': 0.6, 'E-10': 0.4, 'E-12': 0.4,
        'E-03': 0.5, 'E-04': 0.5, 'E-07': 0.5, 'E-08': 0.5, 'E-09': 0.5,
      },
      telemetryTrendRules: { vacuumDecline: true, bondForceSeverityBias: 'mixed' },
      materialLotHitProbability: 0.35,
    },
    {
      id: 'random',
      label: '完全隨機',
      eventVolumeRange: [25, 70],
      catalogWeighting: {},
      randomizeTrends: true,
    },
  ];
})();
