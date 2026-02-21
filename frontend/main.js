// main.js - 메인 진입점 (ES Module)

// ──────────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────────
import { KoreanTime }    from './utils/korean-time.js';
import { DomUtils, TextUtils, ArrayUtils, StorageUtils } from './utils/dom.js';

// ──────────────────────────────────────────────
// 전역 상태
// ──────────────────────────────────────────────
import { AppState } from './state/app-state.js';

// ──────────────────────────────────────────────
// API
// ──────────────────────────────────────────────
import { API } from './api/api.js';

// ──────────────────────────────────────────────
// UI
// ──────────────────────────────────────────────
import { CalendarUI }     from './ui/calendar-ui.js';
import { TaskUI }         from './ui/task-ui.js';
import { CategoryUI }     from './ui/category-ui.js';
import { DashboardUI }    from './ui/dashboard-ui.js';
import { KanbanUI }       from './ui/kanban-ui.js';
import { ActivityLogUI }  from './ui/activity-log-ui.js';

// ──────────────────────────────────────────────
// 기능 모듈
// ──────────────────────────────────────────────
import {
    initGanttChart, filterGanttByStatus, filterGanttByPriority,
    activateGanttFilterButtons, postProcessGanttHeaders,
    transformTasksForGantt, setGanttMinWidth
} from './modules/gantt.js';

import {
    getTasksEndingSoon, renderNotifications, toggleNotificationDropdown, initNotifications,
    openNotificationSettingsModal, closeNotificationSettingsModal,
    populateNotificationCategories, populateNotificationSubCategories,
    populateNotificationDetailCategories, saveNotificationSettings
} from './modules/notification.js';

import {
    openTaskModal, closeTaskModal,
    populateCategoryDropdowns, updateSubCategories, updateDetailCategories,
    saveTask, copyTask
} from './modules/task-modal.js';

import {
    openCategoryModal, closeCategoryModal,
    resetCategoryForm, editCategoryItem, saveCategory
} from './modules/category-modal.js';

import {
    openImportantMemoModal, closeImportantMemoModal, saveImportantMemo
} from './modules/memo-modal.js';

import {
    openAllTasksModal, closeAllTasksModal,
    openAllTasksModalWithStatus, openAllTasksModalWithPriority, openAllTasksModalWithCategory,
    toggleSearchType, populateSearchCategories, updateSearchCategory2, updateSearchCategory3,
    searchAllTasks, renderAllTasks, updatePaginationControls,
    previousPage, nextPage, filterByStatus, filterByPriority,
    changeAllTasksSort, activateFilterButtons
} from './modules/all-tasks-modal.js';


// ══════════════════════════════════════════════
// 테마 관리
// ══════════════════════════════════════════════
function loadTheme() {
    const saved = StorageUtils.get('theme', 'green');
    document.getElementById('themeSelect').value = saved;
    changeTheme(saved);
}

function changeTheme(theme) {
    document.body.className = `theme-${theme}`;
    StorageUtils.set('theme', theme);
}


// ══════════════════════════════════════════════
// 데이터 로드 함수
// ══════════════════════════════════════════════
async function loadTasks() {
    AppState.tasks = await API.tasks.getAll();
    TaskUI.renderStatusSummary(AppState.tasks, 'statusSummary');
    TaskUI.renderPrioritySummary(AppState.tasks, 'prioritySummary');
    TaskUI.renderUnfinishedTasksSummary(AppState.tasks);
    renderCalendar();
    renderTasksForSelectedDate();

    if (document.getElementById('gantt-chart-view')?.style.display === 'block') initGanttChart();
    if (document.getElementById('dashboard-view')?.style.display === 'block') DashboardUI.render(AppState.tasks);
    if (document.getElementById('kanban-view')?.style.display === 'block') KanbanUI.render(AppState.tasks);
    if (document.getElementById('activity-log-view')?.style.display === 'block') loadLogs();
    if (document.getElementById('allTasksModal')?.style.display === 'block') renderAllTasks();

    // 알림 갱신
    AppState.notifications = getTasksEndingSoon();
    renderNotifications(AppState.notifications);
}

