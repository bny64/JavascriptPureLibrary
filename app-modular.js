// app.js - 메인 애플리케이션 로직 (모듈화 버전)

// 전역 상태
const AppState = {
    tasks: [],
    categories: [],
    currentDate: new Date(),
    selectedDate: new Date(),
    currentPage: 1,
    tasksPerPage: 5,
    currentStatusFilter: '전체',
    currentPriorityFilter: '전체',
    currentSelectedDateStatusFilter: '전체', // New filter for selected date tasks
    currentSearchType: 'text',
    sortField: 'endDate', // Default sort field
    sortDirection: 'asc', // Default sort direction
    filterStartDate: null, // New property for start date filter
    filterEndDate: null,   // New property for end date filter
    // Notification Settings
    notificationDaysBefore: StorageUtils.get('notificationDaysBefore', 7),
    notificationPriorities: StorageUtils.get('notificationPriorities', ['very-high', 'high', 'middle']),
    notificationStatuses: StorageUtils.get('notificationStatuses', ['대기', '진행중', '보류']),
    notificationCategory1: StorageUtils.get('notificationCategory1', '전체'),
    notificationCategory2: StorageUtils.get('notificationCategory2', '전체'),
    notificationCategory3: StorageUtils.get('notificationCategory3', '전체'),
    // Gantt Chart Filters
    ganttStatusFilter: StorageUtils.get('ganttStatusFilter', '전체'),
    ganttPriorityFilter: StorageUtils.get('ganttPriorityFilter', '전체'),
    currentSearchCategory1: '', // New property for category filter
    currentSearchCategory2: '', // New property for category filter
    currentSearchCategory3: '', // New property for category filter
    // Kanban Search
    kanbanSearchTerms: {
        '대기': '',
        '진행중': '',
        '완료': '',
        '보류': ''
    },
    holidays: {}, // New property for holiday data
    notifications: [], // New property for tasks ending soon
    gantt: null
};

// Helper arrays for month translation
const monthNamesKo = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


// Helper function to get week number (ISO 8601)
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
    // Calculate full weeks to the nearest Thursday
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}


// 테마 관리
function loadTheme() {
    const savedTheme = StorageUtils.get('theme', 'green');
    document.getElementById('themeSelect').value = savedTheme;
    changeTheme(savedTheme);
}

function changeTheme(theme) {
    document.body.className = `theme-${theme}`;
    StorageUtils.set('theme', theme);
}


// --- API 호출 함수들 (loadTasks, createTask 등) ---

async function loadTasks() {
    AppState.tasks = await API.tasks.getAll();
    UI.task.renderStatusSummary(AppState.tasks, 'statusSummary'); // Render status summary for all tasks
    UI.task.renderPrioritySummary(AppState.tasks, 'prioritySummary'); // Render priority summary for all tasks
    UI.task.renderUnfinishedTasksSummary(AppState.tasks); // Render unfinished tasks summary
    renderCalendar();
    renderTasksForSelectedDate();

    // Refresh Gantt if visible
    if (document.getElementById('gantt-chart-view').style.display === 'block') {
        initGanttChart();
    }

    // Refresh Dashboard if visible
    if (document.getElementById('dashboard-view').style.display === 'block') {
        UI.dashboard.render(AppState.tasks);
    }

    // Refresh Kanban if visible
    if (document.getElementById('kanban-view').style.display === 'block') {
        UI.kanban.render(AppState.tasks);
    }

    // If the All Tasks modal is open, re-render its list
    if (document.getElementById('allTasksModal').style.display === 'block') {
        renderAllTasks();
    }
}

async function createTask(task) {
    await API.tasks.create(task);
    await loadTasks(); // Re-fetch all tasks to ensure UI is updated with latest backend state
}

async function updateTask(id, updates) {
    await API.tasks.update(id, updates);
    await loadTasks(); // Re-fetch all tasks to ensure UI is updated with latest backend state
}

async function deleteTask(id) {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) {
        return;
    }
    
    await API.tasks.delete(id);
    await loadTasks(); // Re-fetch all tasks to ensure UI is updated with latest backend state
}

function copyTask(task) {
    openTaskModal({
        ...task,
        id: '',
        taskName: task.taskName + ' (복사본)',
        createdAt: undefined
    });
}

async function loadCategories() {
    AppState.categories = await API.categories.getAll();
    UI.category.renderTree(AppState.categories);
}

async function createCategory(category) {
    await API.categories.create(category);
    await loadCategories(); // Re-fetch all categories to ensure UI is updated with latest backend state
}

async function updateCategory(id, updates) {
    await API.categories.update(id, updates);
    await loadCategories(); // Re-fetch all categories to ensure UI is updated with latest backend state
}

async function deleteCategory(id) {
    if (!confirm('정말로 이 분류를 삭제하시겠습니까?')) {
        return;
    }
    
    await API.categories.delete(id);
    await loadCategories(); // Re-fetch all categories to ensure UI is updated with latest backend state
}

async function copyCategory(category) {
    if (!confirm(`'${category.mainCategory}${category.subCategory ? ' > ' + category.subCategory : ''}${category.detailCategory ? ' > ' + category.detailCategory : ''}' 분류를 복사하시겠습니까?`)) {
        return;
    }

    const newCategory = { ...category };
    delete newCategory.id; // Remove old ID
    
    // Append "(복사본)" to the most specific category name
    if (newCategory.detailCategory) {
        newCategory.detailCategory += ' (복사본)';
    } else if (newCategory.subCategory) {
        newCategory.subCategory += ' (복사본)';
    } else {
        newCategory.mainCategory += ' (복사본)';
    }

    await createCategory(newCategory); // Create new category
}

async function loadHolidays() {
    try {
        const response = await fetch('/api/holidays');
        AppState.holidays = await response.json();
    } catch (error) {
        console.error('Error loading holidays:', error);
        AppState.holidays = {};
    }
}


// --- 렌더링 함수들 (renderCalendar, renderTasksForSelectedDate 등) ---

