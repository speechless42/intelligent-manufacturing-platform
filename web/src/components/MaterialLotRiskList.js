(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.components = window.AlarmApp.components || {};

  // Vue 元件：材料批號風險 + 本次 7 天資料中「這個批號被用了幾次、命中時出現哪些 Alarm」
  // （spec.md Clarifications 第 3 題 + FR-015 迭代新增：與資料連動，不再只是靜態清單）。
  window.AlarmApp.components.MaterialLotRiskList = {
    props: {
      lots: { type: Array, required: true },
      events: { type: Array, default: () => [] },
    },
    computed: {
      lotsWithStats() {
        return this.lots.map((lot) => {
          const hits = this.events.filter((ev) => ev.materialLotRiskRef === lot.lotId);
          return Object.assign({}, lot, { hits, hitCount: hits.length });
        });
      },
    },
    methods: {
      riskDotClass(level) {
        if (level === '高') return 'risk-dot risk-high';
        if (level === '中') return 'risk-dot risk-medium';
        return 'risk-dot risk-low';
      },
      classificationClass(cls) {
        if (cls === '機構問題') return 'tag tag-mechanism';
        if (cls === '材料問題-已回報') return 'tag tag-material';
        return 'tag tag-component';
      },
    },
    template: `
      <section class="lot-risk-list">
        <h2 class="section-title">材料批號風險與本批命中狀況</h2>
        <p class="section-hint">每個批號在量產前就已知有風險；命中次數是「這批 7 天資料裡，有幾筆 Alarm 剛好發生在這個批號在用的時候」，次數越高代表這個批號的風險越可能是真的造成問題，而不只是紙上談兵。</p>
        <div class="lot-card" v-for="lot in lotsWithStats" :key="lot.lotId">
          <div class="lot-card-header">
            <span :class="riskDotClass(lot.riskLevel)"></span>
            <span class="lot-id mono">{{ lot.lotId }}</span>
            <span class="lot-risk-type">{{ lot.riskType }}</span>
            <span class="lot-hit-count" :class="{ 'has-hits': lot.hitCount > 0 }">本批命中 {{ lot.hitCount }} 次</span>
          </div>
          <p class="lot-action">建議措施：{{ lot.recommendedAction }}</p>
          <details v-if="lot.hitCount > 0" class="lot-hits">
            <summary>查看命中的 {{ lot.hitCount }} 筆 Alarm</summary>
            <ul>
              <li v-for="hit in lot.hits" :key="hit.id">
                <span class="mono">{{ hit.catalogRef }}</span>
                <span class="hit-name">{{ hit.name }}</span>
                <span :class="classificationClass(hit.rootCauseClassification)">{{ hit.rootCauseClassification }}</span>
              </li>
            </ul>
          </details>
        </div>
      </section>
    `,
  };
})();
