// frontend/ui/report-ui.js - 성과 분석 리포트 UI 렌더링
import { TextUtils } from '../utils/dom.js';
import { KoreanTime } from '../utils/korean-time.js';

let reportChartInstances = {};

export const ReportUI = {
    render(tasks) {
        this.calculateKPIs(tasks);
        this.renderProductivityTrend(tasks, reportChartInstances.productivityPeriod || 30);
        this.renderStatusDistribution(tasks);
        this.renderCategoryDistribution(tasks);
        this.renderPriorityEfficiency(tasks);
        this.renderMonthlyTrend(tasks);
        this.renderDailyActivity(tasks);
        this.renderSubCategoryTop5(tasks);
        this.bindEvents();
    },

    calculateKPIs(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // 평균 소요 기간 (Lead Time)
        const completedTasksWithDates = tasks.filter(t => t.status === 'completed' && t.createdAt && t.endDate);
        let avgLeadTime = 0;
        if (completedTasksWithDates.length > 0) {
            const totalLeadTime = completedTasksWithDates.reduce((sum, t) => {
                const start = new Date(t.createdAt);
                const end = new Date(t.endDate);
                return sum + Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            }, 0);
            avgLeadTime = Math.round((totalLeadTime / completedTasksWithDates.length) * 10) / 10;
        }

        // 지연 업무 (Overdue)
        const todayStr = KoreanTime.today();
        const overdue = tasks.filter(t => t.status !== 'completed' && t.endDate && t.endDate < todayStr).length;

        // UI 업데이트
        document.getElementById('kpiTotalTasks').textContent = total.toLocaleString();
        document.getElementById('kpiCompletionRate').textContent = `${rate}%`;
        document.getElementById('kpiCompletionProgressBar').style.width = `${rate}%`;
        document.getElementById('kpiAvgLeadTime').textContent = `${avgLeadTime}일`;
        const overdueEl = document.getElementById('kpiOverdueTasks');
        overdueEl.textContent = overdue.toLocaleString();
        if (overdue > 0) overdueEl.classList.add('danger');
        else overdueEl.classList.remove('danger');
    },

    renderProductivityTrend(tasks, days = 30) {
        const canvas = document.getElementById('productivityTrendChart');
        if (!canvas) return;

        reportChartInstances.productivityPeriod = days;

        const labels = [];
        const createdData = [];
        const completedData = [];
        const today = new Date();

        let dayCount = days;
        if (days === 'all') {
            const firstTaskDate = tasks.length > 0 ? new Date(Math.min(...tasks.map(t => new Date(t.createdAt).getTime()))) : new Date();
            dayCount = Math.max(1, Math.ceil((today - firstTaskDate) / (1000 * 60 * 60 * 24)));
        }

        for (let i = dayCount - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // 데이터가 많으면 월/일, 적으면 일만 표시 (유연한 레이블)
            if (dayCount > 100) {
                if (i % 30 === 0) labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
                else labels.push('');
            } else {
                labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
            }

            createdData.push(tasks.filter(t => t.createdAt && t.createdAt.startsWith(dateStr)).length);
            completedData.push(tasks.filter(t => t.status === 'completed' && t.endDate === dateStr).length);
        }

        if (reportChartInstances.trend) reportChartInstances.trend.destroy();

        reportChartInstances.trend = new window.Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '신규 등록',
                        data: createdData,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '완료 업무',
                        data: completedData,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4
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
                    x: { ticks: { autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    },

    renderStatusDistribution(tasks) {
        const canvas = document.getElementById('statusDistributionChart');
        if (!canvas) return;

        const counts = {
            'pending': tasks.filter(t => t.status === 'pending').length,
            'in-progress': tasks.filter(t => t.status === 'in-progress').length,
            'completed': tasks.filter(t => t.status === 'completed').length,
            'on-hold': tasks.filter(t => t.status === 'on-hold').length
        };
        const labels = ['대기', '진행중', '완료', '보류'];
        const colors = ['#ffc107', '#2196f3', '#4caf50', '#9e9e9e'];

        if (reportChartInstances.status) reportChartInstances.status.destroy();

        reportChartInstances.status = new window.Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: Object.values(counts),
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '65%',
                onClick: async (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const keys = ['pending', 'in-progress', 'completed', 'on-hold'];
                        const { openAllTasksModalWithStatus } = await import('../modules/all-tasks-modal.js');
                        openAllTasksModalWithStatus(keys[index]);
                    }
                }
            }
        });
    },

    renderCategoryDistribution(tasks) {
        const canvas = document.getElementById('categoryDistributionChart');
        if (!canvas) return;

        const catCounts = {};
        tasks.forEach(t => {
            const cat = t.category1 || '미분류';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = sorted.map(s => s[0]);
        const data = sorted.map(s => s[1]);

        if (reportChartInstances.category) reportChartInstances.category.destroy();

        const baseColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8BC34A', '#E91E63', '#00BCD4', '#FF5722',
            '#607D8B', '#673AB7'
        ];
        // 데이터 개수에 맞춰 색상 배열 생성
        const backgroundColors = data.map((_, i) => baseColors[i % baseColors.length]);

        reportChartInstances.category = new window.Chart(canvas, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: { enabled: true }
                },
                scales: {
                    r: {
                        grid: { display: false },
                        ticks: { display: false }
                    }
                },
                onClick: async (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const { openAllTasksModalWithCategory } = await import('../modules/all-tasks-modal.js');
                        openAllTasksModalWithCategory(labels[index]);
                    }
                }
            }
        });
    },

    renderPriorityEfficiency(tasks) {
        const canvas = document.getElementById('priorityEfficiencyChart');
        if (!canvas) return;

        const priorities = ['very-high', 'high', 'middle', 'low', 'very-low'];
        const priorityLabels = ['매우 높음', '높음', '중간', '낮음', '매우 낮음'];

        const avgDays = priorities.map(p => {
            const priorityTasks = tasks.filter(t => t.priority === p && t.status === 'completed' && t.createdAt && t.endDate);
            if (priorityTasks.length === 0) return 0;
            const totalDays = priorityTasks.reduce((sum, t) => {
                const start = new Date(t.createdAt);
                const end = new Date(t.endDate);
                return sum + Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            }, 0);
            return Math.round((totalDays / priorityTasks.length) * 10) / 10;
        });

        if (reportChartInstances.efficiency) reportChartInstances.efficiency.destroy();

        reportChartInstances.efficiency = new window.Chart(canvas, {
            type: 'bar',
            data: {
                labels: priorityLabels,
                datasets: [{
                    label: '평균 완료 소요 일수',
                    data: avgDays,
                    backgroundColor: ['#e53935', '#fb8c00', '#3f51b5', '#4caf50', '#607d8b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: '일수' } }
                },
                onClick: async (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const keys = ['very-high', 'high', 'middle', 'low', 'very-low'];
                        const { openAllTasksModalWithPriority } = await import('../modules/all-tasks-modal.js');
                        openAllTasksModalWithPriority(keys[index]);
                    }
                }
            }
        });
    },

    renderMonthlyTrend(tasks) {
        const canvas = document.getElementById('monthlyTrendChart');
        if (!canvas) return;

        const months = [];
        const monthlyCounts = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push(`${d.getMonth() + 1}월`);

            monthlyCounts.push(tasks.filter(t => t.status === 'completed' && t.endDate && t.endDate.startsWith(monthStr)).length);
        }

        if (reportChartInstances.monthly) reportChartInstances.monthly.destroy();

        reportChartInstances.monthly = new window.Chart(canvas, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: '완료 업무 수',
                    data: monthlyCounts,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#8BC34A', '#E91E63', '#00BCD4', '#FF5722',
                        '#607D8B', '#673AB7'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    },

    renderDailyActivity(tasks) {
        const canvas = document.getElementById('dailyActivityChart');
        if (!canvas) return;

        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];

        // 지난 60일간의 데이터를 분석
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        tasks.forEach(t => {
            if (t.endDate) {
                const date = new Date(t.endDate);
                if (date >= sixtyDaysAgo) {
                    dayCounts[date.getDay()]++;
                }
            }
        });

        if (reportChartInstances.daily) reportChartInstances.daily.destroy();

        reportChartInstances.daily = new window.Chart(canvas, {
            type: 'bar',
            data: {
                labels: dayNames,
                datasets: [{
                    label: '완료 업무 빈도',
                    data: dayCounts,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#8BC34A', '#E91E63', '#00BCD4', '#FF5722',
                        '#607D8B', '#673AB7'
                    ],
                    borderWidth: 0
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

    renderSubCategoryTop5(tasks) {
        const canvas = document.getElementById('subCategoryChart');
        if (!canvas) return;

        const subCatCounts = {};
        tasks.forEach(t => {
            const sub = t.category2 || '기타';
            subCatCounts[sub] = (subCatCounts[sub] || 0) + 1;
        });

        const sorted = Object.entries(subCatCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = sorted.map(s => s[0]);
        const data = sorted.map(s => s[1]);

        if (reportChartInstances.subCategory) reportChartInstances.subCategory.destroy();

        const baseColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8BC34A', '#E91E63', '#00BCD4', '#FF5722',
            '#607D8B', '#673AB7'
        ];
        const backgroundColors = data.map((_, i) => baseColors[i % baseColors.length]);

        reportChartInstances.subCategory = new window.Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                onClick: async (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const { openAllTasksModalWithCategory2 } = await import('../modules/all-tasks-modal.js');
                        openAllTasksModalWithCategory2(labels[index]);
                    }
                }
            }
        });
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refreshReportBtn');
        if (refreshBtn) {
            refreshBtn.onclick = async () => {
                const { AppState } = await import('../state/app-state.js');
                const { TaskService } = await import('../services/task-service.js');
                // 최신 데이터 가져오기
                await TaskService.loadTasks();
                this.render(AppState.tasks);
            };
        }

        // 트렌드 차트 기간 선택 이벤트 바인딩
        const periodSelector = document.getElementById('reportTrendPeriodSelector');
        if (periodSelector) {
            periodSelector.onclick = async (e) => {
                const btn = e.target.closest('.btn-period');
                if (!btn) return;

                const days = btn.getAttribute('data-days');
                const numericDays = days === 'all' ? 'all' : parseInt(days);

                // 버튼 활성화 클래스 처리
                periodSelector.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const { AppState } = await import('../state/app-state.js');
                this.renderProductivityTrend(AppState.tasks, numericDays);
            };
        }
    }
};
