(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.logic = window.AlarmApp.logic || {};

  function randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomInt(min, max) {
    return Math.floor(randomInRange(min, max + 1));
  }

  function pickWeighted(catalog, weighting) {
    const entries = catalog.map((entry) => ({
      entry,
      weight: (weighting && weighting[entry.code]) || 1,
    }));
    const total = entries.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * total;
    for (const e of entries) {
      if (roll < e.weight) return e.entry;
      roll -= e.weight;
    }
    return entries[entries.length - 1].entry;
  }

  const SEVERITY_BIAS_OPTIONS = ['normal-drift', 'mixed', 'severe'];

  // 把 7 天窗口切成幾個「生產批次」，讓使用者能看出同一個 Alarm 代號是分散在不同批次
  // 各發生一兩次（比較不用擔心），還是集中在同一批（比較該留意這批是不是有特殊狀況）
  // （spec.md FR-020，2026-09-06 迭代新增）。批次數量依本次事件量抓一個合理範圍，不對應真實日期。
  function generateBatches(totalCount) {
    const batchCount = Math.max(4, Math.min(10, Math.round(totalCount / 8)));
    const cutPoints = [];
    for (let i = 0; i < batchCount - 1; i++) {
      cutPoints.push(randomInRange(0.4, 6.6));
    }
    cutPoints.sort((a, b) => a - b);
    const bounds = [0, ...cutPoints, 7];
    return bounds.slice(0, -1).map((start, i) => ({
      id: 'batch-' + (i + 1),
      label: '第 ' + (i + 1) + ' 批',
      start,
      end: bounds[i + 1],
    }));
  }

  function findBatch(batches, offset) {
    return batches.find((b) => offset >= b.start && offset <= b.end) || batches[batches.length - 1];
  }

  // 依情境設定（見 scenarios/scenario-profiles.js）從 Alarm 目錄與材料批號清單，
  // 抽樣出一批「7 天份量」的 AlarmEvent（含伴隨遙測快照），純函式、不依賴 Vue。
  // 對應 spec.md FR-001、FR-002；資料模型見 data-model.md §4、§5。
  window.AlarmApp.logic.generateEvents = function (profile, catalog, materialLotRisks) {
    const [minVol, maxVol] = profile.eventVolumeRange;
    const totalCount = randomInt(minVol, maxVol);
    const batches = generateBatches(totalCount);

    const trend = profile.randomizeTrends
      ? {
          vacuumDecline: Math.random() < 0.5,
          bondForceSeverityBias: SEVERITY_BIAS_OPTIONS[randomInt(0, SEVERITY_BIAS_OPTIONS.length - 1)],
        }
      : profile.telemetryTrendRules || {};

    const materialLotHitProbability = profile.randomizeTrends
      ? Math.random() * 0.4
      : profile.materialLotHitProbability || 0;

    const draws = [];
    for (let i = 0; i < totalCount; i++) {
      draws.push({
        catalogEntry: pickWeighted(catalog, profile.catalogWeighting),
        timestampOffset: randomInRange(0, 7),
      });
    }
    // 依模擬時間排序，才能疊加「趨勢」與「累積動作次數」效果（不對應真實日曆時間，FR-001）
    draws.sort((a, b) => a.timestampOffset - b.timestampOffset);

    let cumulativeCycleCount = randomInt(500, 2000);

    return draws.map((draw, index) => {
      const entry = draw.catalogEntry;
      const baseline = entry.telemetryBaseline || { vacuum: [75, 95], bondForce: [80, 120] };
      const progress = totalCount > 1 ? index / (totalCount - 1) : 0;

      let vacuumLevel;
      let vacuumTrend = 'stable';
      if (trend.vacuumDecline) {
        const declineAmount = (baseline.vacuum[1] - baseline.vacuum[0]) * 0.6 * progress;
        vacuumLevel = Math.round(baseline.vacuum[1] - declineAmount - randomInRange(0, 3));
        vacuumTrend = progress > 0.3 ? 'declining' : 'stable';
      } else {
        vacuumLevel = Math.round(randomInRange(baseline.vacuum[0], baseline.vacuum[1]));
      }

      const severityBias = trend.bondForceSeverityBias || 'normal-drift';
      let bondForceSeverity = 'normal-drift';
      let bondForceValue = Math.round(randomInRange(baseline.bondForce[0], baseline.bondForce[1]));
      const severeRoll = Math.random();
      if (severityBias === 'severe' && severeRoll < 0.5) {
        bondForceSeverity = 'severe';
        bondForceValue = Math.round(baseline.bondForce[1] * randomInRange(1.3, 1.6));
      } else if (severityBias === 'mixed' && severeRoll < 0.2) {
        bondForceSeverity = 'severe';
        bondForceValue = Math.round(baseline.bondForce[1] * randomInRange(1.3, 1.5));
      }

      cumulativeCycleCount += randomInt(50, 400);

      const visionConfidenceScore = Number(randomInRange(0.55, 0.99).toFixed(2));

      let materialLotRiskRef = null;
      if (materialLotRisks.length > 0 && Math.random() < materialLotHitProbability) {
        materialLotRiskRef = materialLotRisks[randomInt(0, materialLotRisks.length - 1)].lotId;
      }

      const batch = findBatch(batches, draw.timestampOffset);

      return {
        id: 'evt-' + index + '-' + Math.random().toString(36).slice(2, 8),
        catalogRef: entry.code,
        name: entry.name,
        description: entry.description,
        possibleRootCauses: entry.possibleRootCauses,
        reasoningSignal: entry.reasoningSignal,
        timestampOffset: draw.timestampOffset,
        batchId: batch.id,
        batchLabel: batch.label,
        materialLotRiskRef,
        telemetry: {
          vacuumLevel,
          vacuumTrend,
          cumulativeCycleCount,
          bondForceValue,
          bondForceSeverity,
          visionConfidenceScore,
        },
      };
    });
  };
})();
