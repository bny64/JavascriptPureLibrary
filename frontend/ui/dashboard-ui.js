// frontend/ui/dashboard-ui.js - 대시보드 UI 렌더링 (모듈 통합)

import { AppState } from '../state/app-state.js';
import { DashboardSummary } from './dashboard/dashboard-summary.js';
import { DashboardAlerts } from './dashboard/dashboard-alerts.js';
import { DashboardHeatmap } from './dashboard/dashboard-heatmap.js';
import { DashboardCharts } from './dashboard/dashboard-charts.js';

export const DashboardUI = {
    render(tasks) {
        DashboardSummary.renderSummary(tasks);
        DashboardCharts.renderStatusChart(tasks);
        DashboardCharts.renderPriorityChart(tasks);
        DashboardCharts.renderTrendChart(tasks);
        DashboardCharts.renderMonthlyAchievementChart(tasks);
        DashboardCharts.renderCategoryDistributionChart(tasks);
        DashboardCharts.renderLeadTimeChart(tasks);
        DashboardCharts.renderDayOfWeekChart(tasks);
        DashboardAlerts.renderCriticalTasks(tasks);
        DashboardAlerts.renderBottleneckTasks(tasks);
        DashboardAlerts.updateAlertsGridVisibility();
        DashboardHeatmap.renderActivityHeatmap(tasks);
        DashboardCharts.renderCategoryProgress(tasks);

        // 전역 메모(스티커) 렌더링 호출
        if (window.MemoUI) {
            window.MemoUI.render().then(() => {
                this.bindEvents();
            }).catch(err => console.error("Memo render failed:", err));
        }

        // 초기 바인딩 시도
        this.bindEvents();
    },

    bindEvents() {
        const dashboardView = document.getElementById('dashboard-view');
        if (!dashboardView) return;

        const manageBtn = dashboardView.querySelector('.btn-memo');
        if (manageBtn) {
            manageBtn.onclick = null;
            manageBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (window.toggleMemoDrawer) {
                    window.toggleMemoDrawer();
                } else if (window.MemoUI && typeof window.MemoUI.toggleDrawer === 'function') {
                    window.MemoUI.toggleDrawer();
                } else {
                    const drawer = document.getElementById('memoDrawer');
                    if (drawer) {
                        drawer.classList.toggle('open');
                        if (drawer.classList.contains('open') && window.MemoUI) {
                            window.MemoUI.render();
                        }
                    }
                }
            };
        }

        // 트렌드 차트 기간 선택 이벤트 바인딩
        const periodButtons = dashboardView.querySelectorAll('.btn-period');
        periodButtons.forEach(btn => {
            btn.onclick = () => {
                const days = parseInt(btn.dataset.period);
                AppState.currentTrendDays = days;

                periodButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                DashboardCharts.renderTrendChart(AppState.tasks);
            };
        });
    }
};
