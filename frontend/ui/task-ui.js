// ui/task-ui.js - 업무 카드 및 요약 UI 렌더링

import { DomUtils, TextUtils } from '../utils/dom.js';

const PRIORITY_LABELS = {
    'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
};

const STATUS_LABELS = {
    'pending': '대기', 'in-progress': '진행중', 'completed': '완료', 'on-hold': '보류'
};

export const TaskUI = {
    createCard(task) {
        const taskDiv = DomUtils.createElement('div', `task-item status-${task.status}`);

        // 헤더
        const header = DomUtils.createElement('div', 'task-header');
        header.appendChild(DomUtils.createElement('div', 'task-title', task.taskName));
        header.appendChild(DomUtils.createElement('span', `task-status status-${task.status}`, STATUS_LABELS[task.status] || task.status));
        header.appendChild(DomUtils.createElement('span', `task-priority priority-${task.priority}`, PRIORITY_LABELS[task.priority] || '중간'));

        if (task.description && task.description.trim() && task.description.trim() !== '<p><br></p>') {
            const memoIcon = DomUtils.createElement('span', 'task-memo-icon', '📌');
            memoIcon.title = '메모 있음';
            memoIcon.onclick = (e) => {
                e.stopPropagation();
                window.openTaskModal(task);
            };
            header.appendChild(memoIcon);
        }

        // 카테고리
        const category = DomUtils.createElement('div', 'task-category');
        let catText = task.category1;
        if (task.category2) catText += ` > ${task.category2}`;
        if (task.category3) catText += ` > ${task.category3}`;
        category.textContent = catText;

        // 메모(구 설명)
        const description = DomUtils.createElement('div', 'task-description');
        description.innerHTML = task.description || '메모 없음';

        taskDiv.appendChild(header);
        taskDiv.appendChild(category);
        taskDiv.appendChild(description);

        // 액션 버튼
        const actions = DomUtils.createElement('div', 'task-actions');

        // 메모 기능 버튼 제거됨

        const editBtn = DomUtils.createElement('button', 'btn-edit', '수정');
        editBtn.onclick = (e) => { e.stopPropagation(); window.openTaskModal(task); };

        const copyBtn = DomUtils.createElement('button', 'btn-copy', '복사');
        copyBtn.onclick = (e) => { e.stopPropagation(); window.copyTask(task); };

        const deleteBtn = DomUtils.createElement('button', 'btn-delete', '삭제');
        deleteBtn.onclick = (e) => { e.stopPropagation(); window.deleteTask(task.id); };

        actions.appendChild(editBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(deleteBtn);
        taskDiv.appendChild(actions);

        return taskDiv;
    },

    renderStatusSummary(tasks, targetElementId) {
        const target = document.getElementById(targetElementId);
        if (!target) return;

        const counts = { '전체': tasks.length, 'pending': 0, 'in-progress': 0, 'completed': 0, 'on-hold': 0 };
        tasks.forEach(t => { if (counts.hasOwnProperty(t.status)) counts[t.status]++; });

        const order = ['전체', 'pending', 'in-progress', 'completed', 'on-hold'];

        target.innerHTML = '<div class="status-summary-item-wrapper">' +
            order.map(status => {
                const label = status === '전체' ? '전체' : STATUS_LABELS[status];
                return `
                <div class="status-summary-item" data-status="${status}" onclick="window.openAllTasksModalWithStatus('${status}')">
                    <span class="status-summary-label status-${status}">${label}</span>
                    <span class="status-summary-count status-${status}">${counts[status]}</span>
                </div>
            `}).join('') + '</div>';
    },

    renderPrioritySummary(tasks, targetElementId) {
        const target = document.getElementById(targetElementId);
        if (!target) return;

        const unfinished = tasks.filter(t => t.status !== 'completed');
        const order = ['very-high', 'high', 'middle', 'low', 'very-low'];
        const counts = { 'very-high': 0, 'high': 0, 'middle': 0, 'low': 0, 'very-low': 0 };
        unfinished.forEach(t => { const p = t.priority || 'middle'; if (counts.hasOwnProperty(p)) counts[p]++; });

        let html = '<div class="priority-summary-item-wrapper">';
        html += `<div class="priority-summary-item" data-priority="전체" onclick="window.openAllTasksModalWithPriority('전체')">
            <span class="priority-summary-label">전체</span>
            <span class="priority-summary-count">${unfinished.length}</span>
        </div>`;
        order.forEach(key => {
            html += `<div class="priority-summary-item" data-priority="${key}" onclick="window.openAllTasksModalWithPriority('${key}')">
                <span class="priority-summary-label priority-${key}">${PRIORITY_LABELS[key]}</span>
                <span class="priority-summary-count priority-${key}">${counts[key]}</span>
            </div>`;
        });
        html += '</div>';
        target.innerHTML = html;
    },

    renderUnfinishedTasksSummary(tasks) {
        const el = document.getElementById('unfinishedTaskCount');
        if (el) el.textContent = tasks.filter(t => t.status !== 'completed').length;
    }
};
