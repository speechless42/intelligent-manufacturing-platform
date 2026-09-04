(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.logic = window.AlarmApp.logic || {};

  // 根因分類推論（spec.md FR-003～FR-005）。
  // 明確 Alarm（possibleRootCauses 只有一種可能）直接對應；曖昧 Alarm（兩種可能）依
  // `reasoningSignal`（見 data/alarm-catalog.js）挑選跟這個 Alarm 物理性質相關的遙測參數推理，
  // 並附上簡短理由文字（FR-004）。2026-09-06 修正：先前不論 Alarm 種類一律套用真空度/Bond Force
  // 推理，導致跟真空完全無關的「Leadframe transport jam（傳送卡料）」也顯示真空度理由，改成
  // 依 reasoningSignal 分派到對應的推理函式。
  function reasonFromVacuum(event) {
    if (event.telemetry.vacuumTrend === 'declining') {
      return {
        classification: '機構問題',
        reason:
          '連續觀察到真空度呈下降趨勢（目前 ' + event.telemetry.vacuumLevel + '），' +
          '推測吸嘴管路或接頭有漏氣疑慮，傾向機構問題。',
      };
    }
    return {
      classification: '部品問題',
      reason: '真空度穩定，落在正常波動範圍內，尚無機構異常跡象，暫判定為部品問題（如吸嘴磨損）。',
    };
  }

  function reasonFromBondForce(event) {
    if (event.telemetry.bondForceSeverity === 'severe') {
      return {
        classification: '機構問題',
        reason:
          'Bond Force 數值（' + event.telemetry.bondForceValue + '）明顯偏離正常範圍且非偶發性調機漂移，' +
          '推測機構位移或磨耗，傾向機構問題。',
      };
    }
    return {
      classification: '部品問題',
      reason:
        'Bond Force 數值（' + event.telemetry.bondForceValue + '）落在正常調機漂移範圍內，' +
        '尚無機構異常跡象，暫判定為部品問題（如治具/耗材需微調）。',
    };
  }

  // 傳送/搬運類的曖昧 Alarm 跟真空、Bond Force 無關，改用「累積動作次數」判斷：
  // 這次事件發生時的累積次數，若明顯高於本批資料中其他事件的水準，代表傳送機構（導軌/夾爪）
  // 這段時間已經運轉相對更多次，磨損風險較高，傾向機構問題；反之則傾向是載板/導線架本身的
  // 個別瑕疵（部品問題）。門檻取本批資料 cumulativeCycleCount 的中位數，避免用固定數字。
  function reasonFromCycleCount(event, cycleMidpoint) {
    const count = event.telemetry.cumulativeCycleCount;
    if (count >= cycleMidpoint) {
      return {
        classification: '機構問題',
        reason:
          '累積動作次數（' + count + '）在本批資料中偏高，推測傳送導軌/夾爪機構磨損導致卡料，傾向機構問題。',
      };
    }
    return {
      classification: '部品問題',
      reason:
        '累積動作次數（' + count + '）在本批資料中偏低，推測是載板/導線架本身輕微翹曲或異物，傾向部品問題。',
    };
  }

  function classifyOne(event, cycleMidpoint) {
    const causes = event.possibleRootCauses;
    if (causes.length === 1) {
      return { classification: causes[0] + '問題', reason: null };
    }
    if (event.reasoningSignal === 'bondForce') return reasonFromBondForce(event);
    if (event.reasoningSignal === 'cycleCount') return reasonFromCycleCount(event, cycleMidpoint);
    return reasonFromVacuum(event);
  }

  window.AlarmApp.logic.classifyEvents = function (events) {
    const cycleCounts = events.map((e) => e.telemetry.cumulativeCycleCount);
    const cycleMidpoint =
      cycleCounts.length > 0 ? (Math.min(...cycleCounts) + Math.max(...cycleCounts)) / 2 : 0;

    return events.map((event) => {
      const { classification, reason } = classifyOne(event, cycleMidpoint);
      return Object.assign({}, event, {
        rootCauseClassification: classification,
        classificationReason: reason,
        // 保留系統原本的推測分類，即使之後被使用者回報覆寫也不清除（見 reportAsMaterialIssue）
        systemInitialGuess: classification,
      });
    });
  };

  // 使用者「回報此次 Alarm 為材料問題」（spec.md User Story 3、FR-007）。
  // 直接覆寫傳入事件物件的分類，systemInitialGuess 保留原值供畫面比對。
  window.AlarmApp.logic.reportAsMaterialIssue = function (event) {
    event.rootCauseClassification = '材料問題-已回報';
    return event;
  };
})();
