// frontend/ui/dashboard/dashboard-charts.js
import { TextUtils } from '../../utils/dom.js';
import { AppState } from '../../state/app-state.js';

let chartInstances = {};

export const DashboardCharts = {
  renderStatusChart(tasks) {
    const canvas = document.getElementById('statusChartCanvas');
    if (!canvas) return;

    const statusMap = {
      'pending': '대기',
      'in-progress': '진행중',
      'completed': '완료',
      'on-hold': '보류'
    };

    const counts = {
      'pending': tasks.filter(t => t.status === 'pending').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      'completed': tasks.filter(t => t.status === 'completed').length,
      'on-hold': tasks.filter(t => t.status === 'on-hold').length
    };
    const colors = ['#ffc107', '#2196f3', '#4caf50', '#9e9e9e'];

    if (chartInstances.status) chartInstances.status.destroy();

    chartInstances.status = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts).map(k => statusMap[k] || k),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        },
        onClick: async (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const status = Object.keys(counts)[index];
            const { openAllTasksModalWithStatus } = await import('../../modules/all-tasks-modal.js');
            openAllTasksModalWithStatus(status);
          }
        }
      }
    });
  },

  renderPriorityChart(tasks) {
    const canvas = document.getElementById('priorityChartCanvas');
    if (!canvas) return;

    const labels = ['매우 높음', '높음', '중간', '낮음', '매우 낮음'];
    const counts = [
      tasks.filter(t => t.priority === 'very-high').length,
      tasks.filter(t => t.priority === 'high').length,
      tasks.filter(t => t.priority === 'middle' || !t.priority).length,
      tasks.filter(t => t.priority === 'low').length,
      tasks.filter(t => t.priority === 'very-low').length
    ];
    const colors = ['#e53935', '#fb8c00', '#3f51b5', '#4caf50', '#607d8b'];

    if (chartInstances.priority) chartInstances.priority.destroy();

    chartInstances.priority = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '업무 수',
          data: counts,
          backgroundColor: colors,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        },
        onClick: async (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const keys = ['very-high', 'high', 'middle', 'low', 'very-low'];
            const { openAllTasksModalWithPriority } = await import('../../modules/all-tasks-modal.js');
            openAllTasksModalWithPriority(keys[index]);
          }
        }
      }
    });
  },

  renderMonthlyAchievementChart(tasks) {
    const canvas = document.getElementById('monthlyAchievementChartCanvas');
    if (!canvas) return;

    const months = [];
    const achievementRates = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      months.push(`${month}월`);

      const monthTasks = tasks.filter(t => t.endDate && t.endDate.startsWith(monthStr));
      const total = monthTasks.length;
      const completed = monthTasks.filter(t => t.status === 'completed').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      achievementRates.push(rate);
    }

    if (chartInstances.monthly) chartInstances.monthly.destroy();

    chartInstances.monthly = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: '업무 달성도 (%)',
          data: achievementRates,
          borderColor: '#673ab7',
          backgroundColor: 'rgba(103, 58, 183, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });
  },

  renderCategoryDistributionChart(tasks) {
    const canvas = document.getElementById('categoryDistributionChartCanvas');
    if (!canvas) return;

    const catCounts = {};
    tasks.forEach(t => {
      const cat = t.category1 || '미분류';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const sortedCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const labels = sortedCats.map(c => c[0]);
    const counts = sortedCats.map(c => c[1]);
    const colors = ['#009688', '#3f51b5', '#ff9800', '#f44336', '#9c27b0'];

    if (chartInstances.distribution) chartInstances.distribution.destroy();

    chartInstances.distribution = new window.Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: colors,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  renderLeadTimeChart(tasks) {
    const canvas = document.getElementById('leadTimeChartCanvas');
    if (!canvas) return;

    const catLeadTimes = {};
    tasks.filter(t => t.status === 'completed' && t.createdAt && t.endDate).forEach(t => {
      const cat = t.category1 || '미분류';
      const start = new Date(t.createdAt);
      const end = new Date(t.endDate);
      const diffDays = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

      if (!catLeadTimes[cat]) catLeadTimes[cat] = { totalDays: 0, count: 0 };
      catLeadTimes[cat].totalDays += diffDays;
      catLeadTimes[cat].count++;
    });

    const sortedAvgLeadTimes = Object.entries(catLeadTimes)
      .map(([cat, stats]) => ({
        category: cat,
        avgDays: Math.round((stats.totalDays / stats.count) * 10) / 10
      }))
      .sort((a, b) => b.avgDays - a.avgDays)
      .slice(0, 10);

    const labels = sortedAvgLeadTimes.map(i => i.category);
    const data = sortedAvgLeadTimes.map(i => i.avgDays);

    if (chartInstances.leadTime) chartInstances.leadTime.destroy();

    chartInstances.leadTime = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '평균 소요 시간 (일)',
          data: data,
          backgroundColor: '#03a9f4',
        }]
      },
      options: {
        indexAxis: 'y', // 가로 막대 차트
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: '일수' } }
        }
      }
    });
  },

  renderDayOfWeekChart(tasks) {
    const canvas = document.getElementById('dayOfWeekChartCanvas');
    if (!canvas) return;

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    tasks.filter(t => t.status === 'completed' && t.endDate).forEach(t => {
      const date = new Date(t.endDate);
      if (date >= ninetyDaysAgo) {
        dayCounts[date.getDay()]++;
      }
    });

    if (chartInstances.dayOfWeek) chartInstances.dayOfWeek.destroy();

    chartInstances.dayOfWeek = new window.Chart(canvas, {
      type: 'radar',
      data: {
        labels: dayNames,
        datasets: [{
          label: '요일별 완료 업무 수',
          data: dayCounts,
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          borderColor: '#ff9800',
          pointBackgroundColor: '#ff9800',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            ticks: { stepSize: 1, display: false }
          }
        }
      }
    });
  },

  renderTrendChart(tasks) {
    const canvas = document.getElementById('trendChartCanvas');
    if (!canvas) return;

    const labels = [];
    const completedData = [];
    const createdData = [];

    const today = new Date();
    const days = AppState.currentTrendDays || 7;

    // 버튼 상태 동기화
    const periodButtons = document.querySelectorAll('.btn-period');
    periodButtons.forEach(btn => {
      if (parseInt(btn.dataset.period) === days) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      let displayStr = `${d.getMonth() + 1}/${d.getDate()}`;
      if (days >= 180) {
        displayStr = `${d.getMonth() + 1}/${d.getDate()}`;
      }
      labels.push(displayStr);

      const completed = tasks.filter(t => t.status === 'completed' && t.endDate === dateStr).length;
      completedData.push(completed);

      const created = tasks.filter(t => t.createdAt && t.createdAt.startsWith(dateStr)).length;
      createdData.push(created);
    }

    if (chartInstances.trend) chartInstances.trend.destroy();

    chartInstances.trend = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '완료된 업무',
            data: completedData,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: days > 31 ? 0 : 3,
            fill: true
          },
          {
            label: '신규 생성 업무',
            data: createdData,
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: days > 31 ? 0 : 3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: {
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: days > 60 ? 12 : 15
            },
            grid: { display: false }
          }
        }
      }
    });
  },

  renderCategoryProgress(tasks) {
    const container = document.getElementById('categoryProgressList');
    if (!container) return;

    const catStats = {};
    tasks.forEach(task => {
      const cat = task.category1 || '미분류';
      if (!catStats[cat]) catStats[cat] = { total: 0, completed: 0 };
      catStats[cat].total++;
      if (task.status === 'completed') catStats[cat].completed++;
    });

    container.innerHTML = Object.keys(catStats).sort().map(cat => {
      const stats = catStats[cat];
      const percent = Math.round((stats.completed / stats.total) * 100);
      const escapedCat = cat.replace(/'/g, "\\'");
      return `<div class="cat-progress-item cursor-pointer" data-category="${escapedCat}" title="클릭하여 '${escapedCat}' 업무 목록 보기">
                <div class="cat-progress-header">
                    <span class="cat-name">${TextUtils.escapeHtml(cat)}</span>
                    <span class="cat-percent">${percent}% (${stats.completed}/${stats.total})</span>
                </div>
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-fill" style="width:${percent}%;background-color:#11998e"></div>
                </div>
            </div>`;
    }).join('');

    container.querySelectorAll('.cat-progress-item').forEach(item => {
      item.addEventListener('click', async () => {
        const cat = item.getAttribute('data-category');
        const { openAllTasksModalWithCategory } = await import('../../modules/all-tasks-modal.js');
        openAllTasksModalWithCategory(cat);
      });
    });
  }
};