async function createTask(task) {
    await API.tasks.create(task);
    await loadTasks();
}

async function updateTask(id, updates) {
    await API.tasks.update(id, updates);
    await loadTasks();
}

async function deleteTask(id) {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) return;
    await API.tasks.delete(id);
    await loadTasks();
}

async function loadCategories() {
    AppState.categories = await API.categories.getAll();
    CategoryUI.renderTree(AppState.categories);
}

async function createCategory(category) {
    await API.categories.create(category);
    await loadCategories();
}

async function updateCategory(id, updates) {
    await API.categories.update(id, updates);
    await loadCategories();
}

async function deleteCategory(id) {
    if (!confirm('정말로 이 분류를 삭제하시겠습니까?')) return;
    await API.categories.delete(id);
    await loadCategories();
}

async function copyCategory(category) {
    const path = [category.mainCategory, category.subCategory, category.detailCategory].filter(Boolean).join(' > ');
    if (!confirm(`'${path}' 분류를 복사하시겠습니까?`)) return;

    const newCat = { ...category };
    delete newCat.id;
    if (newCat.detailCategory) newCat.detailCategory += ' (복사본)';
    else if (newCat.subCategory) newCat.subCategory += ' (복사본)';
    else newCat.mainCategory += ' (복사본)';

    await createCategory(newCat);
}

async function loadHolidays() {
    AppState.holidays = await API.holidays.getAll();
}


// ══════════════════════════════════════════════
// 캘린더 렌더링
// ══════════════════════════════════════════════
function renderCalendar() {
    CalendarUI.render(AppState.tasks, AppState.currentDate, AppState.selectedDate, AppState.holidays);
}

function renderTasksForSelectedDate() {
    const tasksList = document.getElementById('tasksList');
    let tasksForDate = CalendarUI.getTasksForDate(AppState.selectedDate, AppState.tasks);

    if (AppState.currentSelectedDateStatusFilter !== '전체') {
        tasksForDate = tasksForDate.filter(t => t.status === AppState.currentSelectedDateStatusFilter);
    }

    document.querySelectorAll('#selectedDateStatusFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-status').trim() === AppState.currentSelectedDateStatusFilter.trim());
    });

    if (tasksForDate.length === 0) {
        tasksList.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">선택한 날짜에 업무가 없습니다.</p>';
        return;
    }
    tasksList.innerHTML = '';
    tasksForDate.forEach(task => tasksList.appendChild(TaskUI.createCard(task)));
}

function filterSelectedDateTasksByStatus(status) {
    AppState.currentSelectedDateStatusFilter = status;
    renderTasksForSelectedDate();
}

