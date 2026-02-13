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
    currentSearchType: 'text',
    sortField: 'endDate', // Default sort field
    sortDirection: 'asc', // Default sort direction
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
    renderCalendar();
    renderTasksForSelectedDate();
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
    const tasksForDate = UI.calendar.getTasksForDate(AppState.selectedDate, AppState.tasks);
    
    if (tasksForDate.length === 0) {
        tasksList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">선택한 날짜에 업무가 없습니다.</p>';
        return;
    }
    
    tasksList.innerHTML = '';
    tasksForDate.forEach(task => {
        tasksList.appendChild(UI.task.createCard(task));
    });
}

function updateSelectedDateTitle() {
    const title = document.getElementById('selectedDateTitle');
    const year = AppState.selectedDate.getFullYear();
    const month = AppState.selectedDate.getMonth() + 1;
    const day = AppState.selectedDate.getDate();
    title.textContent = `${year}년 ${month}월 ${day}일의 업무`;
}


// --- 알림 관련 함수 ---

function getTasksEndingSoon(tasks, days = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + days);
    sevenDaysLater.setHours(23, 59, 59, 999); // Normalize to end of day

    return tasks.filter(task => {
        if (!task.endDate || task.status === '완료') {
            return false;
        }
        const endDate = new Date(task.endDate + 'T23:59:59'); // End of the day
        return endDate >= today && endDate <= sevenDaysLater;
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate)); // Sort by end date
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
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
    return tasks.map(task => {
        let progress = 0;
        let custom_class = '';
        switch (task.status) {
            case '완료': // Completed
                progress = 100;
                custom_class = 'gantt-task-completed';
                break;
            case '진행중': // In Progress
                progress = 50; // Assume 50% for in-progress
                custom_class = 'gantt-task-in-progress';
                break;
            case '대기': // Pending
                progress = 0;
                custom_class = 'gantt-task-pending';
                break;
            case '보류': // On Hold
                progress = 0;
                custom_class = 'gantt-task-on-hold';
                break;
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
            custom_class: custom_class,
            // Assuming frappe-gantt can use 'dependencies' for linking tasks
            // dependencies: task.dependencies ? task.dependencies.join(',') : '',
            // Assuming 'start_date' and 'end_date' can be used for display, if 'start' and 'end' are for calculation
        };
    });
}

function postProcessGanttHeaders() {
    const ganttElement = document.getElementById('gantt');
    if (!ganttElement) return;

    // Get all text elements within the Gantt SVG
    const textElements = ganttElement.querySelectorAll('text');

    textElements.forEach(textElement => {
        const originalText = textElement.textContent;

        // Try to match and replace English month names with Korean numerical months
        for (let i = 0; i < monthNamesEn.length; i++) {
            const enMonth = monthNamesEn[i];
            const koMonth = monthNamesKo[i];

            // Create a regex to match the full English month name (case-insensitive)
            // \b ensures whole word match, avoiding partial matches within other words.
            const regex = new RegExp(`\\b${enMonth}\\b`, 'gi');

            if (regex.test(originalText)) {
                // Replace the matched English month with the Korean numerical month
                textElement.textContent = originalText.replace(regex, koMonth);
                break; // Found and replaced, move to next text element
            }
        }

        // If an original text is just a 4-digit number (year), append '년'.
        // This is separate from month replacement.
        if (originalText.match(/^\d{4}$/) && !originalText.endsWith('년')) {
             textElement.textContent = originalText + '년';
        }
    });
}

function applyGanttDateTextStyling() {
    // This function can be used for other date text styling not covered by tick_format.
    // For now, it remains a placeholder.
}

