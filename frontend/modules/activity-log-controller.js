// activity-log-controller.js
import { AppState } from '../state/app-state.js';
import { API } from '../api/api.js';
import { ActivityLogUI } from '../ui/activity-log-ui.js';
import { openTaskModal } from './task-modal.js';

export async function loadLogs() {
    AppState.logs = await API.logs.getAll();
    let filteredLogs = AppState.logs;
    if (AppState.currentLogFilter !== '전체') {
        filteredLogs = AppState.logs.filter(l => l.action === AppState.currentLogFilter);
    }
    ActivityLogUI.render(filteredLogs);
    updateLogFilterButtons();
}

export function filterLogs(action) {
    AppState.currentLogFilter = action;
    loadLogs();
}

export function updateLogFilterButtons() {
    document.querySelectorAll('.log-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-action') === AppState.currentLogFilter);
    });
}

export function handleLogClick(taskId, taskName) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (task) openTaskModal(task);
    else alert(`'${taskName}' 업무는 삭제되어 상세 내용을 확인할 수 없습니다.`);
}
