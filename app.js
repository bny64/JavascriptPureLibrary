// 전역 변수
let tasks = [];
let categories = [];
let currentDate = new Date();
let selectedDate = new Date();
let currentPage = 1;
let tasksPerPage = 5;
let currentStatusFilter = '전체';
let currentSearchType = 'text';

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadCategories();
    loadTasks();
    renderCalendar();
    updateSelectedDateTitle();
});

// 테마 관리
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'green';
    document.getElementById('themeSelect').value = savedTheme;
    changeTheme(savedTheme);
}

function changeTheme(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
}

// API 호출 함수들
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json();
        renderCalendar();
        renderTasksForSelectedDate();
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
    }
}

async function createTask(task) {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        const newTask = await response.json();
        tasks.push(newTask);
        renderCalendar();
        renderTasksForSelectedDate();
    } catch (error) {
        console.error('Error creating task:', error);
    }
}

async function updateTask(id, updates) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const updatedTask = await response.json();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = updatedTask;
        }
        renderCalendar();
        renderTasksForSelectedDate();
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(id) {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        tasks = tasks.filter(t => t.id !== id);
        renderCalendar();
        renderTasksForSelectedDate();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// 카테고리 API
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        renderCategoryTree();
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = [];
    }
}

async function createCategory(category) {
    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        });
        const newCategory = await response.json();
        categories.push(newCategory);
        renderCategoryTree();
    } catch (error) {
        console.error('Error creating category:', error);
    }
}

async function updateCategory(id, updates) {
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const updatedCategory = await response.json();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = updatedCategory;
        }
        renderCategoryTree();
    } catch (error) {
        console.error('Error updating category:', error);
    }
}

async function deleteCategory(id) {
    if (!confirm('정말로 이 분류를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
        });
        categories = categories.filter(c => c.id !== id);
        renderCategoryTree();
    } catch (error) {
        console.error('Error deleting category:', error);
    }
}

// 캘린더 렌더링
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = `${year}년 ${month + 1}월`;
    
    calendar.innerHTML = '';
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevLastDay.getDate() - i;
        const dayDiv = createDayElement(new Date(year, month - 1, day), true);
        calendar.appendChild(dayDiv);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dayDiv = createDayElement(date, false);
        calendar.appendChild(dayDiv);
    }
    
    const remainingDays = 42 - calendar.children.length + 7;
    for (let day = 1; day <= remainingDays; day++) {
        const dayDiv = createDayElement(new Date(year, month + 1, day), true);
        calendar.appendChild(dayDiv);
    }
}

function createDayElement(date, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayDiv.classList.add('today');
    }
    
    if (date.toDateString() === selectedDate.toDateString()) {
        dayDiv.classList.add('selected');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayDiv.appendChild(dayNumber);
    
    const dayTasks = getTasksForDate(date);
    if (dayTasks.length > 0) {
        const tasksDiv = document.createElement('div');
        tasksDiv.className = 'day-tasks';
        
        const displayTasks = dayTasks.slice(0, 3);
        displayTasks.forEach(task => {
            const taskDot = document.createElement('span');
            taskDot.className = `task-dot status-${task.status}`;
            taskDot.title = task.taskName;
            tasksDiv.appendChild(taskDot);
        });
        
        if (dayTasks.length > 3) {
            const moreText = document.createTextNode(` +${dayTasks.length - 3}`);
            tasksDiv.appendChild(moreText);
        }
        
        dayDiv.appendChild(tasksDiv);
    }
    
    dayDiv.addEventListener('click', () => {
        selectedDate = new Date(date);
        renderCalendar();
        renderTasksForSelectedDate();
        updateSelectedDateTitle();
    });
    
    return dayDiv;
}

function getTasksForDate(date) {
    return tasks.filter(task => {
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const checkDate = new Date(date);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);
        
        return checkDate >= start && checkDate <= end;
    });
}

function renderTasksForSelectedDate() {
    const tasksList = document.getElementById('tasksList');
    const tasksForDate = getTasksForDate(selectedDate);
    
    if (tasksForDate.length === 0) {
        tasksList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">선택한 날짜에 업무가 없습니다.</p>';
        return;
    }
    
    tasksList.innerHTML = '';
    tasksForDate.forEach(task => {
        tasksList.appendChild(createTaskElement(task));
    });
}