function initGanttChart() {
    const ganttTasks = transformTasksForGantt(AppState.tasks);
    const ganttElement = document.getElementById('gantt');

    // Clear previous gantt instance if exists
    if (AppState.gantt) {
        // AppState.gantt.destroy(); // Frappe Gantt does not have a public destroy method
    }
    ganttElement.innerHTML = ''; // Clear previous SVG content

    if (ganttTasks.length === 0) {
        ganttElement.innerHTML = '<p style="text-align: center; padding: 20px;">간트 차트에 표시할 업무가 없습니다.</p>';
        return;
    }
    
    // Frappe Gantt 초기화
    AppState.gantt = new Gantt(ganttElement, ganttTasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ['Day', 'Week', 'Month'],
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_mode: 'Month',
        date_format: 'YYYY-MM-DD',
        // language: 'ko', // Frappe Gantt might not support 'ko' directly without custom translations
        details_view_mode: false,

        on_click: function (task) {
            console.log(task);
            openTaskModal(AppState.tasks.find(t => t.id === task.id));
        },
        on_date_change: function (task, start, end) {
            console.log(task, start, end);
            updateTask(task.id, { startDate: formatDate(start), endDate: formatDate(end) });
        },
        on_progress_change: function (task, progress) {
            console.log(task, progress);
            // Frappe Gantt doesn't directly support status, so we'd need to map progress back
            let status = '진행중';
            if (progress === 100) status = '완료';
            else if (progress === 0) status = '대기'; // Or original status if not started
            updateTask(task.id, { status: status });
        },
        on_view_change: function (mode) {
            console.log(mode);
            postProcessGanttHeaders();
            applyGanttDateTextStyling();
        }
    });
    
    // Initial view mode setting
    AppState.gantt.change_view_mode('Month');

    postProcessGanttHeaders();
    applyGanttDateTextStyling();
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
    const currentViewButton = document.querySelector('.current-view');

    if (viewName === 'calendar') {
        calendarView.style.display = 'block';
        ganttChartView.style.display = 'none';
        currentViewButton.textContent = '📅 일정 관리';
    } else if (viewName === 'gantt') {
        calendarView.style.display = 'none';
        ganttChartView.style.display = 'block';
        currentViewButton.textContent = '📊 간트 차트';
        initGanttChart();
    }
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
}

function updateSearchCategory2() {
    const cat1 = document.getElementById('searchCategory1').value;
    const cat2 = document.getElementById('searchCategory2');
    const cat3 = document.getElementById('searchCategory3');
    
    cat2.innerHTML = '<option value="">전체 중분류</option>';
    cat3.innerHTML = '<option value="">전체 소분류</option>';
    
    if (!cat1) return;
    
    const subCategories = ArrayUtils.unique(
        AppState.categories
            .filter(c => c.mainCategory === cat1 && c.subCategory)
            .map(c => c.subCategory)
    );
    
    subCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        cat2.appendChild(option);
    });
}

function updateSearchCategory3() {
    const cat1 = document.getElementById('searchCategory1').value;
    const cat2 = document.getElementById('searchCategory2').value;
    const cat3 = document.getElementById('searchCategory3');
    
    cat3.innerHTML = '<option value="">전체 소분류</option>';
    
    if (!cat1 || !cat2) return;
    
    const detailCategories = AppState.categories
        .filter(c => c.mainCategory === cat1 && c.subCategory === cat2 && c.detailCategory)
        .map(c => c.detailCategory);
    
    detailCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        cat3.appendChild(option);
    });
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
    } else {
        const cat1 = document.getElementById('searchCategory1').value;
        const cat2 = document.getElementById('searchCategory2').value;
        const cat3 = document.getElementById('searchCategory3').value;
        
        if (cat1) filteredTasks = filteredTasks.filter(task => task.category1 === cat1);
        if (cat2) filteredTasks = filteredTasks.filter(task => task.category2 === cat2);
        if (cat3) filteredTasks = filteredTasks.filter(task => task.category3 === cat3);
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
            return AppState.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
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
        if (btn.getAttribute('data-status') === status) {
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
        if (btn.getAttribute('data-priority') === priority) {
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

function changeAllTasksSort() {
    AppState.sortField = document.getElementById('sortField').value;
    AppState.sortDirection = document.getElementById('sortDirection').value;
    AppState.currentPage = 1;
    renderAllTasks();
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
    
    const detailCategories = AppState.categories
        .filter(c => c.mainCategory === category1 && c.subCategory === category2 && c.detailCategory)
        .map(c => c.detailCategory);
    
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
    await loadCategories();
    await loadTasks();
    await loadHolidays();
    renderCalendar();
    updateSelectedDateTitle();
    initNotifications();

    // Add event listeners for view switching
    const calendarLink = document.getElementById('calendarViewLink');
    const ganttLink = document.getElementById('ganttViewLink');
    const viewSelector = document.querySelector('.view-selector');
    const currentViewButton = document.querySelector('.current-view');
    const viewDropdown = document.querySelector('.view-dropdown');

    if (calendarLink) {
        calendarLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('calendar');
            if (viewDropdown) viewDropdown.classList.remove('show');
        });
    }

    if (ganttLink) {
        ganttLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('gantt');
            if (viewDropdown) viewDropdown.classList.remove('show');
        });
    }

    // Dropdown view selector logic
    if (currentViewButton && viewDropdown && viewSelector) {
        currentViewButton.addEventListener('click', (event) => {
            event.stopPropagation();
            viewDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (event) => {
            if (viewDropdown.classList.contains('show') && !viewSelector.contains(event.target)) {
                viewDropdown.classList.remove('show');
            }
        });
    }
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
    if (event.target === importantMemoModal) {
        closeImportantMemoModal();
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
window.openAllTasksModalWithStatus = openAllTasksModalWithStatus;
window.changeAllTasksSort = changeAllTasksSort; // Added to window scope
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
