// ui/calendar-ui.js - 캘린더 UI 렌더링

import { DomUtils } from '../utils/dom.js';
import { KoreanTime } from '../utils/korean-time.js';

export const CalendarUI = {
    render(tasks, currentDate, selectedDate, holidays) {
        const calendar = document.getElementById('calendar');
        const currentMonthEl = document.getElementById('currentMonth');

        if (!calendar || !currentMonthEl) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        currentMonthEl.textContent = `${year}년 ${month + 1}월`;
        calendar.innerHTML = '';

        // 요일 헤더
        ['일', '월', '화', '수', '목', '금', '토'].forEach(day => {
            calendar.appendChild(DomUtils.createElement('div', 'calendar-day header', day));
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);

        // 이전 달
        for (let i = firstDay.getDay() - 1; i >= 0; i--) {
            calendar.appendChild(this._createDayElement(
                new Date(year, month - 1, prevLastDay.getDate() - i),
                true, tasks, selectedDate, holidays
            ));
        }

        // 현재 달
        for (let day = 1; day <= lastDay.getDate(); day++) {
            calendar.appendChild(this._createDayElement(
                new Date(year, month, day), false, tasks, selectedDate, holidays
            ));
        }

        // 다음 달 (최대 5주 = 35칸)
        const daysRendered = calendar.children.length - 7; // 헤더 제외
        const remaining = Math.max(0, 35 - daysRendered);
        for (let day = 1; day <= remaining; day++) {
            calendar.appendChild(this._createDayElement(
                new Date(year, month + 1, day), true, tasks, selectedDate, holidays
            ));
        }
    },

    _createDayElement(date, isOtherMonth, tasks, selectedDate, holidays) {
        const dayDiv = DomUtils.createElement('div', 'calendar-day');

        if (isOtherMonth) dayDiv.classList.add('other-month');

        const today = KoreanTime.now();
        if (KoreanTime.isSameDay(date, today)) dayDiv.classList.add('today');
        if (KoreanTime.isSameDay(date, selectedDate)) dayDiv.classList.add('selected');

        const dow = date.getDay();
        if (dow === 0 || dow === 6) dayDiv.classList.add('weekend');

        const year = date.getFullYear();
        const monthDay = KoreanTime.formatDate(date).substring(5);
        if (holidays[year] && holidays[year][monthDay]) {
            dayDiv.classList.add('holiday');
            dayDiv.title = holidays[year][monthDay];
        }

        const dayNumber = DomUtils.createElement('div', 'day-number', date.getDate());
        const dayTasks = this.getTasksForDate(date, tasks);
        if (dayTasks.length > 0) {
            const countLabel = DomUtils.createElement('span', 'day-count', ` (${dayTasks.length})`);
            countLabel.style.fontSize = '12px';
            countLabel.style.fontWeight = 'normal';
            countLabel.style.marginLeft = '4px';
            countLabel.style.color = '#777';
            dayNumber.appendChild(countLabel);
        }
        dayDiv.appendChild(dayNumber);

        if (dayDiv.classList.contains('holiday')) {
            dayDiv.appendChild(DomUtils.createElement('div', 'holiday-name', holidays[year][monthDay]));
        }

        if (dayTasks.length > 0) {
            const tasksDiv = DomUtils.createElement('div', 'day-tasks');
            dayTasks.slice(0, 3).forEach(task => {
                const dot = DomUtils.createElement('span', `task-dot status-${task.status}`);
                dot.title = task.taskName;
                tasksDiv.appendChild(dot);
            });
            if (dayTasks.length > 3) {
                tasksDiv.appendChild(document.createTextNode(` +${dayTasks.length - 3}`));
            }
            dayDiv.appendChild(tasksDiv);
        }

        dayDiv.addEventListener('click', () => window.selectDate(new Date(date)));

        // 드래그 앤 드롭 이벤트
        dayDiv.ondragover = (e) => {
            e.preventDefault();
            dayDiv.classList.add('drag-over');
        };

        dayDiv.ondragleave = () => {
            dayDiv.classList.remove('drag-over');
        };

        dayDiv.ondrop = async (e) => {
            e.preventDefault();
            dayDiv.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            if (taskId) {
                const targetDateStr = KoreanTime.formatDate(date); // YYYY-MM-DD
                await window.updateTask(taskId, {
                    startDate: targetDateStr,
                    endDate: targetDateStr
                });
            }
        };

        return dayDiv;
    },

    getTasksForDate(date, tasks) {
        return tasks.filter(task => task.endDate && KoreanTime.isSameDay(date, task.endDate));
    }
};
