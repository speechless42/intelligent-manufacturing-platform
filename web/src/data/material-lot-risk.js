(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.data = window.AlarmApp.data || {};

  // 材料批號風險靜態展示資料（spec.md FR-006、Clarifications 第 3 題）：
  // 使用者可隨時瀏覽此清單；Alarm 命中批號時另外顯示即時提示（見 components/AlarmDetailPanel.js）。
  window.AlarmApp.data.materialLotRisks = [
    {
      lotId: 'LOT-2603-A',
      riskType: 'Film 黏度過高',
      recommendedAction: '冷藏 4 小時後使用',
      riskLevel: '高',
    },
    {
      lotId: 'LOT-2603-B',
      riskType: 'Film 厚度不均',
      recommendedAction: '使用前抽驗 3 片確認厚度',
      riskLevel: '中',
    },
    {
      lotId: 'LOT-2604-C',
      riskType: 'Film 黏度過高',
      recommendedAction: '冷藏 2 小時後使用',
      riskLevel: '中',
    },
    {
      lotId: 'LOT-2604-D',
      riskType: '保存期限將至',
      recommendedAction: '優先使用、加強抽驗頻率',
      riskLevel: '低',
    },
  ];

  // 依批號查回風險紀錄（供畫面上顯示風險等級顏色用，見 components/AlarmTable.js、AlarmDetailPanel.js）
  window.AlarmApp.data.getLotRisk = function (lotId) {
    return window.AlarmApp.data.materialLotRisks.find((lot) => lot.lotId === lotId) || null;
  };
})();
