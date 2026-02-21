// ui/dashboard-ui.js - 대시보드 UI 렌더링

import { TextUtils } from '../utils/dom.js';

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
        const container = document.getElementById('statusChart');
        if (!container) return;
        const counts = {
            '대기': tasks.filter(t => t.status === '대기').length,
            '진행중': tasks.filter(t => t.status === '진행중').length,
            '완료': tasks.filter(t => t.status === '완료').length,
            '보류': tasks.filter(t => t.status === '보류').length
        };
        const colors = { '대기': '#ffc107', '진행중': '#2196f3', '완료': '#4caf50', '보류': '#9e9e9e' };
        this._renderBarChart(container, counts, colors, tasks.length, 'status');
    },

    renderPriorityChart(tasks) {
        const container = document.getElementById('priorityChart');
        if (!container) return;
        const labels = { 'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음' };
        const counts = {
            'very-high': tasks.filter(t => t.priority === 'very-high').length,
            'high': tasks.filter(t => t.priority === 'high').length,
            'middle': tasks.filter(t => t.priority === 'middle' || !t.priority).length,
            'low': tasks.filter(t => t.priority === 'low').length,
            'very-low': tasks.filter(t => t.priority === 'very-low').length
        };
        const colors = { 'very-high': '#e53935', 'high': '#fb8c00', 'middle': '#3f51b5', 'low': '#4caf50', 'very-low': '#607d8b' };
        this._renderBarChart(container, counts, colors, tasks.length, 'priority', labels);
    },

    _renderBarChart(container, counts, colors, total, type, labels = null) {
        container.innerHTML = Object.keys(counts).map(key => {
            const count = counts[key];
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const label = labels ? labels[key] : key;
            const onclick = type === 'status'
                ? `onclick="window.openAllTasksModalWithStatus('${key}')"`
                : `onclick="window.openAllTasksModalWithPriority('${key}')"`;
            return `<div class="chart-bar-item cursor-pointer" ${onclick}>
                <div class="chart-bar-label">${label}</div>
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-fill" style="width:${percent}%;background-color:${colors[key] || '#ddd'}"></div>
                </div>
                <div class="chart-bar-value">${count}</div>
            </div>`;
        }).join('');
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
