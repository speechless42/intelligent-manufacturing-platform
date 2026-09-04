(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.components = window.AlarmApp.components || {};

  // Vue 元件：曖昧 Alarm 的推測分類理由、材料風險命中提示與回報按鈕
  // （spec.md User Story 2、User Story 3）。
  window.AlarmApp.components.AlarmDetailPanel = {
    props: {
      event: { type: Object, default: null },
    },
    emits: ['close', 'report-material'],
    watch: {
      event(newVal) {
        if (newVal && window.anime) {
          this.$nextTick(() => {
            if (this.$refs.panel) {
              anime({
                targets: this.$refs.panel,
                opacity: [0, 1],
                translateY: [-12, 0],
                duration: 300,
                easing: 'easeOutQuad',
              });
            }
          });
        }
      },
    },
    methods: {
      isMaterialReported(event) {
        return event.rootCauseClassification === '材料問題-已回報';
      },
      lotRisk(lotId) {
        return AlarmApp.data.getLotRisk(lotId);
      },
      riskDotClass(riskLevel) {
        if (riskLevel === '高') return 'risk-dot risk-high';
        if (riskLevel === '中') return 'risk-dot risk-medium';
        return 'risk-dot risk-low';
      },
    },
    template: `
      <aside v-if="event" class="detail-panel" ref="panel">
        <button class="close-btn" type="button" aria-label="關閉詳情" @click="$emit('close')">×</button>
        <p class="eyebrow mono">{{ event.catalogRef }} ・ {{ event.batchLabel }}</p>
        <h3>{{ event.name }}</h3>
        <p v-if="event.description" class="alarm-description">{{ event.description }}</p>
        <p class="current-class">目前分類：<strong>{{ event.rootCauseClassification }}</strong></p>
        <p v-if="event.classificationReason" class="reason">{{ event.classificationReason }}</p>
        <p v-if="event.rootCauseClassification !== event.systemInitialGuess" class="compare">
          系統原判斷 <strong>{{ event.systemInitialGuess }}</strong> ／ 使用者回報 <strong>{{ event.rootCauseClassification }}</strong>
        </p>
        <div v-if="event.materialLotRiskRef" class="material-hint">
          <p>
            <span :class="riskDotClass(lotRisk(event.materialLotRiskRef) && lotRisk(event.materialLotRiskRef).riskLevel)"></span>
            命中材料批號風險 <span class="mono">{{ event.materialLotRiskRef }}</span>
            <span v-if="lotRisk(event.materialLotRiskRef)">— {{ lotRisk(event.materialLotRiskRef).riskType }}</span>
          </p>
          <button type="button" v-if="!isMaterialReported(event)" @click="$emit('report-material', event.id)">
            回報此次 Alarm 為材料問題
          </button>
        </div>
        <p class="telemetry-heading">伴隨機台參數</p>
        <div class="telemetry">
          <div class="telemetry-item">
            <div class="t-row"><span class="t-label">真空度</span><span class="t-value mono">{{ event.telemetry.vacuumLevel }}<span class="unit">（{{ event.telemetry.vacuumTrend }}）</span></span></div>
            <p class="t-hint">吸附壓力。持續下降 → 疑似管路漏氣（傾向機構問題）；平穩範圍內的異常 → 疑似吸嘴堵塞（傾向部品問題）。</p>
          </div>
          <div class="telemetry-item">
            <div class="t-row"><span class="t-label">累積動作次數</span><span class="t-value mono">{{ event.telemetry.cumulativeCycleCount }}</span></div>
            <p class="t-hint">自上次保養以來的動作次數，次數本身沒有對錯，但數字越高代表零件磨損風險越高——搭配 Alarm 一起看，次數偏高的機台該優先排保養。</p>
          </div>
          <div class="telemetry-item">
            <div class="t-row"><span class="t-label">Bond Force</span><span class="t-value mono">{{ event.telemetry.bondForceValue }}<span class="unit">（{{ event.telemetry.bondForceSeverity }}）</span></span></div>
            <p class="t-hint">下壓/接合力道。偶發輕微異常屬於正常調機漂移；嚴重或頻繁異常才會被判定為機構問題。</p>
          </div>
          <div class="telemetry-item">
            <div class="t-row"><span class="t-label">影像辨識信心分數</span><span class="t-value mono">{{ event.telemetry.visionConfidenceScore }}</span></div>
            <p class="t-hint">合成模擬分數（非真實影像 AI 推論），數值越低代表這次辨識結果越不可靠。</p>
          </div>
          <div class="telemetry-item">
            <div class="t-row"><span class="t-label">派工對象</span><span class="t-value">{{ event.dispatchTarget }}</span></div>
          </div>
        </div>
      </aside>
    `,
  };
})();
