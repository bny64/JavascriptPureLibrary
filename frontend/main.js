// main.js - 메인 진입점 (ES Module)

/**
 * Passive Event Listener Patch
 * Chrome에서 발생하는 [Violation] 'touchstart', 'touchmove', 'wheel' 등 경고 해결
 * 특히 외부 라이브러리(Gantt 등)에서 발생하는 논패시브 이벤트 리스너 경고를 방지합니다.
 */
(function () {
    if (typeof EventTarget !== 'undefined') {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (type, listener, options) {
            if (['touchstart', 'touchmove', 'wheel', 'mousewheel'].includes(type)) {
                if (typeof options === 'undefined') {
                    options = { passive: true };
                } else if (typeof options === 'boolean') {
                    options = { capture: options, passive: true };
                } else if (typeof options === 'object' && options !== null && typeof options.passive === 'undefined') {
                    options.passive = true;
                }
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    }
})();

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
import { SearchUI } from './ui/search-ui.js';
import { ReportUI } from './ui/report-ui.js';
import { ActivityLogUI } from './ui/activity-log-ui.js';
import { MemoUI } from './ui/memo-ui.js';

import { injectComponents } from './utils/html-loader.js';

// ──────────────────────────────────────────────
// 서비스 및 데이터 계층
// ──────────────────────────────────────────────
import { EventBus } from './utils/event-bus.js';
import { TaskService } from './services/task-service.js';
import { CategoryService } from './services/category-service.js';

// 기능 모듈
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
    saveTask, copyTask, addSubtask, toggleSubtask, deleteSubtask, deleteTaskInModal
} from './modules/task-modal.js';

import {
    openCategoryModal, closeCategoryModal,
    resetCategoryForm, editCategoryItem, saveCategory
} from './modules/category-modal.js';

import {
    openAllTasksModal, closeAllTasksModal,
    openAllTasksModalWithStatus, openAllTasksModalWithPriority, openAllTasksModalWithCategory,
    openAllTasksModalWithDate,
    toggleSearchType, populateSearchCategories, updateSearchCategory2, updateSearchCategory3,
    searchAllTasks, renderAllTasks, updatePaginationControls,
    previousPage, nextPage, filterByStatus, filterByPriority,
    changeAllTasksSort, resetAllFilters, activateFilterButtons
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

// Re-export for other modules
export {
    initGanttChart, filterGanttByStatus, filterGanttByPriority,
    activateGanttFilterButtons, postProcessGanttHeaders,
    transformTasksForGantt, setGanttMinWidth,
    getTasksEndingSoon, renderNotifications, toggleNotificationDropdown, initNotifications,
    openNotificationSettingsModal, closeNotificationSettingsModal,
    populateNotificationCategories, populateNotificationSubCategories,
    populateNotificationDetailCategories, saveNotificationSettings,
    openTaskModal, closeTaskModal,
    populateCategoryDropdowns, updateSubCategories, updateDetailCategories,
    saveTask, copyTask, addSubtask, toggleSubtask, deleteSubtask, deleteTaskInModal,
    openCategoryModal, closeCategoryModal,
    resetCategoryForm, editCategoryItem, saveCategory,
    openAllTasksModal, closeAllTasksModal,
    openAllTasksModalWithStatus, openAllTasksModalWithPriority, openAllTasksModalWithCategory,
    openAllTasksModalWithDate,
    toggleSearchType, populateSearchCategories, updateSearchCategory2, updateSearchCategory3,
    searchAllTasks, renderAllTasks, updatePaginationControls,
    previousPage, nextPage, filterByStatus, filterByPriority,
    changeAllTasksSort, activateFilterButtons,
    switchView, loadView,
    renderCalendar, renderTasksForSelectedDate, updateSelectedDateTitle,
    selectDate, previousMonth, nextMonth, filterSelectedDateTasksByStatus,
    loadLogs, filterLogs, handleLogClick
};


// ══════════════════════════════════════════════
// 테마 관리
// ══════════════════════════════════════════════
function loadTheme() {
    const saved = StorageUtils.get('theme', 'green');
    changeTheme(saved);
}

function updateThemeUI(theme) {
    const circles = document.querySelectorAll('.theme-circle');
    circles.forEach(c => {
        c.classList.toggle('active', c.dataset.theme === theme);
    });
}

function changeTheme(theme) {
    document.body.className = `theme-${theme}`;
    StorageUtils.set('theme', theme);
    updateThemeUI(theme);
}


// ══════════════════════════════════════════════
// 이벤트 구독 및 UI 갱신 (Pub/Sub)
// ══════════════════════════════════════════════
EventBus.subscribe('tasks-updated', (tasks) => {
    // 요소가 있을 때만 요약 렌더링
    if (document.getElementById('statusSummary')) TaskUI.renderStatusSummary(tasks, 'statusSummary');
    if (document.getElementById('prioritySummary')) TaskUI.renderPrioritySummary(tasks, 'prioritySummary');
    if (document.getElementById('unfinishedTaskCount')) TaskUI.renderUnfinishedTasksSummary(tasks);

    renderCalendar();
    renderTasksForSelectedDate();
    updateSelectedDateTitle();

    if (document.getElementById('gantt-chart-view')?.style.display === 'block') initGanttChart();
    if (document.getElementById('dashboard-view')?.style.display === 'block') DashboardUI.render(tasks);
    if (document.getElementById('kanban-view')?.style.display === 'block') KanbanUI.render(tasks);
    if (document.getElementById('search-view')?.style.display === 'block') SearchUI.performSearch();
    if (document.getElementById('activity-log-view')?.style.display === 'block') loadLogs();
    if (document.getElementById('report-view')?.style.display === 'block') {
        ReportUI.render(tasks);
    }
    if (document.getElementById('allTasksModal')?.style.display === 'block') renderAllTasks();

    // 알림 갱신
    AppState.notifications = getTasksEndingSoon();
    renderNotifications(AppState.notifications);
});

EventBus.subscribe('categories-updated', (categories) => {
    CategoryUI.renderTree(categories);
});

async function loadTasks() {
    return TaskService.loadTasks();
}

async function createTask(task) {
    return TaskService.createTask(task);
}

async function updateTask(id, updates) {
    return TaskService.updateTask(id, updates);
}

async function deleteTask(id) {
    return TaskService.deleteTask(id);
}

export function openTaskModalById(id) {
    const task = AppState.tasks.find(t => t.id === id);
    if (task) openTaskModal(task);
}

async function archiveOldTasks() {
    return TaskService.archiveOldTasks();
}

async function loadCategories() {
    return CategoryService.loadCategories();
}

async function createCategory(category) {
    return CategoryService.createCategory(category);
}

async function updateCategory(id, updates) {
    return CategoryService.updateCategory(id, updates);
}

async function deleteCategory(id) {
    return CategoryService.deleteCategory(id);
}

export async function copyCategory(category) {
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
// 모달 인라인 이벤트 바인딩
// ══════════════════════════════════════════════
function bindModalEvents() {
    // 1. Task Modal
    document.querySelector('#taskModal .close')?.addEventListener('click', closeTaskModal);
    document.querySelector('#taskModal .btn-cancel')?.addEventListener('click', closeTaskModal);
    document.getElementById('taskForm')?.addEventListener('submit', saveTask);
    document.getElementById('category1')?.addEventListener('change', updateSubCategories);
    document.getElementById('category2')?.addEventListener('change', updateDetailCategories);
    document.querySelector('#taskModal .btn-add-subtask')?.addEventListener('click', addSubtask);
    document.querySelector('#taskModal .btn-delete')?.addEventListener('click', deleteTaskInModal);

    // 2. Notification Settings Modal
    document.querySelector('#notificationSettingsModal .close')?.addEventListener('click', closeNotificationSettingsModal);
    document.querySelector('#notificationSettingsModal .btn-cancel')?.addEventListener('click', closeNotificationSettingsModal);
    document.getElementById('notificationSettingsForm')?.addEventListener('submit', saveNotificationSettings);

    // 3. Category Modal
    document.querySelector('#categoryModal .close')?.addEventListener('click', closeCategoryModal);
    document.querySelector('#categoryModal .btn-cancel')?.addEventListener('click', closeCategoryModal);
    document.getElementById('categoryForm')?.addEventListener('submit', saveCategory);

    // 4. All Tasks Modal
    document.querySelector('#allTasksModal .close')?.addEventListener('click', closeAllTasksModal);
    document.getElementById('textSearchInput')?.addEventListener('keyup', searchAllTasks);

    document.querySelectorAll('input[name="searchType"]').forEach(el => el.addEventListener('change', toggleSearchType));

    document.getElementById('searchCategory1')?.addEventListener('change', () => { updateSearchCategory2(); searchAllTasks(); });
    document.getElementById('searchCategory2')?.addEventListener('change', () => { updateSearchCategory3(); searchAllTasks(); });
    document.getElementById('searchCategory3')?.addEventListener('change', searchAllTasks);

    document.getElementById('sortField')?.addEventListener('change', changeAllTasksSort);
    document.getElementById('sortDirection')?.addEventListener('change', changeAllTasksSort);

    // 날짜 기간 검색 이벤트 바인딩
    const startDateInput = document.getElementById('searchStartDate');
    const endDateInput = document.getElementById('searchEndDate');

    startDateInput?.addEventListener('change', searchAllTasks);
    endDateInput?.addEventListener('change', searchAllTasks);

    // 전체 필터 초기화 버튼 이벤트 바인딩
    document.getElementById('allTasksResetBtn')?.addEventListener('click', resetAllFilters);

    document.getElementById('prevPageBtn')?.addEventListener('click', previousPage);
    document.getElementById('nextPageBtn')?.addEventListener('click', nextPage);

    document.querySelectorAll('#allTasksModal .status-filters .filter-btn').forEach(btn =>
        btn.addEventListener('click', (e) => filterByStatus(e.target.getAttribute('data-status'))));
    document.querySelectorAll('#allTasksModal .priority-filters .filter-btn').forEach(btn =>
        btn.addEventListener('click', (e) => filterByPriority(e.target.getAttribute('data-priority'))));
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
    bindModalEvents();

    initSidebarOrder();
    initSidebarDragAndDrop();

    loadTheme();
    await loadView();

    await loadCategories();
    await loadTasks();
    await loadHolidays();

    // 메모 이벤트 리스너
    document.getElementById('openMemoBtn')?.addEventListener('click', () => MemoUI.toggleDrawer());
    document.getElementById('closeMemoBtn')?.addEventListener('click', () => MemoUI.toggleDrawer());
    document.getElementById('addMemoBtn')?.addEventListener('click', () => MemoUI.addMemo());

    // 공통 헤더 이벤트 리스너 바인딩 (인라인 제거)
    document.getElementById('themeCircles')?.addEventListener('click', (e) => {
        const circle = e.target.closest('.theme-circle');
        if (circle) changeTheme(circle.dataset.theme);
    });
    document.getElementById('globalSearchInput')?.addEventListener('keyup', handleGlobalSearch);
    document.getElementById('openCategoryModalBtn')?.addEventListener('click', () => openCategoryModal());
    document.getElementById('openTaskModalBtn')?.addEventListener('click', () => openTaskModal());

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
        'sidebarSearchLink': 'search',
        'sidebarReportLink': 'report',
        'sidebarActivityLogLink': 'activityLog'
    };
    Object.entries(viewLinks).forEach(([id, view]) => {
        document.getElementById(id)?.addEventListener('click', (e) => { e.preventDefault(); switchView(view); });
    });
});


// ══════════════════════════════════════════════
// 전역 클릭 이벤트 핸들러
// ══════════════════════════════════════════════
window.addEventListener('click', (event) => {
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

    // 메모 드로어 닫기 (외부 클릭 시)
    const memoDrawer = document.getElementById('memoDrawer');
    const openMemoBtn = document.getElementById('openMemoBtn');
    if (memoDrawer?.classList.contains('open') &&
        !memoDrawer.contains(event.target) &&
        !openMemoBtn?.contains(event.target)) {
        MemoUI.toggleDrawer();
    }
});

// ESC 키로 모달 닫기
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        // 열려 있는 모달 확인 (최상위에 올 수 있는 것부터 우선순위 배정)
        const taskModal = document.getElementById('taskModal');
        const categoryModal = document.getElementById('categoryModal');
        const notificationSettingsModal = document.getElementById('notificationSettingsModal');
        const allTasksModal = document.getElementById('allTasksModal');
        const memoDrawer = document.getElementById('memoDrawer');

        if (taskModal?.style.display === 'block') {
            closeTaskModal();
            return;
        }
        if (categoryModal?.style.display === 'block') {
            closeCategoryModal();
            return;
        }
        if (notificationSettingsModal?.style.display === 'block') {
            closeNotificationSettingsModal();
            return;
        }
        if (allTasksModal?.style.display === 'block') {
            closeAllTasksModal();
            return;
        }

        // 알림 드롭다운 닫기
        const notificationDropdown = document.getElementById('notificationDropdown');
        if (notificationDropdown?.classList.contains('show')) {
            toggleNotificationDropdown();
        }

        // 메모 드로어가 열려있으면 닫기
        if (memoDrawer?.classList.contains('open')) {
            MemoUI.toggleDrawer();
        }
    }
});


