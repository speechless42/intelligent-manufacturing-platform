(function () {
  window.AlarmApp = window.AlarmApp || {};
  window.AlarmApp.charts = window.AlarmApp.charts || {};

  // 包裝 Chart.js，畫出「本次 7 天份量各 Alarm 代號次數」長條圖（spec.md FR-009）。
  // 依次數由高到低排序（2026-09-06 修正：先前固定用目錄順序排列，跟「看排名」的直覺不符）。
  // 呼叫端（components/AlarmTable.js）負責在資料變動時重新呼叫本函式並銷毀舊的 chart 實例。
  window.AlarmApp.charts.renderAlarmCountChart = function (canvas, events, catalog) {
    const counts = {};
    catalog.forEach((entry) => {
      counts[entry.code] = 0;
    });
    events.forEach((event) => {
      counts[event.catalogRef] = (counts[event.catalogRef] || 0) + 1;
    });

    const sortedCatalog = [...catalog].sort((a, b) => counts[b.code] - counts[a.code]);
    const labels = sortedCatalog.map((entry) => entry.code + ' ' + entry.name);
    const data = sortedCatalog.map((entry) => counts[entry.code]);

    // 讀取目前主題的 CSS 變數，讓圖表文字/格線跟著淺色/深色主題走（見 styles.css 的 token 設計）
    const rootStyle = getComputedStyle(document.documentElement);
    const inkMuted = rootStyle.getPropertyValue('--ink-muted').trim() || '#5b6472';
    const border = rootStyle.getPropertyValue('--border').trim() || '#dbe1ec';
    const accent = rootStyle.getPropertyValue('--accent').trim() || '#2f6fed';

    return new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '7 天內次數',
            data,
            backgroundColor: accent,
            borderRadius: 4,
            maxBarThickness: 36,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // 關閉進場動畫：本圖表會在使用者每次「隨機產生」/切換情境時被銷毀重建，
        // 若保留動畫，前一個實例尚未播放完的動畫影格偶爾會在畫布已重建後才觸發，
        // 導致 Chart.js 內部對已銷毀的 context 呼叫繪圖方法而噴錯；圖表重繪本身已經夠即時，
        // 進場動畫則交給 Anime.js 處理表格列（見 components/AlarmTable.js 的 animateRows）。
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: inkMuted },
            grid: { color: border },
          },
          x: {
            ticks: { autoSkip: false, maxRotation: 60, minRotation: 0, color: inkMuted },
            grid: { display: false },
          },
        },
      },
    });
  };
})();