function updateSelectedDateTitle() {
    const title = document.getElementById('selectedDateTitle');
    const d = AppState.selectedDate;
    title.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일의 업무`;
}

function selectDate(date) {
    AppState.selectedDate = new Date(date);
    renderCalendar();
    renderTasksForSelectedDate();
    updateSelectedDateTitle();
}

function previousMonth() {
    AppState.currentDate.setMonth(AppState.currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    AppState.currentDate.setMonth(AppState.currentDate.getMonth() + 1);
    renderCalendar();
}


// ══════════════════════════════════════════════
// 뷰 전환
// ══════════════════════════════════════════════
function switchView(viewName) {
    ['calendar-view', 'gantt-chart-view', 'dashboard-view', 'kanban-view', 'activity-log-view'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.sidebar-menu li a').forEach(a => a.classList.remove('active'));

    const showView = (id, linkId) => {
        const view = document.getElementById(id);
        if (view) view.style.display = 'block';
        const link = document.getElementById(linkId);
        if (link) link.classList.add('active');
    };

    switch (viewName) {
        case 'calendar':
            showView('calendar-view', 'sidebarCalendarLink');
            break;
        case 'gantt':
            showView('gantt-chart-view', 'sidebarGanttLink');
            AppState.ganttInitialized = false;
            initGanttChart();
            break;
        case 'dashboard':
            showView('dashboard-view', 'sidebarDashboardLink');
            DashboardUI.render(AppState.tasks);
            break;
        case 'kanban':
            showView('kanban-view', 'sidebarKanbanLink');
            // 검색어 초기화
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
        case 'activityLog':
            showView('activity-log-view', 'sidebarActivityLogLink');
            loadLogs();
            break;
    }

    StorageUtils.set('currentView', viewName);
}

function loadView() {
    const savedView = StorageUtils.get('currentView', 'calendar');
    switchView(savedView);
}


// ══════════════════════════════════════════════
// 활동 로그
// ══════════════════════════════════════════════
async function loadLogs() {
    AppState.logs = await API.logs.getAll();
    let filteredLogs = AppState.logs;
    if (AppState.currentLogFilter !== '전체') {
        filteredLogs = AppState.logs.filter(l => l.action === AppState.currentLogFilter);
    }
    ActivityLogUI.render(filteredLogs);
    updateLogFilterButtons();
}

function filterLogs(action) {
    AppState.currentLogFilter = action;
    loadLogs();
}

function updateLogFilterButtons() {
    document.querySelectorAll('.log-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-action') === AppState.currentLogFilter);
    });
}

function handleLogClick(taskId, taskName) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (task) openTaskModal(task);
    else alert(`'${taskName}' 업무는 삭제되어 상세 내용을 확인할 수 없습니다.`);
}


// ══════════════════════════════════════════════
// 칸반 드래그 앤 드롭
// ══════════════════════════════════════════════
function allowDrop(ev) {
    ev.preventDefault();
    const col = ev.currentTarget;
    if (col.classList.contains('kanban-column')) col.classList.add('drag-over');
}

async function dropTask(ev) {
    ev.preventDefault();
    const col = ev.currentTarget;
    col.classList.remove('drag-over');
    const taskId = ev.dataTransfer.getData('text/plain');
    const newStatus = col.getAttribute('data-status');
    if (taskId && newStatus) {
        const task = AppState.tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) await updateTask(taskId, { status: newStatus });
    }
}

function filterKanbanColumn(status, searchTerm) {
    AppState.kanbanSearchTerms[status] = searchTerm;
    KanbanUI.render(AppState.tasks);
}


// ══════════════════════════════════════════════
// 전역 검색
// ══════════════════════════════════════════════
function handleGlobalSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('globalSearchResults');

    if (!query) { resultsContainer.style.display = 'none'; return; }

    const matches = AppState.tasks.filter(task =>
        task.taskName.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        task.category1.toLowerCase().includes(query)
    ).slice(0, 10);

    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'block';

    if (matches.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-empty">검색 결과가 없습니다.</div>';
        return;
    }

    const priorityLabels = { 'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음' };
    matches.forEach(task => {
        const item = DomUtils.createElement('div', 'search-result-item');
        item.innerHTML = `
            <div class="search-result-title">${TextUtils.escapeHtml(task.taskName)}</div>
            <div class="search-result-meta">
                <span>${TextUtils.escapeHtml(task.category1)} > ${task.status}</span>
                <span>${priorityLabels[task.priority] || '중간'} | ${task.endDate || ''}</span>
            </div>
        `;
        item.onclick = () => {
            openTaskModal(task);
            document.getElementById('globalSearchInput').value = '';
            resultsContainer.style.display = 'none';
        };
        resultsContainer.appendChild(item);
    });
}


// ══════════════════════════════════════════════
// 간트 차트 주 단위 계산
// ══════════════════════════════════════════════
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}


// ══════════════════════════════════════════════
// DOMContentLoaded 초기화
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    loadView();

    await loadCategories();
    await loadTasks();
    await loadHolidays();

    renderCalendar();
    updateSelectedDateTitle();
    initNotifications();

    // 알림 설정 버튼
    document.getElementById('notificationSettingsBtn')?.addEventListener('click', openNotificationSettingsModal);
    document.getElementById('notificationCategory1')?.addEventListener('change', populateNotificationSubCategories);
    document.getElementById('notificationCategory2')?.addEventListener('change', populateNotificationDetailCategories);

    // 사이드바 뷰 전환
    const viewLinks = {
        'sidebarDashboardLink': 'dashboard',
        'sidebarCalendarLink': 'calendar',
        'sidebarGanttLink': 'gantt',
        'sidebarKanbanLink': 'kanban',
        'sidebarActivityLogLink': 'activityLog'
    };
    Object.entries(viewLinks).forEach(([id, view]) => {
        document.getElementById(id)?.addEventListener('click', (e) => { e.preventDefault(); switchView(view); });
    });
});


// ══════════════════════════════════════════════
// 전역 모달 닫기 (배경 클릭)
// ══════════════════════════════════════════════
window.onclick = function(event) {
    if (event.target === document.getElementById('taskModal'))                   closeTaskModal();
    if (event.target === document.getElementById('categoryModal'))               closeCategoryModal();
    if (event.target === document.getElementById('allTasksModal'))               closeAllTasksModal();
    if (event.target === document.getElementById('importantMemoModal'))          closeImportantMemoModal();
    if (event.target === document.getElementById('notificationSettingsModal'))   closeNotificationSettingsModal();

    // 글로벌 검색 결과 닫기
    const results = document.getElementById('globalSearchResults');
    const input = document.getElementById('globalSearchInput');
    if (results && !results.contains(event.target) && event.target !== input) {
        results.style.display = 'none';
    }

    // 알림 드롭다운 닫기
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notificationBtn');
    if (dropdown?.classList.contains('show') && !dropdown.contains(event.target) && !btn.contains(event.target)) {
        toggleNotificationDropdown();
    }
};


// ══════════════════════════════════════════════
// window 전역 함수 등록 (HTML inline 이벤트 지원)
// ══════════════════════════════════════════════
Object.assign(window, {
    // 테마
    loadTheme, changeTheme,

    // 뷰 전환
    switchView, loadView,

    // 데이터
    loadTasks, createTask, updateTask, deleteTask, copyTask,
    loadCategories, createCategory, updateCategory, deleteCategory, copyCategory,
    loadHolidays,

    // 캘린더
    renderCalendar, renderTasksForSelectedDate, updateSelectedDateTitle,
    selectDate, previousMonth, nextMonth, filterSelectedDateTasksByStatus,

    // 간트
    initGanttChart, filterGanttByStatus, filterGanttByPriority,
    activateGanttFilterButtons, postProcessGanttHeaders,
    transformTasksForGantt, setGanttMinWidth,

    // 알림
    getTasksEndingSoon, renderNotifications, toggleNotificationDropdown, initNotifications,
    openNotificationSettingsModal, closeNotificationSettingsModal,
    populateNotificationCategories, populateNotificationSubCategories,
    populateNotificationDetailCategories, saveNotificationSettings,

    // 업무 모달
    openTaskModal, closeTaskModal,
    populateCategoryDropdowns, updateSubCategories, updateDetailCategories, saveTask,

    // 카테고리 모달
    openCategoryModal, closeCategoryModal, resetCategoryForm, editCategoryItem, saveCategory,

    // 메모 모달
    openImportantMemoModal, closeImportantMemoModal, saveImportantMemo,

    // 전체 업무 모달
    openAllTasksModal, closeAllTasksModal,
    openAllTasksModalWithStatus, openAllTasksModalWithPriority, openAllTasksModalWithCategory,
    toggleSearchType, populateSearchCategories, updateSearchCategory2, updateSearchCategory3,
    searchAllTasks, renderAllTasks, updatePaginationControls,
    previousPage, nextPage, filterByStatus, filterByPriority, changeAllTasksSort,

    // 활동 로그
    loadLogs, filterLogs, handleLogClick,

    // 칸반
    allowDrop, dropTask, filterKanbanColumn,

    // 글로벌 검색
    handleGlobalSearch,

    // 유틸
    getWeekNumber
});