function createTaskElement(task) {
    const taskDiv = DomUtils.createElement('div', `task-item status-${task.status}`);
    
    // 헤더
    const header = DomUtils.createElement('div', 'task-header');
    const title = DomUtils.createElement('div', 'task-title', task.taskName);
    const status = DomUtils.createElement('span', `task-status status-${task.status}`, task.status);
    header.appendChild(title);
    header.appendChild(status);
    
    // 카테고리
    const category = DomUtils.createElement('div', 'task-category');
    let categoryText = task.category1;
    if (task.category2) categoryText += ` > ${task.category2}`;
    if (task.category3) categoryText += ` > ${task.category3}`;
    category.textContent = categoryText;
    
    // 설명
    const description = DomUtils.createElement('div', 'task-description', task.description || '설명 없음');
    
    // 중요 메모 표시 (있을 경우)
    if (task.importantMemo && task.importantMemo.trim()) {
        const memoDiv = DomUtils.createElement('div', 'task-memo');
        memoDiv.innerHTML = `<strong>📌 중요:</strong> ${task.importantMemo}`;
        taskDiv.appendChild(header);
        taskDiv.appendChild(category);
        taskDiv.appendChild(description);
        taskDiv.appendChild(memoDiv);
    } else {
        taskDiv.appendChild(header);
        taskDiv.appendChild(category);
        taskDiv.appendChild(description);
    }
    
    // 액션 버튼
    const actions = DomUtils.createElement('div', 'task-actions');
    
    const editBtn = DomUtils.createElement('button', 'btn-edit', '수정');
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openTaskModal(task);
    };
    
    const copyBtn = DomUtils.createElement('button', 'btn-copy', '복사');
    copyBtn.onclick = (e) => {
        e.stopPropagation();
        copyTask(task);
    };
    
    const deleteBtn = DomUtils.createElement('button', 'btn-delete', '삭제');
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    };
    
    actions.appendChild(editBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);
    
    taskDiv.appendChild(actions);
    
    return taskDiv;
}

function updateSelectedDateTitle() {
    const title = document.getElementById('selectedDateTitle');
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    title.textContent = `${year}년 ${month}월 ${day}일의 업무`;
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// 전체 업무 모달
function openAllTasksModal() {
    const modal = document.getElementById('allTasksModal');
    const modalContent = modal.querySelector('.modal-content');
    modalContent.scrollTop = 0; // 스크롤 최상단으로
    
    populateSearchCategories();
    currentPage = 1;
    renderAllTasks();
    modal.style.display = 'block';
}

function closeAllTasksModal() {
    const modal = document.getElementById('allTasksModal');
    modal.style.display = 'none';
}

function toggleSearchType() {
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    currentSearchType = searchType;
    
    if (searchType === 'text') {
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
    const mainCategories = [...new Set(categories.map(c => c.mainCategory))];
    
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
    
    const subCategories = [...new Set(
        categories
            .filter(c => c.mainCategory === cat1 && c.subCategory)
            .map(c => c.subCategory)
    )];
    
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
    
    const detailCategories = categories
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
    currentPage = 1;
    renderAllTasks();
}

function renderAllTasks() {
    const allTasksList = document.getElementById('allTasksList');
    
    let filteredTasks = tasks;
    
    // 상태 필터
    if (currentStatusFilter !== '전체') {
        filteredTasks = filteredTasks.filter(task => task.status === currentStatusFilter);
    }
    
    // 검색 필터
    if (currentSearchType === 'text') {
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
        
        if (cat1) {
            filteredTasks = filteredTasks.filter(task => task.category1 === cat1);
        }
        if (cat2) {
            filteredTasks = filteredTasks.filter(task => task.category2 === cat2);
        }
        if (cat3) {
            filteredTasks = filteredTasks.filter(task => task.category3 === cat3);
        }
    }
    
    if (filteredTasks.length === 0) {
        allTasksList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">검색 결과가 없습니다.</p>';
        updatePaginationControls(1);
        return;
    }
    
    const sortedTasks = [...filteredTasks].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const pageTasks = sortedTasks.slice(startIndex, endIndex);
    
    allTasksList.innerHTML = '';
    pageTasks.forEach(task => {
        allTasksList.appendChild(createTaskElement(task));
    });
    
    updatePaginationControls(totalPages);
}

function updatePaginationControls(totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderAllTasks();
    }
}

function nextPage() {
    currentPage++;
    renderAllTasks();
}

function filterByStatus(status) {
    currentStatusFilter = status;
    currentPage = 1;
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === status) {
            btn.classList.add('active');
        }
    });
    
    renderAllTasks();
}

