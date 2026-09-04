(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.logic = window.AlarmApp.logic || {};

  // 派工/升級規則（spec.md FR-008，門檻算法見 Clarifications 第 2 題）：
  // 機構問題／材料問題（已回報）一律升級給主管們；部品問題但次數達到本次所有代號
  // 平均次數 2 倍以上，也升級給主管們；其餘部品問題派給設備工程師。
  // 同時計算良率影響等級（4 級，見 spec.md Assumptions）。
  window.AlarmApp.logic.applyDispatchRules = function (events) {
    const countByCode = {};
    events.forEach((event) => {
      countByCode[event.catalogRef] = (countByCode[event.catalogRef] || 0) + 1;
    });
    const codes = Object.keys(countByCode);
    const totalCount = events.length;
    const averageCount =
      codes.length > 0 ? codes.reduce((sum, code) => sum + countByCode[code], 0) / codes.length : 0;
    const anomalyThreshold = averageCount * 2;

    const dispatchedEvents = events.map((event) => {
      const isMechanismOrMaterial =
        event.rootCauseClassification === '機構問題' || event.rootCauseClassification === '材料問題-已回報';
      // 額外要求絕對次數 >= 5，避免樣本數過少時單一代號的隨機波動被誤判為異常高頻
      const isHighFrequencyComponent =
        event.rootCauseClassification === '部品問題' &&
        anomalyThreshold > 0 &&
        countByCode[event.catalogRef] >= anomalyThreshold &&
        countByCode[event.catalogRef] >= 5;

      const dispatchTarget = isMechanismOrMaterial || isHighFrequencyComponent ? '主管們' : '設備工程師';
      return Object.assign({}, event, { dispatchTarget });
    });

    const seriousCount = dispatchedEvents.filter(
      (event) => event.rootCauseClassification === '機構問題' || event.rootCauseClassification === '材料問題-已回報'
    ).length;
    const seriousRatio = totalCount > 0 ? seriousCount / totalCount : 0;

    // 依機構/材料類別占比換算 4 級良率影響（spec.md Assumptions）：
    // 佔比越高代表越多問題超出「單純部品汰換」可處理的範圍，對良率影響越大
    let yieldImpactLevel = '正常';
    if (totalCount > 0) {
      if (seriousRatio >= 0.5) {
        yieldImpactLevel = '嚴重影響';
      } else if (seriousRatio >= 0.25) {
        yieldImpactLevel = '中度影響';
      } else if (seriousRatio > 0.05) {
        yieldImpactLevel = '輕微影響';
      }
    }

    return { events: dispatchedEvents, anomalyThreshold, yieldImpactLevel };
  };
})();