function renderCalendar() {
    UI.calendar.render(AppState.tasks, AppState.currentDate, AppState.selectedDate, AppState.holidays);
}

function renderTasksForSelectedDate() {
    const tasksList = document.getElementById('tasksList');
    let tasksForDate = UI.calendar.getTasksForDate(AppState.selectedDate, AppState.tasks);
    
    // Apply status filter for selected date tasks
    if (AppState.currentSelectedDateStatusFilter !== '전체') {
        tasksForDate = tasksForDate.filter(task => task.status === AppState.currentSelectedDateStatusFilter);
    }

    // Update active state of filter buttons for selected date (MOVED HERE)
    const filterBtns = document.querySelectorAll('#selectedDateStatusFilters .filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        // Ensure robust comparison by trimming whitespace
        if (btn.getAttribute('data-status').trim() === AppState.currentSelectedDateStatusFilter.trim()) {
            btn.classList.add('active');
        }
    });

    if (tasksForDate.length === 0) {
        tasksList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">선택한 날짜에 업무가 없습니다.</p>';
        return;
    }
    
    tasksList.innerHTML = '';
    tasksForDate.forEach(task => {
        tasksList.appendChild(UI.task.createCard(task));
    });
}

function filterSelectedDateTasksByStatus(status) {
    AppState.currentSelectedDateStatusFilter = status;
    renderTasksForSelectedDate(); // Re-render tasks for selected date
}

function updateSelectedDateTitle() {
    const title = document.getElementById('selectedDateTitle');
    const year = AppState.selectedDate.getFullYear();
    const month = AppState.selectedDate.getMonth() + 1;
    const day = AppState.selectedDate.getDate();
    title.textContent = `${year}년 ${month}월 ${day}일의 업무`;
}


// --- 알림 관련 함수 ---

