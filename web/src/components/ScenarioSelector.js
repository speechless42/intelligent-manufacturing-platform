(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.components = window.AlarmApp.components || {};

  // Vue 元件：情境選單（spec.md User Story 4）。
  window.AlarmApp.components.ScenarioSelector = {
    props: {
      profiles: { type: Array, required: true },
      selected: { type: String, default: null },
    },
    emits: ['select-scenario'],
    template: `
      <div class="scenario-selector">
        <span class="label">或選擇特定情境：</span>
        <button
          v-for="p in profiles"
          :key="p.id"
          type="button"
          :class="['scenario-btn', { active: selected === p.id }]"
          @click="$emit('select-scenario', p.id)"
        >{{ p.label }}</button>
      </div>
    `,
  };
})();
