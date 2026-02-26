// ui/kanban-ui.js - 칸반 보드 UI 렌더링

import { DomUtils, TextUtils } from '../utils/dom.js';
import { AppState } from '../state/app-state.js';

const PRIORITY_LABELS = {
    'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
};

const PRIORITY_COLORS = {
    'very-high': '#e53935', 'high': '#fb8c00', 'middle': '#3f51b5', 'low': '#4caf50', 'very-low': '#607d8b'
};

export const KanbanUI = {
    render(tasks) {
        ['pending', 'in-progress', 'completed', 'on-hold'].forEach(status => {
            const container = document.getElementById(`kanban-${status}`);
            const countEl = document.querySelector(`.kanban-column-header.status-${status} .count`);
            if (!container) return;

            const searchTerm = (AppState.kanbanSearchTerms[status] || '').toLowerCase();
            let filtered = tasks.filter(t => t.status === status);

            if (searchTerm) {
                filtered = filtered.filter(task =>
                    task.taskName.toLowerCase().includes(searchTerm) ||
                    (task.description && task.description.toLowerCase().includes(searchTerm))
                );
            }

            // 종료 날짜 기준 내림차순 정렬 (최신 날짜 혹은 나중 날짜가 위로)
            filtered.sort((a, b) => {
                const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                return dateB - dateA;
            });

            if (countEl) countEl.textContent = filtered.length;
            container.innerHTML = '';
            filtered.forEach(task => container.appendChild(this._createCard(task)));
        });
    },

    _createCard(task) {
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

        const priorityText = PRIORITY_LABELS[task.priority] || '중간';
        const priorityClass = `priority-${task.priority || 'middle'}`;
        card.style.borderLeftColor = PRIORITY_COLORS[task.priority] || '#3f51b5';

        let checklistHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            const total = task.subtasks.length;
            const completed = task.subtasks.filter(s => s.completed).length;
            const percent = Math.round((completed / total) * 100);
            checklistHtml = `
                <div class="task-checklist-progress" style="margin-top: 5px;">
                    <div class="task-checklist-header" style="font-size: 10px; margin-bottom: 2px;">
                        <span>체크리스트 ${completed}/${total}</span>
                        <span>${percent}%</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${percent}%;"></div></div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="kanban-card-title">${TextUtils.escapeHtml(task.taskName)}</div>
            <div class="task-category" style="margin-bottom:8px;">${TextUtils.escapeHtml(task.category1 || '미분류')}</div>
            ${checklistHtml}
            <div class="kanban-card-meta">
                <span class="task-priority ${priorityClass}">${priorityText}</span>
                <span class="task-date">${task.endDate || ''}</span>
            </div>
        `;

        card.addEventListener('click', () => window.openTaskModal(task));
        return card;
    }
};
