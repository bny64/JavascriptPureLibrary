// modules/all-tasks-modal.js - 전체 업무 모달 및 필터/정렬/검색 기능

import { AppState } from '../state/app-state.js';
import { ArrayUtils, DomUtils } from '../utils/dom.js';
import { TaskUI } from '../ui/task-ui.js';

export function openAllTasksModal(statusToFilter = '전체', priorityToFilter = '전체', category1 = null, dateToFilter = null, category2 = null) {
    const modal = document.getElementById('allTasksModal');

    // 상태 초기화 (배열 타입 처리)
    AppState.currentStatusFilter = Array.isArray(statusToFilter) ? statusToFilter : [statusToFilter];
    AppState.currentPriorityFilter = Array.isArray(priorityToFilter) ? priorityToFilter : [priorityToFilter];
    AppState.currentDateFilter = dateToFilter;
    AppState.currentPage = 1;
    AppState.sortField = 'endDate';
    AppState.sortDirection = 'desc';
    AppState.currentSearchCategory1 = category1 || '';
    AppState.currentSearchCategory2 = category2 || '';
    AppState.currentSearchCategory3 = '';

    // 검색 필드 UI 초기화
    document.getElementById('textSearchInput').value = '';
    document.getElementById('searchStartDate').value = '';
    document.getElementById('searchEndDate').value = '';

    // 정렬 컨트롤 UI 초기화
    document.getElementById('sortField').value = 'endDate';
    document.getElementById('sortDirection').value = 'desc';

    populateSearchCategories();
    updateSearchCategory2();

    // 카테고리 필터가 있으면 '선택 검색' 활성화
    if (category1 || category2) {
        const catRadio = document.querySelector('input[name="searchType"][value="category"]');
        if (catRadio) catRadio.checked = true;
    } else {
        const textRadio = document.querySelector('input[name="searchType"][value="text"]');
        if (textRadio) textRadio.checked = true;
    }
    toggleSearchType(false);

    renderAllTasks();
    activateFilterButtons();

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.all-tasks-list-container'));
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
        const status = btn.getAttribute('data-status');
        btn.classList.toggle('active', AppState.currentStatusFilter.includes(status));
    });
    document.querySelectorAll('#allTasksModal .priority-filters .filter-btn').forEach(btn => {
        const priority = btn.getAttribute('data-priority');
        btn.classList.toggle('active', AppState.currentPriorityFilter.includes(priority));
    });
}

