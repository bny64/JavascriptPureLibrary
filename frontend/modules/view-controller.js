// view-controller.js
import { AppState } from '../state/app-state.js';
import { StorageUtils } from '../utils/dom.js';
import { TaskUI } from '../ui/task-ui.js';
import { DashboardUI } from '../ui/dashboard-ui.js';
import { KanbanUI } from '../ui/kanban-ui.js';
import { SearchUI } from '../ui/search-ui.js';
import { ReportUI } from '../ui/report-ui.js';

import { initGanttChart } from './gantt.js';
import { renderCalendar, renderTasksForSelectedDate, updateSelectedDateTitle } from './calendar-controller.js';
import { loadLogs } from './activity-log-controller.js';
import { openAllTasksModal } from './all-tasks-modal.js';
import { TaskService } from '../services/task-service.js';

export async function switchView(viewName) {
    const views = {
        'dashboard': { id: 'dashboard-view', url: 'html/views/dashboard.html', linkId: 'sidebarDashboardLink' },
        'calendar': { id: 'calendar-view', url: 'html/views/calendar.html', linkId: 'sidebarCalendarLink' },
        'gantt': { id: 'gantt-chart-view', url: 'html/views/gantt.html', linkId: 'sidebarGanttLink' },
        'kanban': { id: 'kanban-view', url: 'html/views/kanban.html', linkId: 'sidebarKanbanLink' },
        'search': { id: 'search-view', url: 'html/views/search.html', linkId: 'sidebarSearchLink' },
        'report': { id: 'report-view', url: 'html/views/report.html', linkId: 'sidebarReportLink' },
        'activityLog': { id: 'activity-log-view', url: 'html/views/activity-log.html', linkId: 'sidebarActivityLogLink' }
    };

    // 모든 뷰 숨기기
    Object.values(views).forEach(v => {
        const el = document.getElementById(v.id);
        if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.sidebar-menu li a').forEach(a => a.classList.remove('active'));

    const target = views[viewName];
    if (!target) return;

    const viewContainer = document.getElementById(target.id);
    if (!viewContainer) return;

    // 컨텐츠가 비어있으면 동적 로드
    if (viewContainer.innerHTML.trim() === '') {
        try {
            const response = await fetch(target.url);
            viewContainer.innerHTML = await response.text();
            bindViewEvents(viewName, viewContainer);
        } catch (error) {
            console.error(`Error loading view ${viewName}:`, error);
            viewContainer.innerHTML = `<p style="padding:20px; color:red;">뷰를 로드하는 중 오류가 발생했습니다.</p>`;
        }
    }

    // 표시 및 활성화
    viewContainer.style.display = 'block';
    const link = document.getElementById(target.linkId);
    if (link) link.classList.add('active');

    // 뷰별 초기화 로직
    switch (viewName) {
        case 'calendar':
            renderCalendar();
            renderTasksForSelectedDate();
            // 요약 정보 즉시 렌더링 보장
            if (document.getElementById('statusSummary')) TaskUI.renderStatusSummary(AppState.tasks, 'statusSummary');
            if (document.getElementById('prioritySummary')) TaskUI.renderPrioritySummary(AppState.tasks, 'prioritySummary');
            if (document.getElementById('unfinishedTaskCount')) TaskUI.renderUnfinishedTasksSummary(AppState.tasks);
            updateSelectedDateTitle();
            break;
        case 'gantt':
            AppState.ganttInitialized = false;
            initGanttChart();
            break;
        case 'dashboard':
            DashboardUI.render(AppState.tasks);
            // 대시보드 스티커 메모 렌더링
            import('../ui/memo-ui.js').then(({ MemoUI }) => MemoUI.render());
            break;
        case 'kanban':
            // 검색어 초기화 및 렌더링
            for (const status in AppState.kanbanSearchTerms) {
                AppState.kanbanSearchTerms[status] = '';
                const header = document.querySelector(`.kanban-column-header.status-${status}`);
                if (header) {
                    const input = header.querySelector('.kanban-search-input');
                    if (input) input.value = '';
                }
            }
            KanbanUI.render(AppState.tasks);
            break;
        case 'search':
            await SearchUI.render();
            break;
        case 'activityLog':
            loadLogs();
            break;
        case 'report':
            ReportUI.render(AppState.tasks);
            break;
    }

    StorageUtils.set('currentView', viewName);
}

export async function loadView() {
    const savedView = StorageUtils.get('currentView', 'calendar');
    await switchView(savedView);
}

function bindViewEvents(viewName, container) {
    if (viewName === 'calendar') {
        container.querySelector('#prevMonthBtn')?.addEventListener('click', async () => {
            const m = await import('./calendar-controller.js');
            m.previousMonth();
        });
        container.querySelector('#nextMonthBtn')?.addEventListener('click', async () => {
            const m = await import('./calendar-controller.js');
            m.nextMonth();
        });
        container.querySelector('#openAllTasksBtn')?.addEventListener('click', () => {
            openAllTasksModal();
        });
        container.querySelectorAll('#selectedDateStatusFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const status = e.target.getAttribute('data-status');
                const m = await import('./calendar-controller.js');
                m.filterSelectedDateTasksByStatus(status);
            });
        });
    } else if (viewName === 'gantt') {
        container.querySelectorAll('.status-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const status = e.target.getAttribute('data-status');
                const m = await import('./gantt.js');
                m.filterGanttByStatus(status);
            });
        });
        container.querySelectorAll('.priority-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const priority = e.target.getAttribute('data-priority');
                const m = await import('./gantt.js');
                m.filterGanttByPriority(priority);
            });
        });
    } else if (viewName === 'dashboard') {
        DashboardUI.bindEvents();
        // 대시보드는 동적으로 로드되므로 로드 이후 바인딩
        container.querySelector('.btn-memo')?.addEventListener('click', async () => {
            const { MemoUI } = await import('../ui/memo-ui.js');
            MemoUI.toggleDrawer();
        });
    } else if (viewName === 'activityLog') {
        container.querySelectorAll('.log-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = e.target.getAttribute('data-action');
                const m = await import('./activity-log-controller.js');
                m.filterLogs(action);
            });
        });
    }
}
