import { AppState } from '../state/app-state.js';
import { TextUtils } from '../utils/dom.js';

export const SearchUI = {
  currentPage: 1,
  pageSize: 5,
  filteredTasks: [],

  async render() {
    await this.populateCategories();
    this.bindEvents();
    // 초기화 상태 세팅
    this.resetFilters();
    // 최초 진입 시 자동 검색 실행
    this.performSearch();
  },

  async populateCategories() {
    const catSelect = document.getElementById('advSearchCategory');
    if (!catSelect) return;

    // 기존 옵션 지우고 기본값 유지
    catSelect.innerHTML = '<option value="">전체 카테고리</option>';

    try {
      // AppState가 비어있을 수 있으므로 API에서 직접 로드 시도
      const { API } = await import('../api/api.js');
      const categories = await API.categories.getAll();

      // 대분류만 추출하여 중복 제거
      const mainCats = [...new Set(categories.map(c => c.mainCategory))].filter(Boolean);
      mainCats.sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        catSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error populating categories in search:', error);
    }
  },

  bindEvents() {
    const searchBtn = document.getElementById('advSearchBtn');
    const resetBtn = document.getElementById('advSearchResetBtn');

    if (searchBtn) {
      searchBtn.onclick = () => this.performSearch();
    }

    if (resetBtn) {
      resetBtn.onclick = () => this.resetFilters();
    }

    // 엔터키 검색
    const searchInput = document.getElementById('advSearchInput');
    if (searchInput) {
      searchInput.onkeyup = (e) => {
        if (e.key === 'Enter') this.performSearch();
      };
    }

    // 변경 즉시 검색 (Select & Date fields)
    const autoFields = ['advSearchStatus', 'advSearchPriority', 'advSearchCategory', 'advSearchSort', 'advSearchStartDate', 'advSearchEndDate'];
    autoFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.onchange = () => this.performSearch();
      }
    });
  },

  resetFilters() {
    const fields = ['advSearchInput', 'advSearchStatus', 'advSearchPriority', 'advSearchCategory', 'advSearchSort', 'advSearchStartDate', 'advSearchEndDate'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === 'advSearchSort') el.value = 'latest';
        else el.value = '';
      }
    });

    this.performSearch();
  },

  performSearch() {
    const term = (document.getElementById('advSearchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('advSearchStatus')?.value || '';
    const priority = document.getElementById('advSearchPriority')?.value || '';
    const category = document.getElementById('advSearchCategory')?.value || '';
    const sort = document.getElementById('advSearchSort')?.value || 'latest';
    const startDate = document.getElementById('advSearchStartDate')?.value || '';
    const endDate = document.getElementById('advSearchEndDate')?.value || '';

    // 기본 전체 데이타 가져오기
    let results = [...AppState.tasks];

    // 1. 검색어 필터 (제목 또는 내용)
    if (term) {
      results = results.filter(t =>
        (t.taskName && t.taskName.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    }

    // 2. 상태 필터
    if (status) {
      results = results.filter(t => t.status === status);
    }

    // 3. 우선순위 필터
    if (priority) {
      results = results.filter(t => t.priority === priority);
    }

    // 4. 카테고리 필터 (대분류)
    if (category) {
      results = results.filter(t => t.category1 === category);
    }

    // 5. 날짜 구간 필터
    if (startDate || endDate) {
      results = results.filter(t => {
        const s = t.startDate;
        const e = t.endDate;
        if (!s && !e) return false;
        if (startDate && e && e < startDate) return false;
        if (endDate && s && s > endDate) return false;
        return true;
      });
    }

    // 6. 정렬 로직 적용
    results.sort((a, b) => {
      switch (sort) {
        case 'latest': // 최근 시작일순 (내림차순)
          return (b.startDate || '').localeCompare(a.startDate || '');
        case 'oldest': // 오래된 시작일순 (오름차순)
          return (a.startDate || '').localeCompare(b.startDate || '');
        case 'endDate': // 마감임박순 (종료일 오름차순)
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return a.endDate.localeCompare(b.endDate);
        case 'priority': // 우선순위순
          const pMap = { 'very-high': 0, 'high': 1, 'middle': 2, 'low': 3, 'very-low': 4 };
          return (pMap[a.priority] ?? 5) - (pMap[b.priority] ?? 5);
        case 'name': // 이름순
          return (a.taskName || '').localeCompare(b.taskName || '');
        default:
          return 0;
      }
    });

    // 필터링 및 정렬 결과 저장 및 1페이지로 리셋
    this.filteredTasks = results;
    this.currentPage = 1;
    this.renderResults();
  },

  renderResults() {
    const container = document.getElementById('advSearchResultsContainer');
    const countLabel = document.getElementById('advSearchResultCount');
    if (!container || !countLabel) return;

    const totalCount = this.filteredTasks.length;
    countLabel.textContent = `(${totalCount}건)`;

    if (totalCount === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 30px; color: #888; background: #fafafa; border-radius: 8px;">
                검색 조건에 일치하는 업무가 없습니다. <br><span style="font-size: 13px;">필터 조건을 완화해 보세요.</span>
            </div>`;
      document.getElementById('advSearchPagination').innerHTML = '';
      return;
    }

    // 현재 페이지 데이터만 추출
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedTasks = this.filteredTasks.slice(startIndex, startIndex + this.pageSize);

    const priorityLabels = { 'very-high': '🔺매우 높음', 'high': '🔼높음', 'middle': '➖보통', 'low': '🔽낮음', 'very-low': '🔻매우 낮음' };

    container.innerHTML = pagedTasks.map(t => {
      const catStr = `📁 ${t.category1 || '미분류'}${t.category2 ? ' > ' + t.category2 : ''}${t.category3 ? ' > ' + t.category3 : ''}`;
      const prioStr = priorityLabels[t.priority] || '➖보통';
      const statusMap = { 'pending': '대기', 'in-progress': '진행중', 'completed': '완료', 'on-hold': '보류' };
      const statStr = statusMap[t.status] || '알 수 없음';
      const progress = t.progress || 0;

      return `
                <div class="search-result-item" data-task-id="${t.id}" style="cursor: pointer; padding: 15px; border: 1px solid #ddd; border-left: 4px solid var(--status-${t.status}, #ccc); border-radius: 8px; background: white; transition: background 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-size: 12px; color: #666; font-weight: 600;">${TextUtils.escapeHtml(catStr)}</span>
                        <div style="display: flex; gap: 8px; font-size: 11px;">
                            <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-weight: bold;">${prioStr}</span>
                            <span class="status-badge status-${t.status}" style="padding: 2px 8px; border-radius: 12px; font-weight: bold;">${statStr}</span>
                        </div>
                    </div>
                    <div style="font-size: 16px; font-weight: bold; color: #333;">${TextUtils.escapeHtml(t.taskName)}</div>
                    <div class="search-result-desc" style="color: #666; font-size: 13px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; max-height: 4.5em; text-overflow: ellipsis;">
                        ${t.description ? t.description : '<span style="color:#aaa;">(상세 내용 없음)</span>'}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px dashed #eee; padding-top: 8px; margin-top: 5px;">
                        <span style="font-size: 11px; color: #888; white-space: nowrap;">📅 기간: <b style="color: #555;">${t.startDate || '-'} ~ ${t.endDate || '-'}</b></span>
                    </div>
                </div>
            `;
    }).join('');

    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', async () => {
        const taskId = item.getAttribute('data-task-id');
        const { openTaskModalById } = await import('../main.js');
        openTaskModalById(taskId);
      });
    });

    this.renderPagination(totalCount);
  },

  renderPagination(totalCount) {
    const pagination = document.getElementById('advSearchPagination');
    if (!pagination) return;

    const totalPages = Math.ceil(totalCount / this.pageSize);
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = `
      <button id="advSearchPrevBtn" ${this.currentPage === 1 ? 'disabled' : ''} style="padding: 5px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">이전</button>
      <span style="font-size: 14px; font-weight: 600; color: #333;">${this.currentPage} / ${totalPages}</span>
      <button id="advSearchNextBtn" ${this.currentPage === totalPages ? 'disabled' : ''} style="padding: 5px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">다음</button>
    `;

    pagination.innerHTML = html;

    pagination.querySelector('#advSearchPrevBtn')?.addEventListener('click', () => this.changePage(this.currentPage - 1));
    pagination.querySelector('#advSearchNextBtn')?.addEventListener('click', () => this.changePage(this.currentPage + 1));
  },

  changePage(page) {
    const totalPages = Math.ceil(this.filteredTasks.length / this.pageSize);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderResults();
    // 결과 컨테이너 스크롤만 상단으로 이동
    const container = document.getElementById('advSearchResultsContainer');
    if (container) container.scrollTop = 0;
  }
};