function getTasksEndingSoon() {
    const today = KoreanTime.now();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const notificationTasks = AppState.tasks.filter(task => {
        // 1. 상태 필터링 (완료된 업무는 알림에서 제외)
        if (task.status === '완료') return false;
        if (!AppState.notificationStatuses.includes(task.status)) return false;

        // 2. 종료일 D-Day 필터링
        if (!task.endDate) return false;
        const endDate = KoreanTime.toKST(task.endDate);
        endDate.setHours(23, 59, 59, 999); // Normalize to end of day

        // 명시적으로 종료일이 오늘보다 과거인 업무는 제외
        if (endDate < today) return false;

        const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 0 || daysDiff > AppState.notificationDaysBefore) return false;

        // 3. 우선순위 필터링
        if (!AppState.notificationPriorities.includes(task.priority)) return false;

        // 4. 카테고리 필터링
        if (AppState.notificationCategory1 !== '전체' && task.category1 !== AppState.notificationCategory1) return false;
        if (AppState.notificationCategory2 !== '전체' && task.category2 !== AppState.notificationCategory2) return false;
        if (AppState.notificationCategory3 !== '전체' && task.category3 !== AppState.notificationCategory3) return false;

        return true;
    });

    return notificationTasks.sort((a, b) => new Date(a.endDate) - new Date(b.endDate)); // Sort by end date
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const notificationTitle = document.getElementById('notificationDropdownTitle');

    if (notificationTitle) {
        if (AppState.notificationDaysBefore === 0) {
            notificationTitle.textContent = '오늘 종료 예정 업무';
        } else {
            notificationTitle.textContent = `종료일 D-${AppState.notificationDaysBefore}일 이내 업무`;
        }
    }
    
    notificationList.innerHTML = '';

    if (notifications.length === 0) {
        notificationList.innerHTML = '<li>알림 없음</li>';
        notificationCount.textContent = '0';
        return;
    }

    notificationCount.textContent = notifications.length;
    notifications.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="task-name">${task.taskName}</span>
            <span class="end-date">(${task.endDate} 종료)</span>
        `;
        li.onclick = () => {
            selectDate(task.endDate); // Navigate to task's end date
            openTaskModal(task);     // Open task modal for detail
            toggleNotificationDropdown(); // Close dropdown
        };
        notificationList.appendChild(li);
    });
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('show');
}

// Helper function to format a Date object to 'YYYY-MM-DD'
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Gantt Chart 관련 함수

function transformTasksForGantt(tasks) {
    let filteredTasks = tasks
        .filter(task => task.startDate && task.endDate); // Filter out tasks without valid start or end dates

    // Gantt Status Filter
    if (AppState.ganttStatusFilter !== '전체') {
        filteredTasks = filteredTasks.filter(task => task.status === AppState.ganttStatusFilter);
    }

    // Gantt Priority Filter
    if (AppState.ganttPriorityFilter !== '전체') {
        filteredTasks = filteredTasks.filter(task => task.priority === AppState.ganttPriorityFilter);
    }

    return filteredTasks
        .sort((a, b) => { // Add sorting here
            const dateA = new Date(a.endDate);
            const dateB = new Date(b.endDate);
            return dateA.getTime() - dateB.getTime(); // Sort ascending by endDate
        })
        .map(task => {
        let progress = 0;
        let custom_class = '';
        // *** CORRECTED: Assign custom_class based on task.priority, not task.status ***
        switch (task.priority) {
            case 'very-high':
                custom_class = 'gantt-priority-very-high';
                break;
            case 'high':
                custom_class = 'gantt-priority-high';
                break;
            case 'middle':
                custom_class = 'gantt-priority-middle';
                break;
            case 'low':
                custom_class = 'gantt-priority-low';
                break;
            case 'very-low':
                custom_class = 'gantt-priority-very-low';
                break;
            default:
                custom_class = 'gantt-priority-middle'; // Default to middle if not set
        }

        // Use category1 for group if available, otherwise taskName
        const parentCategory = task.category1 || task.taskName;
        // Combine categories for unique task name in Gantt
        const ganttTaskName = [task.category1, task.category2, task.category3, task.taskName]
                                .filter(Boolean).join(' > ');
                                
        // Ensure start and end dates are valid for Gantt chart
        const startDate = task.startDate || task.endDate;
        const endDate = task.endDate || task.startDate;

        return {
            id: task.id,
            name: ganttTaskName,
            start: startDate,
            end: endDate,
            progress: progress,
            custom_class: custom_class, // Now uses priority class
            // Assuming frappe-gantt can use 'dependencies' for linking tasks
            // dependencies: task.dependencies ? task.dependencies.join(',') : '',
            // Assuming 'start_date' and 'end_date' can be used for display, if 'start' and 'end' are for calculation
        };
    });
}

function postProcessGanttHeaders() {
    const ganttElement = document.getElementById('gantt-target');
    if (!ganttElement) return;

    // Get all text elements within the Gantt SVG
    const textElements = ganttElement.querySelectorAll('text');

    textElements.forEach(textElement => {
        const originalText = textElement.textContent.trim();
        const className = textElement.getAttribute('class') || '';

        // upper-text: 월 표시 (예: February -> 2월)
        if (className.includes('upper-text')) {
            for (let i = 0; i < monthNamesEn.length; i++) {
                const enMonth = monthNamesEn[i];
                const koMonth = monthNamesKo[i];
                const regex = new RegExp(`^${enMonth}$`, 'i');

                if (regex.test(originalText)) {
                    textElement.textContent = koMonth;
                    break;
                }
            }
        }
        
        // lower-text: 일 표시 (예: 15 -> 15일)
        if (className.includes('lower-text')) {
            // 숫자만 있는 경우 (일자)
            if (/^\d{1,2}$/.test(originalText)) {
                const dayNumber = parseInt(originalText);
                if (dayNumber >= 1 && dayNumber <= 31) {
                    textElement.textContent = dayNumber + '일';
                }
            }
        }
    });
}

function applyGanttDateTextStyling() {
    // This function can be used for other date text styling not covered by tick_format.
    // For now, it remains a placeholder.
}

function initGanttChart(forceRefresh = false) { // Add forceRefresh parameter
    activateGanttFilterButtons(); // 필터 버튼 상태 업데이트 (초기 로드 또는 리프레시 시)
    const ganttTasks = transformTasksForGantt(AppState.tasks);
    const ganttElement = document.getElementById('gantt-target');

    if (!ganttElement) return; // Ensure element exists

    if (AppState.gantt && !forceRefresh) {
        // If gantt instance exists and no force refresh, just ensure its data is current
        // Frappe Gantt does not have a public 'updateData' method, but refresh can be triggered by view change or by passing new tasks
        AppState.gantt.refresh(ganttTasks); // Pass current tasks for refresh
        AppState.gantt.change_view_mode(AppState.gantt.options.view_mode); // Force redraw with current mode
        postProcessGanttHeaders();
        applyGanttDateTextStyling();
        return;
    }

    // If no instance or forceRefresh is true, create a new one
    ganttElement.innerHTML = ''; // Clear previous SVG content before creating new instance

    if (ganttTasks.length === 0) {
        ganttElement.innerHTML = '<p style="text-align: center; padding: 20px;">간트 차트에 표시할 업무가 없습니다.</p>';
        return;
    }
    
    AppState.gantt = new Gantt(ganttElement, ganttTasks, {
        header_height: 65,        // 헤더 높이
        column_width: 40,         // 열 너비 (일자별)
        step: 24,
        view_modes: ['Day', 'Week', 'Month'],
        bar_height: 30,           // 바 높이
        bar_corner_radius: 4,
        arrow_curve: 5,
        padding: 24,
        view_mode: 'Day',         // ★ Day 모드로 변경 (월,일 표시)
        date_format: 'YYYY-MM-DD',
        language: 'ko',
        details_view_mode: false,

        on_click: function (task) {
            console.log(task);
            openTaskModal(AppState.tasks.find(t => t.id === task.id));
        },
        on_date_change: function (task, start, end) {
            console*console.log(task, start, end);
            updateTask(task.id, { startDate: formatDate(start), endDate: formatDate(end) });
        },
        on_progress_change: function (task, progress) {
            console.log(task, progress);
            let status = '진행중';
            if (progress === 100) status = '완료';
            else if (progress === 0) status = '대기';
            updateTask(task.id, { status: status });
        },
        on_view_change: function (mode) {
            console.log(mode);
            postProcessGanttHeaders();
            applyGanttDateTextStyling();
        }
    });
    
    // ★ Day 모드로 설정 (월,일 기준)
    AppState.gantt.change_view_mode('Day');

    // 한글 헤더 처리 지연 실행
    setTimeout(() => {
        postProcessGanttHeaders();
        applyGanttDateTextStyling();
    }, 100);
}

async function initNotifications() {
    document.getElementById('notificationBtn').addEventListener('click', (event) => {
        event.stopPropagation();
        toggleNotificationDropdown();
    });
}


function switchView(viewName) {
    const calendarView = document.getElementById('calendar-view');
    const ganttChartView = document.getElementById('gantt-chart-view');
    const dashboardView = document.getElementById('dashboard-view');
    const kanbanView = document.getElementById('kanban-view');

    // Remove active class from all sidebar links
    document.querySelectorAll('.sidebar-menu li a').forEach(link => {
        link.classList.remove('active');
    });

    // Hide all views
    calendarView.style.display = 'none';
    ganttChartView.style.display = 'none';
    dashboardView.style.display = 'none';
    if (kanbanView) kanbanView.style.display = 'none';

    // Show selected view and set active class on sidebar link
    if (viewName === 'calendar') {
        calendarView.style.display = 'block';
        document.getElementById('sidebarCalendarLink').classList.add('active');
    } else if (viewName === 'gantt') {
        ganttChartView.style.display = 'block';
        document.getElementById('sidebarGanttLink').classList.add('active');
        initGanttChart(); 
    } else if (viewName === 'dashboard') {
        dashboardView.style.display = 'block';
        document.getElementById('sidebarDashboardLink').classList.add('active');
        UI.dashboard.render(AppState.tasks);
    } else if (viewName === 'kanban') {
        if (kanbanView) kanbanView.style.display = 'block';
        document.getElementById('sidebarKanbanLink').classList.add('active');
        
        // 칸반 뷰 전환 시 검색어 초기화
        for (const status in AppState.kanbanSearchTerms) {
            AppState.kanbanSearchTerms[status] = '';
            const searchInput = document.querySelector(`#kanban-${status}`).previousElementSibling.querySelector('.kanban-search-input');
            if (searchInput) {
                searchInput.value = '';
            }
        }
        UI.kanban.render(AppState.tasks);
    }
    StorageUtils.set('currentView', viewName);
}

