(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.data = window.AlarmApp.data || {};

  // 固定 Alarm 目錄（spec.md Clarifications 第 1 題）：約 10-15 種通用/模糊化命名的 Alarm 類型，
  // 不對應任何真實機台代號。possibleRootCauses 長度為 2 的項目是刻意設計的曖昧 Alarm，
  // 由 logic/classify.js 依伴隨遙測趨勢推測分類。
  // 2026-09-06 修正（spec.md FR-021）：這份目錄要模擬「同一台設備」的 Alarm 記錄，作品鎖定的是
  // BGA/LeadFrame 封裝的 Die Bonder（黏晶機，如 DB800/Esec 2007/2008），流程是晶圓拾取→影像對位→
  // 貼裝於基板/導線架。先前參考的公開故障類別文獻裡混了打線機（Wire Bonder）專屬的故障類型
  // （USG 超音波訊號、夾線裝置、EFO 點火成球），這些屬於「打線」製程、跟這台設備的「上片/黏晶」
  // 製程是不同機台，同一份清單裡同時出現會不合理，已全部替換為黏晶機製程範圍內的故障類型。
  // description：白話說明這個 Alarm 代表設備發生了什麼事（spec.md FR-014，2026-09-05 迭代新增）。
  // reasoningSignal：曖昧 Alarm（possibleRootCauses 長度為 2）用哪一項遙測參數來推理分類，
  // 必須跟這個 Alarm 的物理性質相關（2026-09-06 修正：先前不分 Alarm 種類、一律套用真空度/
  // Bond Force 推理，導致「傳送卡料」這種跟真空完全無關的 Alarm 也顯示真空度理由，見
  // logic/classify.js）。
  window.AlarmApp.data.alarmCatalog = [
    {
      code: 'E-01',
      name: 'Pick up miss',
      description: '設備嘗試吸取晶片/元件失敗，吸嘴未能成功拾取待貼裝的物件。',
      possibleRootCauses: ['部品', '機構'],
      reasoningSignal: 'vacuum',
      telemetryBaseline: { vacuum: [70, 95], bondForce: [80, 120] },
    },
    {
      code: 'E-02',
      name: 'Bond force out of range',
      description: '下壓力/接合力道超出設定範圍，可能是調機漂移，也可能是機構位移造成。',
      possibleRootCauses: ['部品', '機構'],
      reasoningSignal: 'bondForce',
      telemetryBaseline: { vacuum: [75, 95], bondForce: [80, 120] },
    },
    {
      code: 'E-03',
      name: 'Nozzle clog detected',
      description: '吸嘴或治具通道疑似堵塞，導致吸附力道不足。',
      possibleRootCauses: ['部品'],
      telemetryBaseline: { vacuum: [65, 90], bondForce: [85, 115] },
    },
    {
      code: 'E-04',
      name: 'Vision recognition fail',
      description: '影像辨識系統未能辨識到待貼裝物件的正確位置或圖案。',
      possibleRootCauses: ['部品'],
      telemetryBaseline: { vacuum: [75, 95], bondForce: [85, 115] },
    },
    {
      code: 'E-05',
      name: 'Z-height search fail',
      description: '設備在尋找下壓/貼裝高度時失敗，可能是軸向定位異常。',
      possibleRootCauses: ['機構'],
      telemetryBaseline: { vacuum: [75, 95], bondForce: [80, 120] },
    },
    {
      code: 'E-06',
      name: 'Vacuum leak alarm',
      description: '真空迴路偵測到持續漏氣，吸附力道無法維持。',
      possibleRootCauses: ['機構'],
      telemetryBaseline: { vacuum: [70, 95], bondForce: [85, 115] },
    },
    {
      code: 'E-07',
      name: 'Ejector needle stall',
      description: '晶圓環下方的頂針機構卡滯，未能正常頂出晶片供吸嘴拾取。',
      possibleRootCauses: ['部品'],
      telemetryBaseline: { vacuum: [75, 95], bondForce: [85, 115] },
    },
    {
      code: 'E-08',
      name: 'Epoxy dispense volume error',
      description: '點膠量超出設定範圍，可能導致晶片黏著力不足或溢膠。',
      possibleRootCauses: ['部品'],
      telemetryBaseline: { vacuum: [75, 95], bondForce: [85, 115] },
    },
    {
      code: 'E-09',
      name: 'Wafer film torn',
      description: '晶圓膜（藍膜）出現破損，可能影響晶片吸附穩定性。',
      possibleRootCauses: ['部品'],
      telemetryBaseline: { vacuum: [75, 95], bondForce: [85, 115] },
    },
    {
      code: 'E-10',
      name: 'Servo axis home fail',
      description: '伺服軸回原點動作失敗，可能是編碼器或機構卡滯。',
      possibleRootCauses: ['機構'],
      telemetryBaseline: { vacuum: [75, 95], bondForce: [80, 120] },
    },
    {
      code: 'E-11',
      name: 'Leadframe transport jam',
      description: '載板/導線架在傳送過程中卡料。',
      possibleRootCauses: ['部品', '機構'],
      reasoningSignal: 'cycleCount',
      telemetryBaseline: { vacuum: [70, 92], bondForce: [80, 118] },
    },
    {
      code: 'E-12',
      name: 'Safety interlock open',
      description: '安全連鎖開關被觸發（如護罩開啟），設備進入安全停止狀態。',
      possibleRootCauses: ['機構'],
      telemetryBaseline: { vacuum: [75, 95], bondForce: [80, 120] },
    },
  ];
})();
