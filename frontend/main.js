// main.js - 메인 진입점 (ES Module)

// ──────────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────────
import { KoreanTime } from './utils/korean-time.js';
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
import { CalendarUI } from './ui/calendar-ui.js';
import { TaskUI } from './ui/task-ui.js';
import { CategoryUI } from './ui/category-ui.js';
import { DashboardUI } from './ui/dashboard-ui.js';
import { KanbanUI } from './ui/kanban-ui.js';
import { ActivityLogUI } from './ui/activity-log-ui.js';

import { injectComponents } from './utils/html-loader.js';

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
    saveTask, copyTask, addSubtask, toggleSubtask, deleteSubtask
} from './modules/task-modal.js';

import {
    openCategoryModal, closeCategoryModal,
    resetCategoryForm, editCategoryItem, saveCategory
} from './modules/category-modal.js';



import {
    openAllTasksModal, closeAllTasksModal,
    openAllTasksModalWithStatus, openAllTasksModalWithPriority, openAllTasksModalWithCategory,
    toggleSearchType, populateSearchCategories, updateSearchCategory2, updateSearchCategory3,
    searchAllTasks, renderAllTasks, updatePaginationControls,
    previousPage, nextPage, filterByStatus, filterByPriority,
    changeAllTasksSort, activateFilterButtons
} from './modules/all-tasks-modal.js';

import {
    switchView, loadView
} from './modules/view-controller.js';

import {
    renderCalendar, renderTasksForSelectedDate, updateSelectedDateTitle,
    selectDate, previousMonth, nextMonth, filterSelectedDateTasksByStatus
} from './modules/calendar-controller.js';

import {
    loadLogs, filterLogs, handleLogClick
} from './modules/activity-log-controller.js';


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

    // 요소가 있을 때만 요약 렌더링
    if (document.getElementById('statusSummary')) TaskUI.renderStatusSummary(AppState.tasks, 'statusSummary');
    if (document.getElementById('prioritySummary')) TaskUI.renderPrioritySummary(AppState.tasks, 'prioritySummary');
    if (document.getElementById('unfinishedTaskCount')) TaskUI.renderUnfinishedTasksSummary(AppState.tasks);

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
    const statusLabels = { 'pending': '대기', 'in-progress': '진행중', 'completed': '완료', 'on-hold': '보류' };
    matches.forEach(task => {
        const item = DomUtils.createElement('div', 'search-result-item');
        item.innerHTML = `
            <div class="search-result-title">${TextUtils.escapeHtml(task.taskName)}</div>
            <div class="search-result-meta">
                <span>${TextUtils.escapeHtml(task.category1)} > ${statusLabels[task.status] || task.status}</span>
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
    // 1. 필수 모달 주입
    await injectComponents('#modal-container', [
        { id: 'allTasksModal', url: 'html/modals/all-tasks.html', wrapperClass: 'modal' },
        { id: 'categoryModal', url: 'html/modals/category.html', wrapperClass: 'modal' },
        { id: 'taskModal', url: 'html/modals/task.html', wrapperClass: 'modal' },
        { id: 'notificationSettingsModal', url: 'html/modals/notification-settings.html', wrapperClass: 'modal' }
    ]);

    loadTheme();
    await loadView();

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
window.onclick = function (event) {
    if (event.target === document.getElementById('taskModal')) closeTaskModal();
    if (event.target === document.getElementById('categoryModal')) closeCategoryModal();
    if (event.target === document.getElementById('allTasksModal')) closeAllTasksModal();
    if (event.target === document.getElementById('notificationSettingsModal')) closeNotificationSettingsModal();

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
    addSubtask, toggleSubtask, deleteSubtask,

    // 카테고리 모달
    openCategoryModal, closeCategoryModal, resetCategoryForm, editCategoryItem, saveCategory,


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
