// frontend/ui/dashboard-ui.js - 대시보드 UI 렌더링 (모듈 통합)

import { AppState } from '../state/app-state.js';
import { DashboardSummary } from './dashboard/dashboard-summary.js';
import { DashboardAlerts } from './dashboard/dashboard-alerts.js';
import { DashboardCharts } from './dashboard/dashboard-charts.js';
import { DashboardHeatmap } from './dashboard/dashboard-heatmap.js';
import { TaskService } from '../services/task-service.js';

export const DashboardUI = {
    async render(tasks) {
        if (document.getElementById('dashboard-view')?.style.display !== 'block') return;

        // 1. 요약 카드 렌더링
        DashboardSummary.renderSummary(tasks);

        // 2. 긴급/병목 알림 렌더링
        DashboardAlerts.renderAlerts(tasks);

        // 3. 차트 렌더링
        DashboardCharts.renderStatusChart(tasks);
        DashboardCharts.renderPriorityChart(tasks);
        DashboardCharts.renderMonthlyAchievementChart(tasks);
        DashboardCharts.renderCategoryDistributionChart(tasks);
        DashboardCharts.renderLeadTimeChart(tasks);
        DashboardCharts.renderDayOfWeekChart(tasks);
        DashboardCharts.renderTrendChart(tasks);
        DashboardCharts.renderCategoryProgress(tasks);

        // 4. 히트맵 렌더링
        DashboardHeatmap.renderHeatmap(tasks);

        // 5. 업무 보관 및 복구 버튼 설정
        this._setupActionButtons();
    },

    async _setupActionButtons() {
        const archiveBtn = document.getElementById('archiveOldTasksBtn');
        const restoreBtn = document.getElementById('restoreAllTasksBtn');

        if (archiveBtn) {
            archiveBtn.onclick = () => TaskService.archiveOldTasks();
        }

        if (restoreBtn) {
            // 보관된 업무가 있는지 확인
            const archivedTasks = await TaskService.loadArchivedTasks();
            if (archivedTasks.length > 0) {
                restoreBtn.style.display = 'block';
                restoreBtn.textContent = `🔄 보관 업무 전체 복구 (${archivedTasks.length}건)`;
                restoreBtn.onclick = () => TaskService.restoreAllTasks();
            } else {
                restoreBtn.style.display = 'none';
            }
        }
    },

    bindEvents() {
        // 트렌드 기간 선택 버튼 이벤트 바인딩
        const periodButtons = document.querySelectorAll('.btn-period');
        periodButtons.forEach(btn => {
            btn.onclick = () => {
                const period = parseInt(btn.dataset.period);
                AppState.currentTrendDays = period;

                periodButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                DashboardCharts.renderTrendChart(AppState.tasks);
            };
        });
    }
};