export function toggleSearchType(runSearch = true) {
    AppState.currentSearchType = document.querySelector('input[name="searchType"]:checked')?.value || 'text';
    const textSearchBox = document.getElementById('textSearchBox');
    const categorySearchBox = document.getElementById('categorySearchBox');
    if (textSearchBox) textSearchBox.style.display = AppState.currentSearchType === 'text' ? 'block' : 'none';
    if (categorySearchBox) categorySearchBox.style.display = AppState.currentSearchType !== 'text' ? 'block' : 'none';

    // 카테고리 필드 값 상태에 반영
    AppState.currentSearchCategory1 = document.getElementById('searchCategory1')?.value || '';
    AppState.currentSearchCategory2 = document.getElementById('searchCategory2')?.value || '';
    AppState.currentSearchCategory3 = document.getElementById('searchCategory3')?.value || '';

    if (runSearch) {
        searchAllTasks();
    }
}
export function populateSearchCategories() {
    const cat1 = document.getElementById('searchCategory1');
    if (!cat1) return;
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
    const cat1 = document.getElementById('searchCategory1')?.value;
    const cat2 = document.getElementById('searchCategory2');
    const cat3 = document.getElementById('searchCategory3');
    if (!cat2 || !cat3) return;
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
    const cat1 = document.getElementById('searchCategory1')?.value;
    const cat2 = document.getElementById('searchCategory2')?.value;
    const cat3 = document.getElementById('searchCategory3');
    if (!cat3) return;
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
    if (!allTasksList) return;

    let filtered = AppState.tasks;

    if (!AppState.currentStatusFilter.includes('전체')) {
        filtered = filtered.filter(t => AppState.currentStatusFilter.includes(t.status));
    }
    if (!AppState.currentPriorityFilter.includes('전체')) {
        filtered = filtered.filter(t => AppState.currentPriorityFilter.includes(t.priority));
    }
    if (AppState.currentDateFilter) {
        filtered = filtered.filter(t => t.endDate === AppState.currentDateFilter);
    }

    // 업무 기간(시작일/종료일) 필터링 추가
    const startDate = document.getElementById('searchStartDate')?.value;
    const endDate = document.getElementById('searchEndDate')?.value;

    if (startDate) {
        filtered = filtered.filter(t => t.startDate && t.startDate >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(t => t.endDate && t.endDate <= endDate);
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
        const cat1 = document.getElementById('searchCategory1')?.value;
        const cat2 = document.getElementById('searchCategory2')?.value;
        const cat3 = document.getElementById('searchCategory3')?.value;
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

    // 검색/필터/페이징 결과 렌더링 후 모달 스크롤 상단 이동
    const modal = document.getElementById('allTasksModal');
    if (modal) {
        DomUtils.scrollToTop(modal.querySelector('.all-tasks-list-container'));
    }
}

export function updatePaginationControls(totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (!pageInfo || !prevBtn || !nextBtn) return;

    pageInfo.textContent = `${AppState.currentPage} / ${totalPages}`;
    prevBtn.disabled = AppState.currentPage === 1;
    nextBtn.disabled = AppState.currentPage === totalPages || totalPages === 0;
}

export function previousPage() {
    if (AppState.currentPage > 1) { AppState.currentPage--; renderAllTasks(); }
}

export function nextPage() {
    AppState.currentPage++; renderAllTasks();
}

export function filterByStatus(status) {
    if (status === '전체') {
        AppState.currentStatusFilter = ['전체'];
    } else {
        AppState.currentStatusFilter = AppState.currentStatusFilter.filter(s => s !== '전체');
        if (AppState.currentStatusFilter.includes(status)) {
            AppState.currentStatusFilter = AppState.currentStatusFilter.filter(s => s !== status);
            if (AppState.currentStatusFilter.length === 0) AppState.currentStatusFilter = ['전체'];
        } else {
            AppState.currentStatusFilter.push(status);
        }
    }
    AppState.currentPage = 1;
    activateFilterButtons();
    renderAllTasks();
}

export function filterByPriority(priority) {
    if (priority === '전체') {
        AppState.currentPriorityFilter = ['전체'];
    } else {
        AppState.currentPriorityFilter = AppState.currentPriorityFilter.filter(p => p !== '전체');
        if (AppState.currentPriorityFilter.includes(priority)) {
            AppState.currentPriorityFilter = AppState.currentPriorityFilter.filter(p => p !== priority);
            if (AppState.currentPriorityFilter.length === 0) AppState.currentPriorityFilter = ['전체'];
        } else {
            AppState.currentPriorityFilter.push(priority);
        }
    }
    AppState.currentPage = 1;
    activateFilterButtons();
    renderAllTasks();
}

export function changeAllTasksSort() {
    AppState.sortField = document.getElementById('sortField')?.value || 'endDate';
    AppState.sortDirection = document.getElementById('sortDirection')?.value || 'desc';
    AppState.currentPage = 1;
    renderAllTasks();
}

export function resetAllFilters() {
    // 상태 초기화
    AppState.currentStatusFilter = ['전체'];
    AppState.currentPriorityFilter = ['전체'];
    AppState.currentDateFilter = null;
    AppState.currentPage = 1;
    AppState.sortField = 'endDate';
    AppState.sortDirection = 'desc';
    AppState.currentSearchCategory1 = '';
    AppState.currentSearchCategory2 = '';
    AppState.currentSearchCategory3 = '';

    // UI 초기화
    const textInput = document.getElementById('textSearchInput');
    const startDate = document.getElementById('searchStartDate');
    const endDate = document.getElementById('searchEndDate');
    const sortF = document.getElementById('sortField');
    const sortD = document.getElementById('sortDirection');

    if (textInput) textInput.value = '';
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (sortF) sortF.value = 'endDate';
    if (sortD) sortD.value = 'desc';

    // 라디오 버튼 초기화 (단어 검색으로)
    const textRadio = document.querySelector('input[name="searchType"][value="text"]');
    if (textRadio) textRadio.checked = true;
    toggleSearchType(false);

    // 필터 버튼 활성화 상태 업데이트
    activateFilterButtons();

    // 카테고리 드롭다운 초기화
    populateSearchCategories();
    updateSearchCategory2();

    // 결과 렌더링
    renderAllTasks();
}
