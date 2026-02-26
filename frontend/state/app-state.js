// state/app-state.js - 전역 상태 관리

import { StorageUtils } from '../utils/dom.js';

export const AppState = {
    tasks: [],
    categories: [],
    currentDate: new Date(),
    selectedDate: new Date(),
    currentPage: 1,
    tasksPerPage: 5,
    currentStatusFilter: '전체',
    currentPriorityFilter: '전체',
    currentSelectedDateStatusFilter: '전체',
    currentSearchType: 'text',
    sortField: 'endDate',
    sortDirection: 'asc',
    filterStartDate: null,
    filterEndDate: null,
    // 알림 설정
    notificationDaysBefore: StorageUtils.get('notificationDaysBefore', 7),
    notificationPriorities: StorageUtils.get('notificationPriorities', ['very-high', 'high', 'middle']),
    notificationStatuses: StorageUtils.get('notificationStatuses', ['pending', 'in-progress', 'on-hold']),
    notificationCategory1: StorageUtils.get('notificationCategory1', '전체'),
    notificationCategory2: StorageUtils.get('notificationCategory2', '전체'),
    notificationCategory3: StorageUtils.get('notificationCategory3', '전체'),
    // 간트 차트 필터
    ganttStatusFilter: StorageUtils.get('ganttStatusFilter', '전체'),
    ganttPriorityFilter: StorageUtils.get('ganttPriorityFilter', '전체'),
    // 카테고리 검색
    currentSearchCategory1: '',
    currentSearchCategory2: '',
    currentSearchCategory3: '',
    // 칸반 검색어
    kanbanSearchTerms: { 'pending': '', 'in-progress': '', 'completed': '', 'on-hold': '' },
    // 기타
    holidays: {},
    notifications: [],
    logs: [],
    currentLogFilter: '전체',
    gantt: null,
    ganttInitialized: false,
    ganttScrollLeft: 0
};
