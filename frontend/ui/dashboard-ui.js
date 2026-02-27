// ui/dashboard-ui.js - 대시보드 UI 렌더링

import { TextUtils } from '../utils/dom.js';
import { AppState } from '../state/app-state.js';

let chartInstances = {};

export const DashboardUI = {
    render(tasks) {
        this.renderSummary(tasks);
        this.renderStatusChart(tasks);
        this.renderPriorityChart(tasks);
        this.renderTrendChart(tasks);
        this.renderMonthlyAchievementChart(tasks);
        this.renderCategoryDistributionChart(tasks);
        this.renderLeadTimeChart(tasks);
        this.renderDayOfWeekChart(tasks);
        this.renderCriticalTasks(tasks);
        this.renderBottleneckTasks(tasks);
        this.updateAlertsGridVisibility();
        this.renderActivityHeatmap(tasks);
        this.renderCategoryProgress(tasks);

        // 전역 메모(스티커) 렌더링 호출
        if (window.MemoUI) {
            window.MemoUI.render().then(() => {
                // 렌더링이 완료된 후 버튼 이벤트를 다시 한 번 바인딩
                this.bindEvents();
            }).catch(err => console.error("Memo render failed:", err));
        }

        // 초기 바인딩 시도
        this.bindEvents();
    },

    bindEvents() {
        // 대시보드 뷰 내에서 버튼을 찾기 위해 명시적으로 검색
        const dashboardView = document.getElementById('dashboard-view');
        if (!dashboardView) return;

        const manageBtn = dashboardView.querySelector('.btn-memo');
        if (manageBtn) {
            // 기존 이벤트 제거 후 새롭게 할당
            manageBtn.onclick = null;
            manageBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (window.toggleMemoDrawer) {
                    window.toggleMemoDrawer();
                } else if (window.MemoUI && typeof window.MemoUI.toggleDrawer === 'function') {
                    window.MemoUI.toggleDrawer();
                } else {
                    // 최후의 수단: 직접 DOM 조작
                    const drawer = document.getElementById('memoDrawer');
                    if (drawer) {
                        drawer.classList.toggle('open');
                        // 드로어가 열릴 때 렌더링도 함께 실행
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

                // 버튼 상태 업데이트
                periodButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 차트 재렌더링
                this.renderTrendChart(AppState.tasks);
            };
        });
    },

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

    renderSummary(tasks) {
        const container = document.getElementById('dashboardSummary');
        if (!container) return;

        const statusLabels = { 'pending': '대기', 'in-progress': '진행중', 'completed': '완료', 'on-hold': '보류' };

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
            const onclick = clickable ? `onclick="window.openAllTasksModalWithStatus('${stat.status}')"` : '';
            const cursor = clickable ? 'cursor-pointer' : '';
            return `<div class="summary-card ${cursor}" ${onclick}>
                <div class="icon">${stat.icon}</div>
                <div class="content-wrapper">
                    <div class="value">${stat.value}</div>
                    <div class="label">${stat.label}</div>
                </div>
            </div>`;
        }).join('');
    },

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
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const status = Object.keys(counts)[index];
                        window.openAllTasksModalWithStatus(status);
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
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const keys = ['very-high', 'high', 'middle', 'low', 'very-low'];
                        window.openAllTasksModalWithPriority(keys[index]);
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
                <div class="critical-task-item" onclick="window.openTaskModalById('${task.id}')">
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
                <div class="bottleneck-item" onclick="window.openTaskModalById('${task.id}')">
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
    },

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
                // HTML의 margin-left: 28px와 중복되지 않도록 28px 제거
                // 또한 이전 월 라벨과 너무 가까우면(최소 4주 간격) 표시하지 않음 (겹침 방지)
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
    },

    renderTrendChart(tasks) {
        const canvas = document.getElementById('trendChartCanvas');
        if (!canvas) return;

        const labels = [];
        const completedData = [];
        const createdData = [];

        const today = new Date();
        const days = AppState.currentTrendDays || 7;

        // 버튼 상태 동기화 (render가 직접 호출될 때를 대비)
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
                // 6개월 이상일 경우 월/일 표기에서 '일' 부분이 복잡해질 수 있으므로 간소화
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
                        pointRadius: days > 31 ? 0 : 3, // 데이터가 많으면 포인트 제거
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
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    },
                    x: {
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true, // 브라우저 창 크기에 맞춰 겹치지 않게 자동 생략 처리
                            maxTicksLimit: days > 60 ? 12 : 15 // 최대 표시할 라벨 수 제한
                        },
                        grid: {
                            display: false // 장기 데이터 조회 시 수많은 세로 눈금선이 겹쳐서 까맣게 보이는 현상 방지
                        }
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
