// modules/gantt.js - 간트 차트 관련 기능

import { AppState } from '../state/app-state.js';
import { StorageUtils } from '../utils/dom.js';
import { API } from '../api/api.js';

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

    // 드래그(날짜 이동)와 단순 클릭을 명확하게 구분하기 위한 마우스 위치 추적
    if (!ganttEl.hasAttribute('data-drag-bound')) {
        ganttEl.setAttribute('data-drag-bound', 'true');
        ganttEl.addEventListener('mousedown', (e) => {
            window.__ganttMouseDownX = e.clientX;
            window.__ganttIsDragging = false;
        }, { passive: true });
        ganttEl.addEventListener('mousemove', (e) => {
            if (window.__ganttMouseDownX !== undefined && Math.abs(e.clientX - window.__ganttMouseDownX) > 3) {
                window.__ganttIsDragging = true;
            }
        }, { passive: true });
        window.addEventListener('mouseup', () => {
            // 클릭 컴포넌트 이벤트가 처리될 수 있도록 약간의 지연 후 초기화
            setTimeout(() => {
                window.__ganttIsDragging = false;
                window.__ganttMouseDownX = undefined;
            }, 100);
        });
    }

    AppState.gantt = new Gantt(ganttEl, ganttTasks, {
        header_height: 65, column_width: 50, step: 24,
        view_modes: ['Day', 'Week', 'Month'],
        bar_height: 25, padding: 35, bar_corner_radius: 4, arrow_curve: 5,
        view_mode: 'Day', date_format: 'YYYY-MM-DD', language: 'ko',
        infinite_padding: false, today_button: false, auto_move_label: false,
        readonly: false,
        readonly_progress: true, // 진행률 조절 핸들 비활성화 (시작 날짜 핸들과 겹침 방지)
        snap_at: '1d', // 하루 단위로 딱딱 맞게 스냅되도록 설정
        popup_on: false, // 드래그/리사이즈 후 내부 팝업이 자동으로 뜨는 것 방지 (클릭 시만 모달 오픈)
        on_click: (task) => {
            if (task.id.startsWith('dummy_')) return;

            // 드래그(이동/길이 조절)로 판별된 경우 클릭 이벤트(팝업 오픈) 무시
            if (window.__ganttIsDragging) return;

            window.openTaskModal(AppState.tasks.find(t => t.id === task.id));
        },
        on_date_change: async (task, start, end) => {
            if (task.id.startsWith('dummy_')) {
                initGanttChart(true); // 더미 드래그 시 원복
                return;
            }

            // 라이브러리에서 전달받은 start, end 날짜 객체를 안전하게 복사하여 포맷팅
            const newStart = formatDate(new Date(start.getTime()));
            const newEnd = formatDate(new Date(end.getTime()));

            const currentTask = AppState.tasks.find(t => t.id === task.id);
            if (!currentTask) return;

            // 이미 동일한 날짜라면 중단
            if (currentTask.startDate === newStart && currentTask.endDate === newEnd) {
                return;
            }

            try {
                // 1. 서버 데이터 업데이트
                await API.tasks.update(task.id, {
                    startDate: newStart,
                    endDate: newEnd
                });

                // 2. 전역 상태 동기화
                currentTask.startDate = newStart;
                currentTask.endDate = newEnd;

                // 3. 다른 뷰들 백그라운드 갱신 (간트 뷰는 다시 그리지 않음 - 튕김 방지)
                const dashboardEl = document.getElementById('dashboard-view');
                if (dashboardEl && dashboardEl.style.display === 'block') {
                    import('./dashboard-ui.js').then(m => m.DashboardUI.render(AppState.tasks));
                }

                const calendarEl = document.getElementById('calendar-view');
                if (calendarEl && calendarEl.style.display === 'block') {
                    import('./calendar-controller.js').then(m => {
                        m.renderCalendar();
                        m.renderTasksForSelectedDate();
                    });
                }

                // 드래그 종료 후 라이브러리 내부 팝업이 뜨는 것을 확실히 차단
                if (AppState.gantt) AppState.gantt.hide_popup();

            } catch (error) {
                console.error("Gantt date update failed:", error);
                // 에러 발생 시에만 차트를 강제로 새로고침하여 상태 복구
                initGanttChart(true);
            }
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
