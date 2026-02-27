// frontend/ui/dashboard/dashboard-alerts.js
import { TextUtils } from '../../utils/dom.js';

export const DashboardAlerts = {
  updateAlertsGridVisibility() {
    const critical = document.getElementById('criticalTasksSection');
    const bottleneck = document.getElementById('bottleneckSection');
    const grid = document.querySelector('.dashboard-alerts-grid');
    if (!grid || !critical || !bottleneck) return;

    if (critical.style.display === 'none' && bottleneck.style.display === 'none') {
      grid.style.display = 'none';
    } else {
      grid.style.display = 'grid';
    }
  },

  renderCriticalTasks(tasks) {
    const section = document.getElementById('criticalTasksSection');
    const listContainer = document.getElementById('criticalTaskList');
    const countBadge = document.getElementById('criticalTaskCount');
    if (!section || !listContainer) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const critical = tasks.filter(t => {
      if (t.status === 'completed' || !t.endDate) return false;
      const endDate = new Date(t.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate <= today;
    });

    if (critical.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    countBadge.textContent = critical.length;

    critical.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

    listContainer.innerHTML = critical.map(task => {
      const isOverdue = task.endDate < todayStr;
      const badgeClass = isOverdue ? 'badge-overdue' : 'badge-today';
      const badgeText = isOverdue ? '연체' : '오늘 마감';

      return `
                <div class="critical-task-item" data-task-id="${task.id}">
                    <div class="critical-task-info">
                        <div class="critical-task-title">${TextUtils.escapeHtml(task.taskName)}</div>
                        <div class="critical-task-meta">
                            <span>📅 마감일: ${task.endDate}</span> | 
                            <span>📁 ${task.category1 || '미분류'}</span>
                        </div>
                    </div>
                    <div class="critical-task-badge ${badgeClass}">${badgeText}</div>
                </div>
            `;
    }).join('');

    listContainer.querySelectorAll('.critical-task-item').forEach(item => {
      item.addEventListener('click', async () => {
        const taskId = item.getAttribute('data-task-id');
        const { openTaskModalById } = await import('../../main.js');
        // Assuming openTaskModalById is exported or we can just import the modal module
        // It's cleaner to import from main or openTaskModal. Actually openTaskModalById is global or in main.js. Let's use the global window.openTaskModalById for simplicity or import it properly if we can.
        if (window.openTaskModalById) window.openTaskModalById(taskId);
      });
    });
  },

  renderBottleneckTasks(tasks) {
    const section = document.getElementById('bottleneckSection');
    const listContainer = document.getElementById('bottleneckList');
    const countBadge = document.getElementById('bottleneckCount');
    if (!section || !listContainer) return;

    const today = new Date();
    const bottleneckThreshold = 14;

    const bottleneckTasks = tasks.filter(t => {
      if (t.status === 'completed' || !t.createdAt) return false;
      const createdAt = new Date(t.createdAt);
      const diffDays = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
      return diffDays >= bottleneckThreshold;
    });

    if (bottleneckTasks.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    countBadge.textContent = bottleneckTasks.length;

    bottleneckTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    listContainer.innerHTML = bottleneckTasks.map(task => {
      const createdAt = new Date(task.createdAt);
      const diffDays = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
      const statusLabel = { 'pending': '대기', 'in-progress': '진행중', 'on-hold': '보류' }[task.status] || task.status;

      return `
                <div class="bottleneck-item" data-task-id="${task.id}">
                    <div class="bottleneck-info">
                        <div class="bottleneck-title">${TextUtils.escapeHtml(task.taskName)}</div>
                        <div class="bottleneck-meta">
                            <span>상태: <strong>${statusLabel}</strong></span> | 
                            <span>생성일: ${task.createdAt.split('T')[0]}</span>
                        </div>
                    </div>
                    <div class="bottleneck-days-warning">${diffDays}일째 정체 중</div>
                </div>
            `;
    }).join('');

    listContainer.querySelectorAll('.bottleneck-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.openTaskModalById) window.openTaskModalById(item.getAttribute('data-task-id'));
      });
    });
  }
};
