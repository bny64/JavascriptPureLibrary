// modules/gantt.js - 간트 차트 관련 기능

import { AppState } from '../state/app-state.js';
import { StorageUtils } from '../utils/dom.js';

const monthNamesKo = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function transformTasksForGantt(tasks) {
    let filtered = tasks.filter(t => t.startDate && t.endDate);

    if (AppState.ganttStatusFilter !== '전체') {
        filtered = filtered.filter(t => t.status === AppState.ganttStatusFilter);
    }
    if (AppState.ganttPriorityFilter !== '전체') {
        filtered = filtered.filter(t => t.priority === AppState.ganttPriorityFilter);
    }
    if (filtered.length === 0) return [];

    const sorted = [...filtered].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const ganttTasks = sorted.map(task => {
        const customClass = {
            'very-high': 'gantt-priority-very-high', 'high': 'gantt-priority-high',
            'middle': 'gantt-priority-middle', 'low': 'gantt-priority-low', 'very-low': 'gantt-priority-very-low'
        }[task.priority] || 'gantt-priority-middle';

        const name = [task.category1, task.category2, task.category3, task.taskName].filter(Boolean).join(' > ');
        return { id: task.id, name, start: task.startDate, end: task.endDate, progress: 0, custom_class: customClass };
    });

    // 버퍼 추가
    const starts = sorted.map(t => new Date(t.startDate).getTime());
    const ends = sorted.map(t => new Date(t.endDate).getTime());
    const minStart = new Date(Math.min(...starts));
    const maxEnd = new Date(Math.max(...ends));

    const dummyStart = new Date(minStart); dummyStart.setMonth(dummyStart.getMonth() - 1);
    const dummyEnd = new Date(maxEnd); dummyEnd.setMonth(dummyEnd.getMonth() + 1);

    return [...ganttTasks,
    { id: 'dummy_start_buffer', name: '\u00A0', start: formatDate(dummyStart), end: formatDate(dummyStart), progress: 0, custom_class: 'gantt-dummy-task' },
    { id: 'dummy_end_buffer', name: '\u00A0', start: formatDate(dummyEnd), end: formatDate(dummyEnd), progress: 0, custom_class: 'gantt-dummy-task' }
    ];
}

export function postProcessGanttHeaders() {
    const ganttEl = document.getElementById('gantt-target');
    if (!ganttEl) return;

    ganttEl.querySelectorAll('text').forEach(textEl => {
        const text = textEl.textContent.trim();
        const cls = textEl.getAttribute('class') || '';

        if (cls.includes('upper-text')) {
            const idx = monthNamesEn.findIndex(m => new RegExp(`^${m}$`, 'i').test(text));
            if (idx !== -1) textEl.textContent = monthNamesKo[idx];
        }
        if (cls.includes('lower-text') && /^\d{1,2}$/.test(text)) {
            const n = parseInt(text);
            if (n >= 1 && n <= 31) textEl.textContent = n + '일';
        }
    });
}

export function initGanttChart(forceRefresh = false) {
    activateGanttFilterButtons();
    const ganttTasks = transformTasksForGantt(AppState.tasks);
    const ganttEl = document.getElementById('gantt-target');
    if (!ganttEl) return;

    if (AppState.gantt && !forceRefresh) {
        AppState.gantt.refresh(ganttTasks);
        return;
    }

    ganttEl.style.visibility = 'hidden';
    ganttEl.innerHTML = '';
    AppState.gantt = null;

    if (ganttTasks.length === 0) {
        ganttEl.style.visibility = 'visible';
        ganttEl.innerHTML = '<p style="text-align:center;padding:20px;">간트 차트에 표시할 업무가 없습니다.</p>';
        return;
    }

    AppState.gantt = new Gantt(ganttEl, ganttTasks, {
        header_height: 65, column_width: 50, step: 24,
        view_modes: ['Day', 'Week', 'Month'],
        bar_height: 25, padding: 35, bar_corner_radius: 4, arrow_curve: 5,
        view_mode: 'Day', date_format: 'YYYY-MM-DD', language: 'ko',
        infinite_padding: false, today_button: false, auto_move_label: false,
        readonly: true,
        on_click: (task) => {
            window.openTaskModal(AppState.tasks.find(t => t.id === task.id));
        },
        on_view_change: () => postProcessGanttHeaders(),
    });

    setTimeout(() => {
        postProcessGanttHeaders();

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const ganttStart = AppState.gantt.gantt_start;
        const ganttEnd = AppState.gantt.gantt_end;

        if (ganttStart && today >= ganttStart && today <= ganttEnd) {
            const daysDiff = (today.getTime() - ganttStart.getTime()) / (1000 * 60 * 60 * 24);
            const scrollOffset = (daysDiff * AppState.gantt.options.column_width) - (ganttEl.clientWidth / 2);
            if (scrollOffset > 0) ganttEl.scrollLeft = scrollOffset;
        }

        setGanttMinWidth(ganttEl);
        ganttEl.style.visibility = 'visible';
    }, 150);
}

export function setGanttMinWidth(ganttEl) {
    if (!ganttEl) return;
    const svg = ganttEl.querySelector('svg.gantt');
    if (svg) {
        const containerW = ganttEl.clientWidth;
        const svgW = parseFloat(svg.getAttribute('width'));
        if (svgW < containerW) svg.setAttribute('width', (containerW + 50) + 'px');
    }
}

export function filterGanttByStatus(status) {
    AppState.ganttStatusFilter = status;
    StorageUtils.set('ganttStatusFilter', status);
    initGanttChart(true);
    activateGanttFilterButtons();
}

export function filterGanttByPriority(priority) {
    AppState.ganttPriorityFilter = priority;
    StorageUtils.set('ganttPriorityFilter', priority);
    initGanttChart(true);
    activateGanttFilterButtons();
}

export function activateGanttFilterButtons() {
    document.querySelectorAll('.gantt-filters .status-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-status') === AppState.ganttStatusFilter);
    });
    document.querySelectorAll('.gantt-filters .priority-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-priority') === AppState.ganttPriorityFilter);
    });
}
