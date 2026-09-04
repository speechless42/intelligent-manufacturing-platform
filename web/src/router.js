(function () {
  window.AlarmApp = window.AlarmApp || {};

  // 用 hash history（網址帶 #/home、#/data）：不需要伺服器端路由設定，
  // 開啟本機檔案（file://）或 Artifact 都能直接運作（2026-09-06 迭代新增）。
  const { createRouter, createWebHashHistory } = VueRouter;

  window.AlarmApp.router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', redirect: '/home' },
      { path: '/home', name: 'home', component: AlarmApp.views.HomeView },
      { path: '/data', name: 'data', component: AlarmApp.views.DataView },
    ],
  });
})();
