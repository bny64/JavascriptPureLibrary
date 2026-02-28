// modules/all-tasks-modal.js - 전체 업무 모달 및 필터/정렬/검색 기능

import { AppState } from '../state/app-state.js';
import { ArrayUtils, DomUtils } from '../utils/dom.js';
import { TaskUI } from '../ui/task-ui.js';

export function openAllTasksModal(statusToFilter = '전체', priorityToFilter = '전체', category1 = null, dateToFilter = null, category2 = null) {
    const modal = document.getElementById('allTasksModal');

    // 상태 초기화
    AppState.currentStatusFilter = statusToFilter;
    AppState.currentPriorityFilter = priorityToFilter;
    AppState.currentDateFilter = dateToFilter;
    AppState.currentPage = 1;
    AppState.sortField = 'endDate';
    AppState.sortDirection = 'desc';
    AppState.currentSearchCategory1 = category1 || '';
    AppState.currentSearchCategory2 = category2 || '';
    AppState.currentSearchCategory3 = '';

    // 검색 필드 UI 초기화
    document.getElementById('textSearchInput').value = '';

    // 정렬 컨트롤 UI 초기화
    document.getElementById('sortField').value = 'endDate';
    document.getElementById('sortDirection').value = 'desc';

    populateSearchCategories();
    updateSearchCategory2();

    // 카테고리 필터가 있으면 '선택 검색' 활성화
    if (category1 || category2) {
        document.querySelector('input[name="searchType"][value="category"]').checked = true;
    } else {
        document.querySelector('input[name="searchType"][value="text"]').checked = true;
    }
    toggleSearchType(false);

    renderAllTasks();
    activateFilterButtons();

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

export function openAllTasksModalWithCategory(category1) {
    openAllTasksModal('전체', '전체', category1);
}
export function closeAllTasksModal() {
    document.getElementById('allTasksModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

export function openAllTasksModalWithStatus(status) {
    openAllTasksModal(status, '전체');
}

export function openAllTasksModalWithPriority(priority) {
    openAllTasksModal('전체', priority);
}

export function openAllTasksModalWithCategory2(cat2) {
    const foundCat = AppState.categories.find(c => c.subCategory === cat2);
    const cat1 = foundCat ? foundCat.mainCategory : '';
    openAllTasksModal('전체', '전체', cat1, null, cat2);
}

export function openAllTasksModalWithDate(date) {
    openAllTasksModal('전체', '전체', null, date);
}

export function activateFilterButtons() {
    document.querySelectorAll('#allTasksModal .status-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-status') === AppState.currentStatusFilter);
    });
    document.querySelectorAll('#allTasksModal .priority-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-priority') === AppState.currentPriorityFilter);
    });
}

export function toggleSearchType(runSearch = true) {
    AppState.currentSearchType = document.querySelector('input[name="searchType"]:checked')?.value || 'text';
    document.getElementById('textSearchBox').style.display = AppState.currentSearchType === 'text' ? 'block' : 'none';
    document.getElementById('categorySearchBox').style.display = AppState.currentSearchType !== 'text' ? 'block' : 'none';

    // 카테고리 필드 값 상태에 반영
    AppState.currentSearchCategory1 = document.getElementById('searchCategory1').value;
    AppState.currentSearchCategory2 = document.getElementById('searchCategory2').value;
    AppState.currentSearchCategory3 = document.getElementById('searchCategory3').value;

    if (runSearch) {
        searchAllTasks();
    }
}
export function populateSearchCategories() {
    const cat1 = document.getElementById('searchCategory1');
    const mains = ArrayUtils.unique(AppState.categories.map(c => c.mainCategory));
    cat1.innerHTML = '<option value="">전체 대분류</option>';
    mains.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        cat1.appendChild(opt);
    });
    cat1.value = AppState.currentSearchCategory1;
}

export function updateSearchCategory2() {
    const cat1 = document.getElementById('searchCategory1').value;
    const cat2 = document.getElementById('searchCategory2');
    const cat3 = document.getElementById('searchCategory3');
    cat2.innerHTML = '<option value="">전체 중분류</option>';
    cat3.innerHTML = '<option value="">전체 소분류</option>';
    if (!cat1) return;

    ArrayUtils.unique(AppState.categories.filter(c => c.mainCategory === cat1 && c.subCategory).map(c => c.subCategory))
        .forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            cat2.appendChild(opt);
        });
    cat2.value = AppState.currentSearchCategory2;
    updateSearchCategory3();
}

