// ui/kanban-ui.js - 칸반 보드 UI 렌더링

import { DomUtils, TextUtils } from '../utils/dom.js';
import { AppState } from '../state/app-state.js';

const PRIORITY_LABELS = {
    'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
};

const PRIORITY_COLORS = {
    'very-high': '#e53935', 'high': '#fb8c00', 'middle': '#3f51b5', 'low': '#4caf50', 'very-low': '#607d8b'
};

const STATUS_CONFIG = [
    { id: 'pending', label: '대기', color: '#ffc107' },
    { id: 'in-progress', label: '진행중', color: '#2196f3' },
    { id: 'completed', label: '완료', color: '#4caf50' },
    { id: 'on-hold', label: '보류', color: '#9e9e9e' }
];

const PRIORITY_CONFIG = [
    { id: 'very-high', label: '매우 높음', color: '#e53935' },
    { id: 'high', label: '높음', color: '#fb8c00' },
    { id: 'middle', label: '보통', color: '#3f51b5' },
    { id: 'low', label: '낮음', color: '#4caf50' },
    { id: 'very-low', label: '매우 낮음', color: '#607d8b' }
];

export const KanbanUI = {
    render(tasks) {
        const boardContainer = document.getElementById('kanban-board-container');
        if (!boardContainer) return;

        // 인라인 이벤트 핸들러를 위해 전역 등록
        window.KanbanUI = this;

        const mode = AppState.kanbanGroupBy || 'status';
        const config = mode === 'status' ? STATUS_CONFIG : PRIORITY_CONFIG;

        // 컨테이너 클래스 변경 (레이아웃 조절용)
        boardContainer.className = `kanban-board mode-${mode}`;

        // 탭 상태 업데이트 및 이벤트 바인딩
        document.querySelectorAll('.kanban-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-group') === mode);
            btn.onclick = () => this.setGroupBy(btn.getAttribute('data-group'));
        });

        boardContainer.innerHTML = '';
        config.forEach(group => {
            boardContainer.appendChild(this._createColumn(group, tasks, mode));
        });
    },

    setGroupBy(mode) {
        AppState.kanbanGroupBy = mode;
        this.render(AppState.tasks);
    },

    _createColumn(group, tasks, mode) {
        const col = DomUtils.createElement('div', 'kanban-column');
        col.setAttribute('data-group-id', group.id);
        col.setAttribute('data-mode', mode);

        // 드롭 이벤트 설정
        col.ondragover = (ev) => window.allowDrop(ev);
        col.ondrop = (ev) => this._handleDrop(ev, group.id, mode);

        const searchTerm = (AppState.kanbanSearchTerms[group.id] || '').toLowerCase();
        let filtered = tasks.filter(t => (mode === 'status' ? t.status : t.priority) === group.id);

        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.taskName.toLowerCase().includes(searchTerm) ||
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }

        // 정렬
        filtered.sort((a, b) => {
            const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
            const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
            return dateB - dateA;
        });

        const header = DomUtils.createElement('div', `kanban-column-header`);
        header.style.backgroundColor = group.color;
        header.innerHTML = `
            ${group.label} <span class="count">${filtered.length}</span>
            <input type="text" class="kanban-search-input" placeholder="검색" value="${TextUtils.escapeHtml(searchTerm)}">
        `;

        const searchInput = header.querySelector('.kanban-search-input');
        searchInput.oninput = (e) => {
            const val = e.target.value;
            AppState.kanbanSearchTerms[group.id] = val;

            const sTerm = val.toLowerCase();
            const tasksList = col.querySelector('.kanban-tasks');
            const countSpan = header.querySelector('.count');

            let fTasks = AppState.tasks.filter(t => (mode === 'status' ? t.status : t.priority) === group.id);
            if (sTerm) {
                fTasks = fTasks.filter(task =>
                    task.taskName.toLowerCase().includes(sTerm) ||
                    (task.description && task.description.toLowerCase().includes(sTerm))
                );
            }

            fTasks.sort((a, b) => {
                const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                return dateB - dateA;
            });

            countSpan.textContent = fTasks.length;
            tasksList.innerHTML = '';
            fTasks.forEach(task => tasksList.appendChild(this._createCard(task, mode)));
        };

        const tasksContainer = DomUtils.createElement('div', 'kanban-tasks');
        tasksContainer.id = `kanban-${group.id}`;

        filtered.forEach(task => tasksContainer.appendChild(this._createCard(task, mode)));

        col.appendChild(header);
        col.appendChild(tasksContainer);
        return col;
    },

    async _handleDrop(ev, groupId, mode) {
        ev.preventDefault();
        const col = ev.currentTarget;
        col.classList.remove('drag-over');

        const taskId = ev.dataTransfer.getData('text/plain');
        if (!taskId) return;

        const task = AppState.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (mode === 'status') {
            if (task.status !== groupId) {
                // global의 updateTask 함수 이용 (main.js에 정의됨)
                await window.updateTask(taskId, { status: groupId });
            }
        } else {
            if (task.priority !== groupId) {
                await window.updateTask(taskId, { priority: groupId });
            }
        }
    },

    _createCard(task, mode) {
        const card = DomUtils.createElement('div', 'kanban-card');
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-id', task.id);

        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
        });

        // 모드에 따라 왼쪽 라인 색상 및 메타 정보 문구/뱃지 결정
        let metaHtml = '';
        if (mode === 'status') {
            const priorityText = PRIORITY_LABELS[task.priority] || '보통';
            const priorityClass = `priority-${task.priority || 'middle'}`;
            card.style.borderLeftColor = PRIORITY_COLORS[task.priority] || '#3f51b5';
            metaHtml = `
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <span style="color: #777; font-size: 11px; font-weight: 600;">우선순위:</span>
                    <span class="task-priority ${priorityClass}" style="margin-left: 0;">${priorityText}</span>
                </div>
            `;
        } else {
            const statusConfig = STATUS_CONFIG.find(s => s.id === task.status) || STATUS_CONFIG[0];
            const statusLabel = statusConfig.label;
            card.style.borderLeftColor = statusConfig.color;
            metaHtml = `
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <span style="color: #777; font-size: 11px; font-weight: 600;">진행 상태:</span>
                    <span class="status-badge status-${task.status}" style="padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; color: white; background-color: ${statusConfig.color};">${statusLabel}</span>
                </div>
            `;
        }

        const priorityText = PRIORITY_LABELS[task.priority] || '중간';
        const priorityClass = `priority-${task.priority || 'middle'}`;

        let checklistHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            const total = task.subtasks.length;
            const completed = task.subtasks.filter(s => s.completed).length;
            const percent = Math.round((completed / total) * 100);
            checklistHtml = `
                <div class="task-checklist-progress">
                    <div class="task-checklist-header">
                        <span>체크리스트 ${completed}/${total}</span>
                        <span>${percent}%</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${percent}%;"></div></div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="kanban-card-title">${TextUtils.escapeHtml(task.taskName)}</div>
            <div class="task-category">${TextUtils.escapeHtml(task.category1 || '미분류')}</div>
            ${checklistHtml}
            <div class="kanban-card-meta">
                ${metaHtml}
                <span class="task-date">${task.endDate || ''}</span>
            </div>
        `;

        card.addEventListener('click', () => window.openTaskModal(task));
        return card;
    }
};
