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
    currentSearchType: 'text',
    sortField: 'endDate', // Default sort field
    sortDirection: 'asc', // Default sort direction
    holidays: {} // New property for holiday data
};

// 초기화
document.addEventListener('DOMContentLoaded', async () => { // Made async
    loadTheme();
    await loadCategories(); // Await categories for dropdowns
    await loadTasks(); // Await tasks for initial calendar render
    await loadHolidays(); // Await holidays before rendering calendar
    renderCalendar();
    updateSelectedDateTitle();
});

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

// 데이터 로드
async function loadTasks() {
    AppState.tasks = await API.tasks.getAll();
    UI.task.renderStatusSummary(AppState.tasks, 'statusSummary'); // Render status summary for all tasks
    renderCalendar();
    renderTasksForSelectedDate();
    // If the All Tasks modal is open, re-render its list
    if (document.getElementById('allTasksModal').style.display === 'block') {
        renderAllTasks();
    }
}

async function loadCategories() {
    AppState.categories = await API.categories.getAll();
    UI.category.renderTree(AppState.categories);
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

// 업무 CRUD
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

// 분류 CRUD
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

// 렌더링
function renderCalendar() {
    UI.calendar.render(AppState.tasks, AppState.currentDate, AppState.selectedDate, AppState.holidays);
}

function renderTasksForSelectedDate() {
    const tasksList = document.getElementById('tasksList');
    // const statusSummaryDiv = document.getElementById('statusSummary'); // No longer needed here
    const tasksForDate = UI.calendar.getTasksForDate(AppState.selectedDate, AppState.tasks);
    
    // Render status summary - now handled in loadTasks() for all tasks
    // statusSummaryDiv.innerHTML = UI.task.renderStatusSummary(tasksForDate);
    
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

// 날짜 선택
function selectDate(date) {
    AppState.selectedDate = new Date(date);
    renderCalendar();
    renderTasksForSelectedDate();
    updateSelectedDateTitle();
}

// 월 이동
function previousMonth() {
    AppState.currentDate.setMonth(AppState.currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    AppState.currentDate.setMonth(AppState.currentDate.getMonth() + 1);
    renderCalendar();
}

// 전체 업무 모달
function openAllTasksModal(statusToFilter = '전체') { // Accept optional statusToFilter
    const modal = document.getElementById('allTasksModal');
    
    // Set the filter in AppState
    AppState.currentStatusFilter = statusToFilter;
    AppState.currentPage = 1; // Reset to first page
    
    populateSearchCategories();
    renderAllTasks();

    // Update the UI of filter buttons based on the currentStatusFilter
    const filterBtns = document.querySelectorAll('#allTasksModal .filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === AppState.currentStatusFilter) {
            btn.classList.add('active');
        } else if (AppState.currentStatusFilter === '' && btn.getAttribute('data-status') === '전체') {
            // If filtering for '', '전체' button should be active
            btn.classList.add('active');
        }
    });

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
    
    // 상태 필터
    if (AppState.currentStatusFilter !== '전체') {
        filteredTasks = filteredTasks.filter(task => task.status === AppState.currentStatusFilter);
    }
    
    // 검색 필터
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
                valA = a.endDate ? new Date(a.endDate) : new Date(0); // Use epoch for empty dates
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
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === status) {
            btn.classList.add('active');
        }
    });
    
    renderAllTasks();
}

// 상태별 필터링된 전체 업무 모달 열기
function openAllTasksModalWithStatus(status) {
    openAllTasksModal(status);
}

// 전체 업무 목록 정렬 변경
function changeAllTasksSort() {
    AppState.sortField = document.getElementById('sortField').value;
    AppState.sortDirection = document.getElementById('sortDirection').value;
    AppState.currentPage = 1; // Reset to first page on sort change
    renderAllTasks();
}

// 카테고리 모달
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

// 업무 모달
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
        document.getElementById('description').value = task.description || '';
        // document.getElementById('importantMemo').value = task.importantMemo || ''; // Removed
    } else {
        modalTitle.textContent = '새 업무 추가';
        document.getElementById('taskId').value = '';
        document.getElementById('taskForm').reset();
        
        // Remove default date assignment to make them truly optional
        document.getElementById('startDate').value = ''; 
        document.getElementById('endDate').value = '';
    }
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content')); // Moved to the correct position
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
    
    // 분류 값 저장
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
        description: document.getElementById('description').value,
        // importantMemo: document.getElementById('importantMemo').value || '' // Removed
    };
    
    if (taskData.startDate && taskData.endDate) { // Only validate if both dates are provided
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
            closeTaskModal(); // Close modal after new task is created
        } catch (error) {
            console.error('Error creating task:', error);
            alert('업무 생성 중 오류가 발생했습니다.');
        }
        
        // 새 업무 등록 시 분류는 유지
        const today = KoreanTime.today();
        
        document.getElementById('taskName').value = '';
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        document.getElementById('status').value = '대기';
        document.getElementById('description').value = '';
        document.getElementById('importantMemo').value = '';
        
        // 분류 복원
        document.getElementById('category1').value = savedCategory1;
        updateSubCategories();
        document.getElementById('category2').value = savedCategory2;
        updateDetailCategories();
        document.getElementById('category3').value = savedCategory3;
        
        document.getElementById('taskName').focus();
    }
}

// 중요 메모 모달
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
        await updateTask(taskId, { importantMemo }); // Use existing updateTask, it calls loadTasks()
        closeImportantMemoModal();
    } catch (error) {
        console.error('Error saving important memo:', error);
        alert('중요 메모 저장 중 오류가 발생했습니다.');
    }
}

// 모달 외부 클릭
window.onclick = function(event) {
    const taskModal = document.getElementById('taskModal');
    const categoryModal = document.getElementById('categoryModal');
    const allTasksModal = document.getElementById('allTasksModal');
    const importantMemoModal = document.getElementById('importantMemoModal'); // New modal
    
    if (event.target === taskModal) {
        closeTaskModal();
    }
    if (event.target === categoryModal) {
        closeCategoryModal();
    }
    if (event.target === allTasksModal) {
        closeAllTasksModal();
    }
    if (event.target === importantMemoModal) { // Handle new modal
        closeImportantMemoModal();
    }
}

// 전역 함수 노출
window.selectDate = selectDate;
window.openTaskModal = openTaskModal;
window.copyTask = copyTask;
window.deleteTask = deleteTask;
window.editCategoryItem = editCategoryItem;
window.deleteCategory = deleteCategory;
window.openImportantMemoModal = openImportantMemoModal; // Expose new function
window.saveImportantMemo = saveImportantMemo; // Expose new function
window.closeImportantMemoModal = closeImportantMemoModal; // Expose new function
window.changeAllTasksSort = changeAllTasksSort; // Expose new function
window.openAllTasksModalWithStatus = openAllTasksModalWithStatus; // Expose new function



