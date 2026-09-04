(function () {
  window.AlarmApp = window.AlarmApp || {};

  const { createApp } = Vue;

  // 根元件（2026-09-06 迭代重寫）：只負責固定的頁首/導覽列，實際內容交給 vue-router 的
  // <router-view>（介紹頁 HomeView／資料頁 DataView），共用狀態放在 store.js。
  const RootApp = {
    template: `
      <div class="app-shell">
        <header>
          <p class="eyebrow">個人作品 · 合成資料展示</p>
          <h1>設備 Alarm 根因分析台</h1>
          <p class="subtitle">7 天份量 Alarm 統計、根因分類與派工建議 — 非真實機台資料</p>
          <nav class="top-nav">
            <router-link to="/home" active-class="active">介紹</router-link>
            <router-link to="/data" active-class="active">資料</router-link>
          </nav>
        </header>
        <router-view></router-view>
      </div>
    `,
  };

  const app = createApp(RootApp);
  app.use(AlarmApp.router);
  app.mount('#app');
})();