// 카테고리 관리
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const modalContent = modal.querySelector('.modal-content');
    modalContent.scrollTop = 0;
    resetCategoryForm();
    loadCategories();
    modal.style.display = 'block';
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'none';
}

function resetCategoryForm() {
    const form = document.getElementById('categoryForm');
    form.reset();
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
    setTimeout(() => {
        renderCategoryTree();
    }, 100);
}

function renderCategoryTree() {
    const treeView = document.getElementById('categoryTreeView');
    
    if (categories.length === 0) {
        treeView.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">등록된 분류가 없습니다.</p>';
        return;
    }
    
    const grouped = {};
    const mainCategories = new Set();
    
    categories.forEach(cat => {
        mainCategories.add(cat.mainCategory);
        
        if (!grouped[cat.mainCategory]) {
            grouped[cat.mainCategory] = {
                main: null,
                subs: {}
            };
        }
        
        if (cat.subCategory) {
            if (!grouped[cat.mainCategory].subs[cat.subCategory]) {
                grouped[cat.mainCategory].subs[cat.subCategory] = {
                    sub: null,
                    details: []
                };
            }
            
            if (cat.detailCategory) {
                grouped[cat.mainCategory].subs[cat.subCategory].details.push(cat);
            } else {
                grouped[cat.mainCategory].subs[cat.subCategory].sub = cat;
            }
        } else if (!cat.detailCategory) {
            grouped[cat.mainCategory].main = cat;
        }
    });
    
    treeView.innerHTML = '';
    
    Array.from(mainCategories).sort().forEach(mainCat => {
        const group = grouped[mainCat];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'category-tree-item';
        
        const mainDiv = document.createElement('div');
        mainDiv.className = 'category-main';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = mainCat;
        
        const actions = document.createElement('div');
        actions.className = 'category-actions';
        
        if (group.main) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-cat-edit';
            editBtn.textContent = '수정';
            editBtn.onclick = () => editCategoryItem(group.main);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-cat-delete';
            deleteBtn.textContent = '삭제';
            deleteBtn.onclick = () => deleteCategory(group.main.id);
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
        }
        
        mainDiv.appendChild(nameSpan);
        mainDiv.appendChild(actions);
        itemDiv.appendChild(mainDiv);
        
        const subKeys = Object.keys(group.subs).sort();
        subKeys.forEach(subKey => {
            const subGroup = group.subs[subKey];
            
            const subDiv = document.createElement('div');
            subDiv.className = 'category-sub';
            
            const subNameSpan = document.createElement('span');
            subNameSpan.textContent = `└ ${subKey}`;
            
            const subActions = document.createElement('div');
            subActions.className = 'category-actions';
            
            if (subGroup.sub) {
                const subEditBtn = document.createElement('button');
                subEditBtn.className = 'btn-cat-edit';
                subEditBtn.textContent = '수정';
                subEditBtn.onclick = () => editCategoryItem(subGroup.sub);
                
                const subDeleteBtn = document.createElement('button');
                subDeleteBtn.className = 'btn-cat-delete';
                subDeleteBtn.textContent = '삭제';
                subDeleteBtn.onclick = () => deleteCategory(subGroup.sub.id);
                
                subActions.appendChild(subEditBtn);
                subActions.appendChild(subDeleteBtn);
            }
            
            subDiv.appendChild(subNameSpan);
            subDiv.appendChild(subActions);
            itemDiv.appendChild(subDiv);
            
            if (subGroup.details.length > 0) {
                subGroup.details.sort((a, b) => a.detailCategory.localeCompare(b.detailCategory)).forEach(detailCat => {
                    const detailDiv = document.createElement('div');
                    detailDiv.className = 'category-detail';
                    
                    const detailNameSpan = document.createElement('span');
                    detailNameSpan.textContent = `    └ ${detailCat.detailCategory}`;
                    
                    const detailActions = document.createElement('div');
                    detailActions.className = 'category-actions';
                    
                    const detailEditBtn = document.createElement('button');
                    detailEditBtn.className = 'btn-cat-edit';
                    detailEditBtn.textContent = '수정';
                    detailEditBtn.onclick = () => editCategoryItem(detailCat);
                    
                    const detailDeleteBtn = document.createElement('button');
                    detailDeleteBtn.className = 'btn-cat-delete';
                    detailDeleteBtn.textContent = '삭제';
                    detailDeleteBtn.onclick = () => deleteCategory(detailCat.id);
                    
                    detailActions.appendChild(detailEditBtn);
                    detailActions.appendChild(detailDeleteBtn);
                    
                    detailDiv.appendChild(detailNameSpan);
                    detailDiv.appendChild(detailActions);
                    
                    itemDiv.appendChild(detailDiv);
                });
            }
        });
        
        treeView.appendChild(itemDiv);
    });
}