export function updateSearchCategory3() {
    const cat1 = document.getElementById('searchCategory1').value;
    const cat2 = document.getElementById('searchCategory2').value;
    const cat3 = document.getElementById('searchCategory3');
    cat3.innerHTML = '<option value="">전체 소분류</option>';
    if (!cat1 || !cat2) return;

    ArrayUtils.unique(AppState.categories.filter(c => c.mainCategory === cat1 && c.subCategory === cat2 && c.detailCategory).map(c => c.detailCategory))
        .forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            cat3.appendChild(opt);
        });
    cat3.value = AppState.currentSearchCategory3;
}

export function searchAllTasks() {
    AppState.currentPage = 1;
    renderAllTasks();
}

export function renderAllTasks() {
    const allTasksList = document.getElementById('allTasksList');
    let filtered = AppState.tasks;

    if (AppState.currentStatusFilter !== '전체') {
        filtered = filtered.filter(t => t.status === AppState.currentStatusFilter);
    }
    if (AppState.currentPriorityFilter !== '전체') {
        filtered = filtered.filter(t => t.priority === AppState.currentPriorityFilter);
    }
    if (AppState.currentDateFilter) {
        filtered = filtered.filter(t => t.endDate === AppState.currentDateFilter);
    }

    if (AppState.currentSearchType === 'text') {
        const searchText = (document.getElementById('textSearchInput')?.value || '').toLowerCase();
        if (searchText) {
            filtered = filtered.filter(t =>
                t.taskName.toLowerCase().includes(searchText) ||
                (t.description && t.description.toLowerCase().includes(searchText))
            );
        }
    } else {
        const cat1 = document.getElementById('searchCategory1').value;
        const cat2 = document.getElementById('searchCategory2').value;
        const cat3 = document.getElementById('searchCategory3').value;
        if (cat1) filtered = filtered.filter(t => t.category1 === cat1);
        if (cat2) filtered = filtered.filter(t => t.category2 === cat2);
        if (cat3) filtered = filtered.filter(t => t.category3 === cat3);
    }

    if (filtered.length === 0) {
        allTasksList.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">검색 결과가 없습니다.</p>';
        updatePaginationControls(1);
        return;
    }

    const sorted = [...filtered].sort((a, b) => {
        let valA, valB;
        switch (AppState.sortField) {
            case 'endDate': valA = a.endDate ? new Date(a.endDate) : new Date(0); valB = b.endDate ? new Date(b.endDate) : new Date(0); break;
            case 'startDate': valA = a.startDate ? new Date(a.startDate) : new Date(0); valB = b.startDate ? new Date(b.startDate) : new Date(0); break;
            case 'taskName': valA = a.taskName.toLowerCase(); valB = b.taskName.toLowerCase(); break;
            case 'status': valA = a.status; valB = b.status; break;
            default: valA = new Date(a.startDate); valB = new Date(b.startDate);
        }
        if (typeof valA === 'string') return AppState.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return AppState.sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    const totalPages = Math.ceil(sorted.length / AppState.tasksPerPage);
    const start = (AppState.currentPage - 1) * AppState.tasksPerPage;
    const pageTasks = sorted.slice(start, start + AppState.tasksPerPage);

    allTasksList.innerHTML = '';
    pageTasks.forEach(task => allTasksList.appendChild(TaskUI.createCard(task)));
    updatePaginationControls(totalPages);
}

export function updatePaginationControls(totalPages) {
    document.getElementById('pageInfo').textContent = `${AppState.currentPage} / ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = AppState.currentPage === 1;
    document.getElementById('nextPageBtn').disabled = AppState.currentPage === totalPages;
}

export function previousPage() {
    if (AppState.currentPage > 1) { AppState.currentPage--; renderAllTasks(); }
}

export function nextPage() {
    AppState.currentPage++; renderAllTasks();
}

export function filterByStatus(status) {
    AppState.currentStatusFilter = status;
    AppState.currentPage = 1;
    document.querySelectorAll('.status-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-status') === status);
    });
    renderAllTasks();
}

export function filterByPriority(priority) {
    AppState.currentPriorityFilter = priority;
    AppState.currentPage = 1;
    document.querySelectorAll('.priority-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-priority') === priority);
    });
    renderAllTasks();
}

export function changeAllTasksSort() {
    AppState.sortField = document.getElementById('sortField').value;
    AppState.sortDirection = document.getElementById('sortDirection').value;
    AppState.currentPage = 1;
    renderAllTasks();
}
