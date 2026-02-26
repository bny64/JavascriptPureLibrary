// ui/activity-log-ui.js - 활동 로그 UI 렌더링

import { TextUtils } from '../utils/dom.js';
import { KoreanTime } from '../utils/korean-time.js';

export const ActivityLogUI = {
    formatLogDetail(detail) {
        if (!detail) return '';

        const statusMap = {
            '대기': 'pending', '진행중': 'in-progress', '완료': 'completed', '보류': 'on-hold'
        };
        const priorityMap = {
            '매우 높음': 'very-high', '높음': 'high', '중간': 'middle', '낮음': 'low', '매우 낮음': 'very-low'
        };

        let formatted = TextUtils.escapeHtml(detail);

        formatted = formatted.replace(/\{NEW\}/g, '<span class="change-tag new">NEW</span>');
        formatted = formatted.replace(/\{UPDATE\}/g, '<span class="change-tag update">UPDATE</span>');
        formatted = formatted.replace(/\{DELETE\}/g, '<span class="change-tag delete">DELETE</span>');

        // 상태와 우선순위를 한 번에 처리하여 중첩 태그 방지
        const allLabels = [...Object.keys(statusMap), ...Object.keys(priorityMap)].sort((a, b) => b.length - a.length);
        const pattern = new RegExp(allLabels.join('|'), 'g');

        formatted = formatted.replace(pattern, (match) => {
            if (statusMap[match]) {
                return `<span class="log-detail-badge status-${statusMap[match]}">${match}</span>`;
            } else if (priorityMap[match]) {
                return `<span class="log-detail-badge priority-${priorityMap[match]}">${match}</span>`;
            }
            return match;
        });

        return formatted;
    },

    render(logs) {
        const container = document.getElementById('activityTimeline');
        if (!container) return;

        if (!logs || logs.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">기록된 활동이 없습니다.</p>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="timeline-item action-${log.action}">
                <div class="timeline-content" onclick="window.handleLogClick('${log.taskId}', '${log.taskName}')">
                    <span class="log-time">${KoreanTime.toKST(log.timestamp).toLocaleString()}</span>
                    <div class="log-header">
                        <span class="log-task-name">${TextUtils.escapeHtml(log.taskName)}</span>
                        <span class="log-action">${log.action}</span>
                    </div>
                    ${log.details ? `<div class="log-details">
                        ${log.details.split(log.details.includes(' ||| ') ? ' ||| ' : ', ').map(c => `<div>• ${this.formatLogDetail(c)}</div>`).join('')}
                    </div>` : ''}
                </div>
            </div>
        `).join('');
    }
};
