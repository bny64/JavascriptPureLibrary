// frontend/ui/dashboard/dashboard-summary.js
import { TextUtils } from '../../utils/dom.js';

export const DashboardSummary = {
  renderSummary(tasks) {
    const container = document.getElementById('dashboardSummary');
    if (!container) return;

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const stats = [
      { label: '전체 업무', value: total, icon: '📋', status: '전체' },
      { label: '대기 업무', value: pending, icon: '🟡', status: 'pending' },
      { label: '진행 중', value: inProgress, icon: '🔵', status: 'in-progress' },
      { label: '완료 업무', value: completed, icon: '✅', status: 'completed' },
      { label: '전체 진행률', value: `${progressPercent}%`, icon: '📈', status: null }
    ];

    container.innerHTML = stats.map(stat => {
      const clickable = stat.status !== null;
      const dataAttr = clickable ? `data-status="${stat.status}"` : '';
      const cursor = clickable ? 'cursor-pointer' : '';
      return `<div class="summary-card ${cursor}" ${dataAttr}>
                <div class="icon">${stat.icon}</div>
                <div class="content-wrapper">
                    <div class="value">${stat.value}</div>
                    <div class="label">${stat.label}</div>
                </div>
            </div>`;
    }).join('');

    container.querySelectorAll('.summary-card.cursor-pointer').forEach(card => {
      card.addEventListener('click', async () => {
        const status = card.getAttribute('data-status');
        const { openAllTasksModalWithStatus } = await import('../../modules/all-tasks-modal.js');
        openAllTasksModalWithStatus(status);
      });
    });
  }
};
