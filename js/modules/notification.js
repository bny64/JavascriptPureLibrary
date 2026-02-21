// modules/notification.js - 알림 관련 기능

import { AppState } from '../state/app-state.js';
import { ArrayUtils, StorageUtils, DomUtils } from '../utils/dom.js';
import { KoreanTime } from '../utils/korean-time.js';

export function getTasksEndingSoon() {
    const today = KoreanTime.now();
    today.setHours(0, 0, 0, 0);

    return AppState.tasks.filter(task => {
        if (task.status === '완료') return false;
        if (!AppState.notificationStatuses.includes(task.status)) return false;
        if (!task.endDate) return false;

        const endDate = KoreanTime.toKST(task.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < today) return false;

        const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 0 || daysDiff > AppState.notificationDaysBefore) return false;

        if (!AppState.notificationPriorities.includes(task.priority)) return false;

        if (AppState.notificationCategory1 !== '전체' && task.category1 !== AppState.notificationCategory1) return false;
        if (AppState.notificationCategory2 !== '전체' && task.category2 !== AppState.notificationCategory2) return false;
        if (AppState.notificationCategory3 !== '전체' && task.category3 !== AppState.notificationCategory3) return false;

        return true;
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
}

export function renderNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const notificationTitle = document.getElementById('notificationDropdownTitle');

    if (notificationTitle) {
        notificationTitle.textContent = AppState.notificationDaysBefore === 0
            ? '오늘 종료 예정 업무'
            : `종료일 D-${AppState.notificationDaysBefore}일 이내 업무`;
    }

    notificationList.innerHTML = '';

    if (notifications.length === 0) {
        notificationList.innerHTML = '<li>알림 없음</li>';
        notificationCount.textContent = '0';
        return;
    }

    notificationCount.textContent = notifications.length;
    notifications.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="task-name">${task.taskName}</span><span class="end-date">(${task.endDate} 종료)</span>`;
        li.onclick = () => {
            window.selectDate(task.endDate);
            window.openTaskModal(task);
            toggleNotificationDropdown();
        };
        notificationList.appendChild(li);
    });
}

export function toggleNotificationDropdown() {
    document.getElementById('notificationDropdown').classList.toggle('show');
}

export function initNotifications() {
    document.getElementById('notificationBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationDropdown();
    });
}

// 알림 설정 모달
export function openNotificationSettingsModal() {
    const modal = document.getElementById('notificationSettingsModal');
    document.getElementById('notificationDaysBefore').value = AppState.notificationDaysBefore;

    document.querySelectorAll('input[name="notificationPriority"]').forEach(cb => {
        cb.checked = AppState.notificationPriorities.includes(cb.value);
    });
    document.querySelectorAll('input[name="notificationStatus"]').forEach(cb => {
        cb.checked = AppState.notificationStatuses.includes(cb.value);
    });

    populateNotificationCategories();
    document.getElementById('notificationCategory1').value = AppState.notificationCategory1;
    populateNotificationSubCategories();
    document.getElementById('notificationCategory2').value = AppState.notificationCategory2;
    populateNotificationDetailCategories();
    document.getElementById('notificationCategory3').value = AppState.notificationCategory3;

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

export function closeNotificationSettingsModal() {
    document.getElementById('notificationSettingsModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

export function populateNotificationCategories() {
    const select = document.getElementById('notificationCategory1');
    const mains = ArrayUtils.unique(AppState.categories.map(c => c.mainCategory));
    select.innerHTML = '<option value="전체">전체</option>';
    mains.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        select.appendChild(opt);
    });
}

export function populateNotificationSubCategories() {
    const cat1 = document.getElementById('notificationCategory1').value;
    const select = document.getElementById('notificationCategory2');
    select.innerHTML = '<option value="전체">전체</option>';
    if (cat1 === '전체') return;

    ArrayUtils.unique(AppState.categories.filter(c => c.mainCategory === cat1 && c.subCategory).map(c => c.subCategory))
        .forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            select.appendChild(opt);
        });
}

export function populateNotificationDetailCategories() {
    const cat1 = document.getElementById('notificationCategory1').value;
    const cat2 = document.getElementById('notificationCategory2').value;
    const select = document.getElementById('notificationCategory3');
    select.innerHTML = '<option value="전체">전체</option>';
    if (cat1 === '전체' || cat2 === '전체') return;

    ArrayUtils.unique(AppState.categories.filter(c => c.mainCategory === cat1 && c.subCategory === cat2 && c.detailCategory).map(c => c.detailCategory))
        .forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            select.appendChild(opt);
        });
}

export async function saveNotificationSettings(event) {
    event.preventDefault();

    AppState.notificationDaysBefore = parseInt(document.getElementById('notificationDaysBefore').value);
    StorageUtils.set('notificationDaysBefore', AppState.notificationDaysBefore);

    AppState.notificationPriorities = Array.from(document.querySelectorAll('input[name="notificationPriority"]:checked')).map(cb => cb.value);
    StorageUtils.set('notificationPriorities', AppState.notificationPriorities);

    AppState.notificationStatuses = Array.from(document.querySelectorAll('input[name="notificationStatus"]:checked')).map(cb => cb.value);
    StorageUtils.set('notificationStatuses', AppState.notificationStatuses);

    AppState.notificationCategory1 = document.getElementById('notificationCategory1').value;
    AppState.notificationCategory2 = document.getElementById('notificationCategory2').value;
    AppState.notificationCategory3 = document.getElementById('notificationCategory3').value;
    StorageUtils.set('notificationCategory1', AppState.notificationCategory1);
    StorageUtils.set('notificationCategory2', AppState.notificationCategory2);
    StorageUtils.set('notificationCategory3', AppState.notificationCategory3);

    await window.loadTasks();
    closeNotificationSettingsModal();
    alert('알림 설정이 저장되었습니다.');
}