// 업무 모달
function openTaskModal(task = null) {
    const modal = document.getElementById('taskModal');
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('taskForm');
    
    modalContent.scrollTop = 0;
    
    populateCategoryDropdowns();
    
    if (task) {
        modalTitle.textContent = '업무 수정';
        document.getElementById('taskId').value = task.id;
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
        document.getElementById('importantMemo').value = task.importantMemo || '';
    } else {
        modalTitle.textContent = '새 업무 추가';
        document.getElementById('taskId').value = '';
        form.reset();
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
    }
    
    modal.style.display = 'block';
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.style.display = 'none';
}

function populateCategoryDropdowns() {
    const category1Select = document.getElementById('category1');
    const mainCategories = [...new Set(categories.map(c => c.mainCategory))];
    
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
    
    const subCategories = [...new Set(
        categories
            .filter(c => c.mainCategory === category1 && c.subCategory)
            .map(c => c.subCategory)
    )];
    
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
    
    const detailCategories = categories
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
    
    // 분류 값 저장 (업무 등록 후에도 유지하기 위해)
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
        importantMemo: document.getElementById('importantMemo').value || ''
    };
    
    if (new Date(taskData.startDate) > new Date(taskData.endDate)) {
        alert('종료 날짜는 시작 날짜보다 이후여야 합니다.');
        return;
    }
    
    if (taskId) {
        await updateTask(taskId, taskData);
        closeTaskModal();
    } else {
        await createTask(taskData);
        
        // 새 업무 등록 시 분류는 유지하고 나머지만 초기화
        const form = document.getElementById('taskForm');
        const today = new Date().toISOString().split('T')[0];
        
        document.getElementById('taskName').value = '';
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        document.getElementById('status').value = '대기';
        document.getElementById('description').value = '';
        document.getElementById('importantMemo').value = '';
        
        // 분류 값 복원
        document.getElementById('category1').value = savedCategory1;
        updateSubCategories();
        document.getElementById('category2').value = savedCategory2;
        updateDetailCategories();
        document.getElementById('category3').value = savedCategory3;
        
        // 포커스를 업무명 필드로
        document.getElementById('taskName').focus();
    }
}

// 업무 복사 기능
function copyTask(task) {
    openTaskModal({
        ...task,
        id: '',
        taskName: task.taskName + ' (복사본)',
        createdAt: undefined
    });
}

window.onclick = function(event) {
    const taskModal = document.getElementById('taskModal');
    const categoryModal = document.getElementById('categoryModal');
    const allTasksModal = document.getElementById('allTasksModal');
    
    if (event.target === taskModal) {
        closeTaskModal();
    }
    if (event.target === categoryModal) {
        closeCategoryModal();
    }
    if (event.target === allTasksModal) {
        closeAllTasksModal();
    }
}