// ══════════════════════════════════════════════
// 전역 유틸리티 (필요 시 전역 유지)
// ══════════════════════════════════════════════
window.getWeekNumber = getWeekNumber;

// ══════════════════════════════════════════════
// 사이드바 메뉴 드래그 앤 드롭
// ══════════════════════════════════════════════
function initSidebarOrder() {
    const savedOrder = StorageUtils.get('sidebarMenuOrder');
    if (!savedOrder || !Array.isArray(savedOrder)) return;

    const menu = document.querySelector('.sidebar-menu');
    const items = Array.from(menu.querySelectorAll('li'));
    
    savedOrder.forEach(id => {
        const item = items.find(li => li.querySelector('a').id === id);
        if (item) menu.appendChild(item);
    });
}

function initSidebarDragAndDrop() {
    const menu = document.querySelector('.sidebar-menu');
    const items = menu.querySelectorAll('li');

    items.forEach(item => {
        item.setAttribute('draggable', 'true');

        item.addEventListener('dragstart', (e) => {
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            items.forEach(li => li.classList.remove('drag-over'));
            saveSidebarOrder();
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = menu.querySelector('.dragging');
            const siblings = [...menu.querySelectorAll('li:not(.dragging)')];
            
            const nextSibling = siblings.find(sibling => {
                const rect = sibling.getBoundingClientRect();
                return e.clientY <= rect.top + rect.height / 2;
            });

            if (nextSibling) {
                menu.insertBefore(draggingItem, nextSibling);
            } else {
                menu.appendChild(draggingItem);
            }
        });
    });
}

function saveSidebarOrder() {
    const ids = Array.from(document.querySelectorAll('.sidebar-menu li a')).map(a => a.id);
    StorageUtils.set('sidebarMenuOrder', ids);
}

