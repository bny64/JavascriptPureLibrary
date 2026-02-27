// frontend/ui/dashboard/dashboard-heatmap.js
import { TextUtils } from '../../utils/dom.js';

export const DashboardHeatmap = {
  renderActivityHeatmap(tasks) {
    const heatmap = document.getElementById('activityHeatmap');
    const monthsEl = document.getElementById('heatmapMonths');
    if (!heatmap || !monthsEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - (26 * 7) - today.getDay());

    const dailyCounts = {};
    tasks.filter(t => t.status === 'completed' && t.endDate).forEach(t => {
      dailyCounts[t.endDate] = (dailyCounts[t.endDate] || 0) + 1;
    });

    let heatmapHtml = '';
    let monthLabelsHtml = '';
    const current = new Date(start);

    let lastMonth = -1;
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    for (let i = 0; i < 189; i++) { // 27주 (약 6개월) 27*7=189
      const dateStr = current.toISOString().split('T')[0];
      const count = dailyCounts[dateStr] || 0;
      const month = current.getMonth();
      const weekIdx = Math.floor(i / 7);

      if (month !== lastMonth && current.getDay() === 0) {
        const offset = weekIdx * 15; // 12px(cell) + 3px(gap) = 15px
        monthLabelsHtml += `<span style="position: absolute; left: ${offset}px; white-space: nowrap;">${monthNames[month]}</span>`;
        lastMonth = month;
      }

      let level = 0;
      if (count > 0) level = 1;
      if (count > 2) level = 2;
      if (count > 4) level = 3;
      if (count > 6) level = 4;

      heatmapHtml += `<div class="heatmap-cell level-${level}" 
                                 data-date="${dateStr}"
                                 title="${dateStr}: ${count}개 완료" 
                                 onclick="window.selectHeatmapDate(this, '${dateStr}')"></div>`;
      current.setDate(current.getDate() + 1);
    }

    monthsEl.style.position = 'relative';
    monthsEl.style.height = '15px';
    monthsEl.innerHTML = monthLabelsHtml;
    heatmap.style.gridAutoFlow = 'column';
    heatmap.innerHTML = heatmapHtml;

    window.selectHeatmapDate = (cell, dateStr) => {
      document.querySelectorAll('.heatmap-cell').forEach(c => c.classList.remove('active'));
      cell.classList.add('active');
      this.renderHeatmapSideList(tasks, dateStr);
    };
  },

  renderHeatmapSideList(tasks, dateStr) {
    const titleEl = document.getElementById('heatmapSelectedDateTitle');
    const listEl = document.getElementById('heatmapSideList');
    if (!titleEl || !listEl) return;

    titleEl.textContent = `📅 ${dateStr} 업무`;

    let dayTasks = tasks.filter(t => t.endDate === dateStr && t.status === 'completed');

    // 우선순위 순으로 정렬
    const priorityOrder = { 'very-high': 1, 'high': 2, 'middle': 3, 'low': 4, 'very-low': 5 };
    dayTasks.sort((a, b) => {
      const pA = priorityOrder[a.priority] || (a.priority === undefined || !a.priority ? 3 : 99);
      const pB = priorityOrder[b.priority] || (b.priority === undefined || !b.priority ? 3 : 99);
      return pA - pB;
    });

    if (dayTasks.length === 0) {
      listEl.innerHTML = '<p style="color: #999; font-size: 12px; margin: 0;">해당 날짜에 완료된<br>업무가 없습니다.</p>';
      return;
    }

    listEl.innerHTML = dayTasks.map(task => `
            <div class="heatmap-side-item status-${task.status}" onclick="window.openTaskModalById('${task.id}')" title="보려면 클릭">
                <div class="heatmap-side-item-title">${TextUtils.escapeHtml(task.taskName)}</div>
                <div class="heatmap-side-item-cat">${task.category1 || '미분류'} > ${task.category2 || '-'}</div>
            </div>
        `).join('');
  }
};
