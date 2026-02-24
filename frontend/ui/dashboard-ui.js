// ui/dashboard-ui.js - 대시보드 UI 렌더링

import { TextUtils } from '../utils/dom.js';

let chartInstances = {};

export const DashboardUI = {
    render(tasks) {
        this.renderSummary(tasks);
        this.renderStatusChart(tasks);
        this.renderPriorityChart(tasks);
        this.renderCategoryProgress(tasks);
    },

    renderSummary(tasks) {
        const container = document.getElementById('dashboardSummary');
        if (!container) return;

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === '완료').length;
        const inProgress = tasks.filter(t => t.status === '진행중').length;
        const pending = tasks.filter(t => t.status === '대기').length;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const stats = [
            { label: '전체 업무', value: total, icon: '📋', status: '전체' },
            { label: '대기 업무', value: pending, icon: '🟡', status: '대기' },
            { label: '진행 중', value: inProgress, icon: '🔵', status: '진행중' },
            { label: '완료 업무', value: completed, icon: '✅', status: '완료' },
            { label: '전체 진행률', value: `${progressPercent}%`, icon: '📈', status: null }
        ];

        container.innerHTML = stats.map(stat => {
            const clickable = stat.status !== null;
            const onclick = clickable ? `onclick="window.openAllTasksModalWithStatus('${stat.status}')"` : '';
            const cursor = clickable ? 'cursor-pointer' : '';
            return `<div class="summary-card ${cursor}" ${onclick}>
                <div class="icon">${stat.icon}</div>
                <div class="value">${stat.value}</div>
                <div class="label">${stat.label}</div>
            </div>`;
        }).join('');
    },

    renderStatusChart(tasks) {
        const canvas = document.getElementById('statusChartCanvas');
        if (!canvas) return;

        const counts = {
            '대기': tasks.filter(t => t.status === '대기').length,
            '진행중': tasks.filter(t => t.status === '진행중').length,
            '완료': tasks.filter(t => t.status === '완료').length,
            '보류': tasks.filter(t => t.status === '보류').length
        };
        const colors = ['#ffc107', '#2196f3', '#4caf50', '#9e9e9e'];

        if (chartInstances.status) chartInstances.status.destroy();

        chartInstances.status = new window.Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(counts),
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
            if (task.status === '완료') catStats[cat].completed++;
        });

        container.innerHTML = Object.keys(catStats).sort().map(cat => {
            const stats = catStats[cat];
            const percent = Math.round((stats.completed / stats.total) * 100);
            const escapedCat = cat.replace(/'/g, "\\'"); // 따옴표 이스케이프
            return `<div class="cat-progress-item cursor-pointer" onclick="window.openAllTasksModalWithCategory('${escapedCat}')" title="클릭하여 '${escapedCat}' 업무 목록 보기">
                <div class="cat-progress-header">
                    <span class="cat-name">${TextUtils.escapeHtml(cat)}</span>
                    <span class="cat-percent">${percent}% (${stats.completed}/${stats.total})</span>
                </div>
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-fill" style="width:${percent}%;background-color:#11998e"></div>
                </div>
            </div>`;
        }).join('');
    }
};
