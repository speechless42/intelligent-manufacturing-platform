(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.components = window.AlarmApp.components || {};

  // Vue 選項式元件：Alarm 統計圖表 + 依代號彙總的清單（spec.md User Story 1、FR-018/FR-019）。
  // 2026-09-06 重寫：原本是「每筆事件一列」的流水帳（同一個代號會重複出現很多列、且照時間排序
  // 看不出誰的次數比較高），改成依代號彙總、依次數由高到低排序，並加上「本批狀態」（單次發生／
  // 重複發生）——重複發生且其中有機構/材料問題時，代表這個問題被升級處理過、卻在同一批 7 天資料
  // 裡又再次出現，值得特別標示出來讓使用者知道「可能沒有真的解決」。
  window.AlarmApp.components.AlarmTable = {
    props: {
      events: { type: Array, required: true },
    },
    emits: ['select-event'],
    data() {
      return { chartInstance: null, expandedCodes: {} };
    },
    computed: {
      summaryRows() {
        const byCode = {};
        this.events.forEach((ev) => {
          if (!byCode[ev.catalogRef]) {
            byCode[ev.catalogRef] = {
              code: ev.catalogRef,
              name: ev.name,
              description: ev.description,
              events: [],
            };
          }
          byCode[ev.catalogRef].events.push(ev);
        });

        return Object.values(byCode)
          .map((group) => {
            const count = group.events.length;
            const classCounts = {};
            group.events.forEach((ev) => {
              classCounts[ev.rootCauseClassification] = (classCounts[ev.rootCauseClassification] || 0) + 1;
            });
            const seriousCount = group.events.filter(
              (ev) => ev.rootCauseClassification === '機構問題' || ev.rootCauseClassification === '材料問題-已回報'
            ).length;
            const escalated = group.events.some((ev) => ev.dispatchTarget === '主管們');

            let status = '單次發生';
            if (count > 1) {
              status = seriousCount > 0 ? '重複發生・待商議' : '重複發生・持續觀察';
            }

            // 依批次彙總這個代號的分布：集中在少數幾批 vs. 分散在很多批，是判斷「這次高頻算不算
            // 真的異常」的重要線索（spec.md FR-020）——分散代表比較像正常的隨機波動，
            // 集中在同一批則值得留意那一批是否有特殊狀況。
            const batchCounts = {};
            group.events.forEach((ev) => {
              batchCounts[ev.batchLabel] = (batchCounts[ev.batchLabel] || 0) + 1;
            });
            const batchSpan = Object.keys(batchCounts).length;

            return {
              code: group.code,
              name: group.name,
              description: group.description,
              count,
              classCounts,
              batchCounts,
              batchSpan,
              dispatchTarget: escalated ? '主管們' : '設備工程師',
              status,
              events: [...group.events].sort((a, b) => a.timestampOffset - b.timestampOffset),
            };
          })
          .sort((a, b) => b.count - a.count);
      },
    },
    watch: {
      events: {
        handler() {
          this.expandedCodes = {};
          this.$nextTick(() => {
            this.renderChart();
            this.animateRows();
          });
        },
      },
    },
    mounted() {
      this.renderChart();
    },
    beforeUnmount() {
      if (this.chartInstance) this.chartInstance.destroy();
    },
    methods: {
      renderChart() {
        const canvas = this.$refs.chartCanvas;
        if (!canvas) return;
        if (this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = AlarmApp.charts.renderAlarmCountChart(canvas, this.events, AlarmApp.data.alarmCatalog);
      },
      animateRows() {
        if (window.anime && this.$el && this.$el.querySelectorAll) {
          const rows = this.$el.querySelectorAll('.alarm-summary-row');
          const perRowDelay = Math.min(30, 400 / Math.max(rows.length, 1));
          anime({
            targets: rows,
            opacity: [0, 1],
            translateX: [-8, 0],
            delay: anime.stagger(perRowDelay),
            duration: 220,
            easing: 'easeOutQuad',
          });
        }
      },
      toggleExpand(code) {
        this.expandedCodes = Object.assign({}, this.expandedCodes, { [code]: !this.expandedCodes[code] });
      },
      dispatchClass(target) {
        return target === '主管們' ? 'badge badge-escalate' : 'badge badge-normal';
      },
      statusClass(status) {
        if (status === '重複發生・待商議') return 'badge status-discuss';
        if (status === '重複發生・持續觀察') return 'badge status-watch';
        return 'badge status-single';
      },
      classificationClass(cls) {
        if (cls === '機構問題') return 'tag tag-mechanism';
        if (cls === '材料問題-已回報') return 'tag tag-material';
        return 'tag tag-component';
      },
    },
    template:
      '<section class="alarm-table">' +
      '<div class="chart-wrap" v-if="events.length"><canvas ref="chartCanvas"></canvas></div>' +
      '<p v-if="events.length" class="section-hint">依本批 7 天資料中的發生次數由高到低排列；派工對象只在每個 Alarm 的標題列顯示一次——只要其中任何一次需要升級，整個 Alarm 就標示「主管們」，個別發生不重複顯示。「重複發生」代表同一個 Alarm 代號在這批資料裡出現不只一次——如果其中包含機構或材料問題，代表升級處理過後同一問題又再度發生，值得進一步商議是否真的解決了。「跨 N 批」與批次分布顯示這些發生分散在幾個生產批次：分散在越多批，越像是正常的隨機波動；集中在少數幾批，比較該留意那幾批是不是有特殊狀況。</p>' +
      '<div v-if="events.length" class="alarm-summary-row" v-for="row in summaryRows" :key="row.code">' +
      '<div class="summary-row-header" @click="toggleExpand(row.code)">' +
      '<span class="expand-caret" :class="{ open: expandedCodes[row.code] }">▸</span>' +
      '<span class="mono code-cell">{{ row.code }}</span>' +
      '<span class="name-cell" :title="row.description">{{ row.name }}</span>' +
      '<span class="count-cell mono">{{ row.count }} 次</span>' +
      '<span v-if="row.count > 1" class="batch-span mono">跨 {{ row.batchSpan }} 批</span>' +
      '<span :class="statusClass(row.status)">{{ row.status }}</span>' +
      '<span :class="dispatchClass(row.dispatchTarget)">{{ row.dispatchTarget }}</span>' +
      '</div>' +
      '<div class="class-breakdown">' +
      '<span v-for="(n, cls) in row.classCounts" :key="cls" :class="classificationClass(cls)">{{ cls }} × {{ n }}</span>' +
      '</div>' +
      '<p v-if="row.count > 1" class="batch-breakdown">批次分布：' +
      '<span v-for="(n, label) in row.batchCounts" :key="label" class="mono">{{ label }}×{{ n }}　</span>' +
      '</p>' +
      '<div v-if="expandedCodes[row.code]" class="summary-row-detail">' +
      '<div class="event-line" v-for="ev in row.events" :key="ev.id" @click="$emit(\'select-event\', ev)">' +
      '<span class="mono batch-tag">{{ ev.batchLabel }}</span>' +
      '<span class="mono muted">#{{ ev.timestampOffset.toFixed(1) }}d</span>' +
      '<span :class="classificationClass(ev.rootCauseClassification)">{{ ev.rootCauseClassification }}</span>' +
      '<span v-if="ev.materialLotRiskRef" class="mono muted">⚠ {{ ev.materialLotRiskRef }}</span>' +
      '<span class="view-link">查看詳情</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<p v-if="!events.length" class="empty-state">尚未產生資料，請點擊上方「隨機產生」或選擇一種情境。</p>' +
      '</section>',
  };
})();