// Kanban Drag and Drop Functions
function allowDrop(ev) {
    ev.preventDefault();
    const column = ev.currentTarget;
    if (column.classList.contains('kanban-column')) {
        column.classList.add('drag-over');
    }
}

async function dropTask(ev) {
    ev.preventDefault();
    const column = ev.currentTarget;
    column.classList.remove('drag-over');
    
    const taskId = ev.dataTransfer.getData("text/plain");
    const newStatus = column.getAttribute('data-status');
    
    if (taskId && newStatus) {
        const task = AppState.tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            await updateTask(taskId, { status: newStatus });
        }
    }
}

// Global Search Functions
function handleGlobalSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('globalSearchResults');
    
    if (!query) {
        resultsContainer.style.display = 'none';
        return;
    }

    const matches = AppState.tasks.filter(task => 
        task.taskName.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query)) ||
        task.category1.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to top 10 results

    renderGlobalSearchResults(matches);
}

function renderGlobalSearchResults(matches) {
    const resultsContainer = document.getElementById('globalSearchResults');
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'block';

    if (matches.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-empty">검색 결과가 없습니다.</div>';
        return;
    }

    matches.forEach(task => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        const priorityText = {
            'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
        }[task.priority] || '중간';

        item.innerHTML = `
            <div class="search-result-title">${TextUtils.escapeHtml(task.taskName)}</div>
            <div class="search-result-meta">
                <span>${TextUtils.escapeHtml(task.category1)} > ${task.status}</span>
                <span>${priorityText} | ${task.endDate || ''}</span>
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

function loadView() {
    const savedView = StorageUtils.get('currentView', 'calendar');
    switchView(savedView);
}


// Re-load notifications whenever tasks are loaded/reloaded
const originalLoadTasks = loadTasks;
loadTasks = async () => {
    await originalLoadTasks();
    AppState.notifications = getTasksEndingSoon(AppState.tasks);
    renderNotifications(AppState.notifications);
};


// --- 날짜 선택 및 이동 함수 ---

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


// --- 전체 업무 모달 관련 함수 ---

function activateFilterButtons() {
    // Activate Status Filter Buttons
    const statusFilterBtns = document.querySelectorAll('#allTasksModal .status-filters .filter-btn');
    statusFilterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === AppState.currentStatusFilter) {
            btn.classList.add('active');
        } else if (AppState.currentStatusFilter === '' && btn.getAttribute('data-status') === '전체') {
            btn.classList.add('active');
        }
    });

    // Activate Priority Filter Buttons
    const priorityFilterBtns = document.querySelectorAll('#allTasksModal .priority-filters .filter-btn');
    priorityFilterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-priority') === AppState.currentPriorityFilter) {
            btn.classList.add('active');
        } else if (AppState.currentPriorityFilter === '' && btn.getAttribute('data-priority') === '전체') {
            btn.classList.add('active');
        }
    });
}

function openAllTasksModal(statusToFilter = '전체', priorityToFilter = '전체') {
    const modal = document.getElementById('allTasksModal');
    
    AppState.currentStatusFilter = statusToFilter;
    AppState.currentPriorityFilter = priorityToFilter;
    AppState.currentPage = 1;
    
    populateSearchCategories();
    renderAllTasks();
    activateFilterButtons(); // Activate filter buttons based on current AppState

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

function closeAllTasksModal() {
    document.getElementById('allTasksModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function toggleSearchType() {
    AppState.currentSearchType = document.querySelector('input[name="searchType"]:checked').value;
    
    if (AppState.currentSearchType === 'text') {
        document.getElementById('textSearchBox').style.display = 'block';
        document.getElementById('categorySearchBox').style.display = 'none';
    } else {
        document.getElementById('textSearchBox').style.display = 'none';
        document.getElementById('categorySearchBox').style.display = 'block';
    }
    
    searchAllTasks();
}

function populateSearchCategories() {
    const cat1 = document.getElementById('searchCategory1');
    const mainCategories = ArrayUtils.unique(AppState.categories.map(c => c.mainCategory));
    
    cat1.innerHTML = '<option value="">전체 대분류</option>';
    mainCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        cat1.appendChild(option);
    });
    // Set selected value from AppState
    cat1.value = AppState.currentSearchCategory1;
}

function updateSearchCategory2() {
    const cat1 = document.getElementById('searchCategory1').value; // Correctly gets value
    const cat2 = document.getElementById('searchCategory2');
    const cat3 = document.getElementById('searchCategory3');

    cat2.innerHTML = '<option value="">전체 중분류</option>';
    cat3.innerHTML = '<option value="">전체 소분류</option>';

    if (!cat1) return;

    const subCategories = ArrayUtils.unique(
        AppState.categories
            .filter(c => c.mainCategory === cat1 && c.subCategory) // FIX: Use 'cat1'
            .map(c => c.subCategory)
    );
    
    subCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        cat2.appendChild(option);
    });
    // Set selected value from AppState and trigger update for category3
    cat2.value = AppState.currentSearchCategory2;
    updateSearchCategory3();
}

function updateSearchCategory3() {
    const cat1 = document.getElementById('searchCategory1').value;
    const cat2 = document.getElementById('searchCategory2').value; // Correctly gets value
    const cat3 = document.getElementById('searchCategory3');

    cat3.innerHTML = '<option value="">전체 소분류</option>';

    if (!cat1 || !cat2) return;

    const detailCategories = ArrayUtils.unique(
        AppState.categories
            .filter(c => c.mainCategory === cat1 && c.subCategory === cat2 && c.detailCategory) // FIX: Use 'cat2'
            .map(c => c.detailCategory)
    );
    
    detailCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        cat3.appendChild(option);
    });
    // Set selected value from AppState
    cat3.value = AppState.currentSearchCategory3;
}

function searchAllTasks() {
    AppState.currentPage = 1;
    renderAllTasks();
}

function renderAllTasks() {
    const allTasksList = document.getElementById('allTasksList');
    
    let filteredTasks = AppState.tasks;
    
    if (AppState.currentStatusFilter !== '전체') {
        filteredTasks = filteredTasks.filter(task => task.status === AppState.currentStatusFilter);
    }
    
    // 우선순위 필터
    if (AppState.currentPriorityFilter !== '전체') {
        filteredTasks = filteredTasks.filter(task => task.priority === AppState.currentPriorityFilter);
    }
    
    if (AppState.currentSearchType === 'text') {
        const searchText = document.getElementById('textSearchInput').value.toLowerCase();
        if (searchText) {
            filteredTasks = filteredTasks.filter(task =>
                task.taskName.toLowerCase().includes(searchText) ||
                (task.description && task.description.toLowerCase().includes(searchText))
            );
        }
    } else { // Category search
        // Use AppState category filters for rendering
        if (AppState.currentSearchCategory1) {
            filteredTasks = filteredTasks.filter(task => task.category1 === AppState.currentSearchCategory1);
        }
        if (AppState.currentSearchCategory2) {
            filteredTasks = filteredTasks.filter(task => task.category2 === AppState.currentSearchCategory2);
        }
        if (AppState.currentSearchCategory3) {
            filteredTasks = filteredTasks.filter(task => task.category3 === AppState.currentSearchCategory3);
        }
    }
    
    if (filteredTasks.length === 0) {
        allTasksList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">검색 결과가 없습니다.</p>';
        updatePaginationControls(1);
        return;
    }
    
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        let valA, valB;

        switch (AppState.sortField) {
            case 'endDate':
                valA = a.endDate ? new Date(a.endDate) : new Date(0);
                valB = b.endDate ? new Date(b.endDate) : new Date(0);
                break;
            case 'startDate':
                valA = a.startDate ? new Date(a.startDate) : new Date(0);
                valB = b.startDate ? new Date(b.startDate) : new Date(0);
                break;
            case 'taskName':
                valA = a.taskName.toLowerCase();
                valB = b.taskName.toLowerCase();
                break;
            case 'status':
                valA = a.status;
                valB = b.status;
                break;
            default:
                valA = new Date(a.startDate);
                valB = new Date(b.startDate);
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
            return AppState.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(a.taskName); // Fixed sort issue for same tasks, ensuring stability
        } else {
            return AppState.sortDirection === 'asc' ? valA - valB : valB - valA;
        }
    });
    
    const totalPages = Math.ceil(sortedTasks.length / AppState.tasksPerPage);
    const startIndex = (AppState.currentPage - 1) * AppState.tasksPerPage;
    const endIndex = startIndex + AppState.tasksPerPage;
    const pageTasks = sortedTasks.slice(startIndex, endIndex);
    
    allTasksList.innerHTML = '';
    pageTasks.forEach(task => {
        allTasksList.appendChild(UI.task.createCard(task));
    });
    
    updatePaginationControls(totalPages);
}

function updatePaginationControls(totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    pageInfo.textContent = `${AppState.currentPage} / ${totalPages}`;
    prevBtn.disabled = AppState.currentPage === 1;
    nextBtn.disabled = AppState.currentPage === totalPages;
}

function previousPage() {
    if (AppState.currentPage > 1) {
        AppState.currentPage--;
        renderAllTasks();
    }
}

function nextPage() {
    AppState.currentPage++;
    renderAllTasks();
}

function filterByStatus(status) {
    AppState.currentStatusFilter = status;
    AppState.currentPage = 1;
    
    const filterBtns = document.querySelectorAll('.status-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === AppState.currentStatusFilter) {
            btn.classList.add('active');
        } else if (AppState.currentStatusFilter === '' && btn.getAttribute('data-status') === '전체') {
            btn.classList.add('active');
        }
    });
    
    renderAllTasks();
}

function filterByPriority(priority) {
    AppState.currentPriorityFilter = priority;
    AppState.currentPage = 1;

    const filterBtns = document.querySelectorAll('.priority-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-priority') === AppState.currentPriorityFilter) {
            btn.classList.add('active');
        } else if (AppState.currentPriorityFilter === '' && btn.getAttribute('data-priority') === '전체') {
            btn.classList.add('active');
        }
    });

    renderAllTasks();
}

function openAllTasksModalWithStatus(status) {
    openAllTasksModal(status, '전체');
}

function openAllTasksModalWithPriority(priority) {
    openAllTasksModal('전체', priority);
}

function openAllTasksModalWithCategory(category1, category2 = '', category3 = '') {
    AppState.currentSearchCategory1 = category1;
    AppState.currentSearchCategory2 = category2;
    AppState.currentSearchCategory3 = category3;
    
    // Reset status and priority filters when opening with category
    AppState.currentStatusFilter = '전체';
    AppState.currentPriorityFilter = '전체';

    // Set search type to category
    document.querySelector('input[name="searchType"][value="category"]').checked = true;
    toggleSearchType();

    // Call openAllTasksModal to handle the rest, including rendering and showing modal
    openAllTasksModal(); 
}

function changeAllTasksSort() {
    AppState.sortField = document.getElementById('sortField').value;
    AppState.sortDirection = document.getElementById('sortDirection').value;
    AppState.currentPage = 1;
    renderAllTasks();
}

// --- 간트 차트 필터 관련 함수 ---
function filterGanttByStatus(status) {
    AppState.ganttStatusFilter = status;
    StorageUtils.set('ganttStatusFilter', status); // 설정 저장
    initGanttChart(true); // 필터 적용 후 간트 차트 리프레시 (강제 리프레시)
    activateGanttFilterButtons(); // 버튼 상태 업데이트
}

function filterGanttByPriority(priority) {
    AppState.ganttPriorityFilter = priority;
    StorageUtils.set('ganttPriorityFilter', priority); // 설정 저장
    initGanttChart(true); // 필터 적용 후 간트 차트 리프레시 (강제 리프레시)
    activateGanttFilterButtons(); // 버튼 상태 업데이트
}

function activateGanttFilterButtons() {
    // 상태 필터 버튼 활성화
    const statusFilterBtns = document.querySelectorAll('.gantt-filters .status-filters .filter-btn');
    statusFilterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === AppState.ganttStatusFilter) {
            btn.classList.add('active');
        } else if (AppState.ganttStatusFilter === '' && btn.getAttribute('data-status') === '전체') {
            btn.classList.add('active');
        }
    });

    // 우선순위 필터 버튼 활성화
    const priorityFilterBtns = document.querySelectorAll('.gantt-filters .priority-filters .filter-btn');
    priorityFilterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-priority') === AppState.ganttPriorityFilter) {
            btn.classList.add('active');
        } else if (AppState.ganttPriorityFilter === '' && btn.getAttribute('data-priority') === '전체') {
            btn.classList.add('active');
        }
    });
}

// --- 칸반 보드 검색 필터 관련 함수 ---
function filterKanbanColumn(status, searchTerm) {
    AppState.kanbanSearchTerms[status] = searchTerm;
    UI.kanban.render(AppState.tasks); // 필터링된 업무로 해당 컬럼 다시 렌더링
}

// --- 알림 설정 모달 관련 함수 ---

function openNotificationSettingsModal() {
    const modal = document.getElementById('notificationSettingsModal');
    // 현재 설정 로드
    document.getElementById('notificationDaysBefore').value = AppState.notificationDaysBefore;

    document.querySelectorAll('input[name="notificationPriority"]').forEach(checkbox => {
        checkbox.checked = AppState.notificationPriorities.includes(checkbox.value);
    });
    document.querySelectorAll('input[name="notificationStatus"]').forEach(checkbox => {
        checkbox.checked = AppState.notificationStatuses.includes(checkbox.value);
    });

    populateNotificationCategories();
    document.getElementById('notificationCategory1').value = AppState.notificationCategory1;
    populateNotificationSubCategories(); // 중분류 채우고 선택
    document.getElementById('notificationCategory2').value = AppState.notificationCategory2;
    populateNotificationDetailCategories(); // 소분류 채우고 선택
    document.getElementById('notificationCategory3').value = AppState.notificationCategory3;

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

function closeNotificationSettingsModal() {
    document.getElementById('notificationSettingsModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function populateNotificationCategories() {
    const category1Select = document.getElementById('notificationCategory1');
    const mainCategories = ArrayUtils.unique(AppState.categories.map(c => c.mainCategory));
    
    category1Select.innerHTML = '<option value="전체">전체</option>';
    mainCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        category1Select.appendChild(option);
    });
}

function populateNotificationSubCategories() {
    const category1 = document.getElementById('notificationCategory1').value;
    const category2Select = document.getElementById('notificationCategory2');
    
    category2Select.innerHTML = '<option value="전체">전체</option>';
    
    if (category1 === '전체') return;
    
    const subCategories = ArrayUtils.unique(
        AppState.categories
            .filter(c => c.mainCategory === category1 && c.subCategory)
            .map(c => c.subCategory)
    );
    
    subCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        category2Select.appendChild(option);
    });
}

function populateNotificationDetailCategories() {
    const category1 = document.getElementById('notificationCategory1').value;
    const category2 = document.getElementById('notificationCategory2').value;
    const category3Select = document.getElementById('notificationCategory3');
    
    category3Select.innerHTML = '<option value="전체">전체</option>';
    
    if (category1 === '전체' || category2 === '전체') return;
    
    const detailCategories = ArrayUtils.unique(
        AppState.categories
            .filter(c => c.mainCategory === category1 && c.subCategory === category2 && c.detailCategory)
            .map(c => c.detailCategory)
    );
    
    detailCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        category3Select.appendChild(option);
    });
}


async function saveNotificationSettings(event) {
    event.preventDefault();

    // D-Day
    AppState.notificationDaysBefore = parseInt(document.getElementById('notificationDaysBefore').value);
    StorageUtils.set('notificationDaysBefore', AppState.notificationDaysBefore);

    // Priorities
    AppState.notificationPriorities = Array.from(document.querySelectorAll('input[name="notificationPriority"]:checked')).map(cb => cb.value);
    StorageUtils.set('notificationPriorities', AppState.notificationPriorities);
    
    // Statuses
    AppState.notificationStatuses = Array.from(document.querySelectorAll('input[name="notificationStatus"]:checked')).map(cb => cb.value);
    StorageUtils.set('notificationStatuses', AppState.notificationStatuses);

    // Categories
    AppState.notificationCategory1 = document.getElementById('notificationCategory1').value;
    AppState.notificationCategory2 = document.getElementById('notificationCategory2').value;
    AppState.notificationCategory3 = document.getElementById('notificationCategory3').value;
    StorageUtils.set('notificationCategory1', AppState.notificationCategory1);
    StorageUtils.set('notificationCategory2', AppState.notificationCategory2);
    StorageUtils.set('notificationCategory3', AppState.notificationCategory3);

    // 알림 리프레시
    await loadTasks(); // 모든 업무를 다시 로드하여 알림을 갱신
    closeNotificationSettingsModal();
    alert('알림 설정이 저장되었습니다.');
}

// --- 카테고리 모달 관련 함수 ---

function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    resetCategoryForm();
    loadCategories();
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
}

function editCategoryItem(category) {
    document.getElementById('categoryId').value = category.id;
    document.getElementById('mainCategory').value = category.mainCategory;
    document.getElementById('subCategory').value = category.subCategory || '';
    document.getElementById('detailCategory').value = category.detailCategory || '';
}

async function saveCategory(event) {
    event.preventDefault();
    
    const categoryId = document.getElementById('categoryId').value;
    const categoryData = {
        mainCategory: document.getElementById('mainCategory').value,
        subCategory: document.getElementById('subCategory').value || '',
        detailCategory: document.getElementById('detailCategory').value || ''
    };
    
    if (categoryId) {
        await updateCategory(categoryId, categoryData);
    } else {
        await createCategory(categoryData);
    }
    
    resetCategoryForm();
}


// --- 업무 모달 관련 함수 ---

function openTaskModal(task = null) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');
    
    populateCategoryDropdowns();
    
    if (task) {
        modalTitle.textContent = task.id ? '업무 수정' : '새 업무 추가';
        document.getElementById('taskId').value = task.id || '';
        document.getElementById('category1').value = task.category1;
        
        setTimeout(() => {
            updateSubCategories();
            if (task.category2) {
                document.getElementById('category2').value = task.category2;
            }
            
            setTimeout(() => {
                updateDetailCategories();
                if (task.category3) {
                    document.getElementById('category3').value = task.category3;
                }
            }, 100);
        }, 100);
        
        document.getElementById('taskName').value = task.taskName;
        document.getElementById('startDate').value = task.startDate;
        document.getElementById('endDate').value = task.endDate;
        document.getElementById('status').value = task.status;
        document.getElementById('priority').value = task.priority || 'middle';
        document.getElementById('description').value = task.description || '';
    } else {
        modalTitle.textContent = '새 업무 추가';
        document.getElementById('taskId').value = '';
        document.getElementById('taskForm').reset();
        
        const today = KoreanTime.today(); // Use KoreanTime.today() for consistent date
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('status').value = '대기';
        document.getElementById('priority').value = 'middle'; // Set default priority
    }
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function populateCategoryDropdowns() {
    const category1Select = document.getElementById('category1');
    const mainCategories = ArrayUtils.unique(AppState.categories.map(c => c.mainCategory));
    
    category1Select.innerHTML = '<option value="">선택하세요</option>';
    mainCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        category1Select.appendChild(option);
    });
}

function updateSubCategories() {
    const category1 = document.getElementById('category1').value;
    const category2Select = document.getElementById('category2');
    const category3Select = document.getElementById('category3');
    
    category2Select.innerHTML = '<option value="">선택하세요</option>';
    category3Select.innerHTML = '<option value="">선택하세요</option>';
    
    if (!category1) return;
    
    const subCategories = ArrayUtils.unique(
        AppState.categories
            .filter(c => c.mainCategory === category1 && c.subCategory)
            .map(c => c.subCategory)
    );
    
    subCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        category2Select.appendChild(option);
    });
}

function updateDetailCategories() {
    const category1 = document.getElementById('category1').value;
    const category2 = document.getElementById('category2').value;
    const category3Select = document.getElementById('category3');
    
    category3Select.innerHTML = '<option value="">선택하세요</option>';
    
    if (!category1 || !category2) return;
    
    const detailCategories = ArrayUtils.unique(
        AppState.categories
            .filter(c => c.mainCategory === category1 && c.subCategory === category2 && c.detailCategory)
            .map(c => c.detailCategory)
    );
    
    detailCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        category3Select.appendChild(option);
    });
}

async function saveTask(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('taskId').value;
    
    const savedCategory1 = document.getElementById('category1').value;
    const savedCategory2 = document.getElementById('category2').value;
    const savedCategory3 = document.getElementById('category3').value;
    
    const taskData = {
        category1: savedCategory1,
        category2: savedCategory2 || '',
        category3: savedCategory3 || '',
        taskName: document.getElementById('taskName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        description: document.getElementById('description').value,
    };
    
    if (taskData.startDate && taskData.endDate) {
        if (new Date(taskData.startDate) > new Date(taskData.endDate)) {
            alert('종료 날짜는 시작 날짜보다 이후여야 합니다.');
            return;
        }
    }
    
    if (taskId) {
        try {
            await updateTask(taskId, taskData);
            closeTaskModal();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('업무 수정 중 오류가 발생했습니다.');
        }
    } else {
        try {
            await createTask(taskData);
            closeTaskModal();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('업무 생성 중 오류가 발생했습니다.');
        }
        
        const today = KoreanTime.today();
        
        document.getElementById('taskName').value = '';
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        document.getElementById('status').value = '대기';
        document.getElementById('description').value = '';
        
        document.getElementById('category1').value = savedCategory1;
        updateSubCategories();
        document.getElementById('category2').value = savedCategory2;
        updateDetailCategories();
        document.getElementById('category3').value = savedCategory3;
        
        document.getElementById('taskName').focus();
    }
}


// --- 중요 메모 모달 관련 함수 ---

function openImportantMemoModal(taskId, memoContent) {
    const modal = document.getElementById('importantMemoModal');
    document.getElementById('memoTaskId').value = taskId;
    document.getElementById('importantMemoContent').value = memoContent || '';
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

function closeImportantMemoModal() {
    document.getElementById('importantMemoModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

async function saveImportantMemo(event) {
    event.preventDefault();
    const taskId = document.getElementById('memoTaskId').value;
    const importantMemo = document.getElementById('importantMemoContent').value;

    if (!taskId) {
        console.error('Task ID is missing for saving important memo.');
        alert('메모를 저장할 업무를 찾을 수 없습니다.');
        return;
    }

    try {
        await updateTask(taskId, { importantMemo });
        closeImportantMemoModal();
    } catch (error) {
        console.error('Error saving important memo:', error);
        alert('중요 메모 저장 중 오류가 발생했습니다.');
    }
}


// --- DOMContentLoaded 리스너 ---

document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    loadView(); // 적용된 뷰를 즉시 로드하여 깜빡임 방지
    await loadCategories();
    await loadTasks();
    await loadHolidays();
    renderCalendar();
    updateSelectedDateTitle();
    initNotifications();

    // Add event listeners for notification settings
    document.getElementById('notificationSettingsBtn').addEventListener('click', openNotificationSettingsModal);
    document.getElementById('notificationCategory1').addEventListener('change', populateNotificationSubCategories);
    document.getElementById('notificationCategory2').addEventListener('change', populateNotificationDetailCategories);

    // Add event listeners for view switching
    document.getElementById('sidebarDashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dashboard');
    });
    document.getElementById('sidebarCalendarLink').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('calendar');
    });
    document.getElementById('sidebarGanttLink').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('gantt');
    });
    document.getElementById('sidebarKanbanLink').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('kanban');
    });
});


// --- 전역 이벤트 리스너 ---

window.onclick = function(event) {
    const taskModal = document.getElementById('taskModal');
    const categoryModal = document.getElementById('categoryModal');
    const allTasksModal = document.getElementById('allTasksModal');
    const importantMemoModal = document.getElementById('importantMemoModal');
    
    if (event.target === taskModal) {
        closeTaskModal();
    }
    if (event.target === categoryModal) {
        closeCategoryModal();
    }
    if (event.target === allTasksModal) {
        closeAllTasksModal();
    }
    if (importantMemoModal && event.target === importantMemoModal) {
        closeImportantMemoModal();
    }
    const notificationSettingsModal = document.getElementById('notificationSettingsModal');
    if (notificationSettingsModal && event.target === notificationSettingsModal) {
        closeNotificationSettingsModal();
    }

    // Close global search results when clicking outside
    const globalSearchResults = document.getElementById('globalSearchResults');
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchResults && !globalSearchResults.contains(event.target) && event.target !== globalSearchInput) {
        globalSearchResults.style.display = 'none';
    }

    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationBtn = document.getElementById('notificationBtn');

    if (notificationDropdown && notificationBtn && notificationDropdown.classList.contains('show') && !notificationDropdown.contains(event.target) && !notificationBtn.contains(event.target)) {
        toggleNotificationDropdown();
    }
}


// --- 전역 함수 노출 ---

window.loadTheme = loadTheme; // Added to window scope
window.changeTheme = changeTheme; // Added to window scope
window.switchView = switchView; // Added to window scope
window.loadView = loadView; // Added to window scope
window.initGanttChart = initGanttChart; // Added to window scope
window.transformTasksForGantt = transformTasksForGantt; // Added to window scope
window.postProcessGanttHeaders = postProcessGanttHeaders; // Added to window scope
window.applyGanttDateTextStyling = applyGanttDateTextStyling; // Added to window scope
window.loadTasks = loadTasks; // Added to window scope
window.createTask = createTask; // Added to window scope
window.updateTask = updateTask; // Added to window scope
window.deleteTask = deleteTask; // Added to window scope
window.copyTask = copyTask; // Added to window scope
window.loadCategories = loadCategories; // Added to window scope
window.createCategory = createCategory; // Added to window scope
window.updateCategory = updateCategory; // Added to window scope
window.deleteCategory = deleteCategory; // Added to window scope
window.copyCategory = copyCategory; // Added to window scope
window.loadHolidays = loadHolidays; // Added to window scope
window.renderCalendar = renderCalendar; // Added to window scope
window.renderTasksForSelectedDate = renderTasksForSelectedDate; // Added to window scope
window.updateSelectedDateTitle = updateSelectedDateTitle; // Added to window scope
window.getTasksEndingSoon = getTasksEndingSoon; // Added to window scope
window.renderNotifications = renderNotifications; // Added to window scope
window.toggleNotificationDropdown = toggleNotificationDropdown; // Added to window scope
window.initNotifications = initNotifications; // Added to window scope
window.selectDate = selectDate;
window.previousMonth = previousMonth; // Added to window scope
window.nextMonth = nextMonth; // Added to window scope
window.openAllTasksModal = openAllTasksModal; // Added to window scope
window.closeAllTasksModal = closeAllTasksModal; // Added to window scope
window.toggleSearchType = toggleSearchType; // Added to window scope
window.populateSearchCategories = populateSearchCategories; // Added to window scope
window.updateSearchCategory2 = updateSearchCategory2; // Added to window scope
window.updateSearchCategory3 = updateSearchCategory3; // Added to window scope
window.searchAllTasks = searchAllTasks; // Added to window scope
window.renderAllTasks = renderAllTasks; // Added to window scope
window.updatePaginationControls = updatePaginationControls; // Added to window scope
window.previousPage = previousPage; // Added to window scope
window.nextPage = nextPage; // Added to window scope
window.filterByStatus = filterByStatus; // Added to window scope
window.filterByPriority = filterByPriority; // Added to window scope
window.filterSelectedDateTasksByStatus = filterSelectedDateTasksByStatus; // Added to window scope
window.openAllTasksModalWithStatus = openAllTasksModalWithStatus;
window.changeAllTasksSort = changeAllTasksSort; // Added to window scope
window.openAllTasksModalWithCategory = openAllTasksModalWithCategory;
window.filterGanttByStatus = filterGanttByStatus;
window.filterGanttByPriority = filterGanttByPriority;
window.openCategoryModal = openCategoryModal; // Added to window scope
window.closeCategoryModal = closeCategoryModal; // Added to window scope
window.resetCategoryForm = resetCategoryForm; // Added to window scope
window.editCategoryItem = editCategoryItem; // Added to window scope
window.saveCategory = saveCategory; // Added to window scope
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal; // Added to window scope
window.populateCategoryDropdowns = populateCategoryDropdowns; // Added to window scope
window.updateSubCategories = updateSubCategories; // Added to window scope
window.updateDetailCategories = updateDetailCategories; // Added to window scope
window.saveTask = saveTask; // Added to window scope
window.openImportantMemoModal = openImportantMemoModal;
window.closeImportantMemoModal = closeImportantMemoModal;
window.saveImportantMemo = saveImportantMemo;
window.openNotificationSettingsModal = openNotificationSettingsModal;
window.closeNotificationSettingsModal = closeNotificationSettingsModal;
window.saveNotificationSettings = saveNotificationSettings;
window.populateNotificationSubCategories = populateNotificationSubCategories;
window.populateNotificationDetailCategories = populateNotificationDetailCategories;
window.allowDrop = allowDrop;
window.dropTask = dropTask;
window.handleGlobalSearch = handleGlobalSearch;
window.filterKanbanColumn = filterKanbanColumn;
