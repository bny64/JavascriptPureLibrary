// calendar-controller.js
import { AppState } from '../state/app-state.js';
import { CalendarUI } from '../ui/calendar-ui.js';
import { TaskUI } from '../ui/task-ui.js';

export function renderCalendar() {
    CalendarUI.render(AppState.tasks, AppState.currentDate, AppState.selectedDate, AppState.holidays);
}

export function renderTasksForSelectedDate() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;

    let tasksForDate = CalendarUI.getTasksForDate(AppState.selectedDate, AppState.tasks);

    if (AppState.currentSelectedDateStatusFilter !== '전체') {
        tasksForDate = tasksForDate.filter(t => t.status === AppState.currentSelectedDateStatusFilter);
    }

    const statusFilters = document.querySelectorAll('#selectedDateStatusFilters .filter-btn');
    if (statusFilters.length > 0) {
        statusFilters.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-status').trim() === AppState.currentSelectedDateStatusFilter.trim());
        });
    }

    if (tasksForDate.length === 0) {
        tasksList.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">선택한 날짜에 업무가 없습니다.</p>';
        return;
    }
    tasksList.innerHTML = '';
    tasksForDate.forEach(task => tasksList.appendChild(TaskUI.createCard(task)));
}

export function filterSelectedDateTasksByStatus(status) {
    AppState.currentSelectedDateStatusFilter = status;
    renderTasksForSelectedDate();
}

export function updateSelectedDateTitle() {
    const title = document.getElementById('selectedDateTitle');
    if (!title) return;

    const d = AppState.selectedDate;
    title.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일의 업무`;
}

export function selectDate(date) {
    AppState.selectedDate = new Date(date);
    renderCalendar();
    renderTasksForSelectedDate();
    updateSelectedDateTitle();
}

export function previousMonth() {
    AppState.currentDate.setMonth(AppState.currentDate.getMonth() - 1);
    renderCalendar();
}

export function nextMonth() {
    AppState.currentDate.setMonth(AppState.currentDate.getMonth() + 1);
    renderCalendar();
}
