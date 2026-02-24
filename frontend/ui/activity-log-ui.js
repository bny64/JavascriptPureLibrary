// ui/activity-log-ui.js - 활동 로그 UI 렌더링

import { TextUtils } from '../utils/dom.js';
import { KoreanTime } from '../utils/korean-time.js';

export const ActivityLogUI = {
    formatLogDetail(detail) {
        if (!detail) return '';

        const statuses = ['대기', '진행중', '완료', '보류'];
        const priorities = {
            '매우 높음': 'very-high', '높음': 'high', '중간': 'middle', '낮음': 'low', '매우 낮음': 'very-low'
        };

        let formatted = detail;
        if (!detail.includes('[메모]') && !detail.includes('[설명]')) {
            formatted = TextUtils.escapeHtml(detail);
        }
        formatted = formatted.replace(/\{NEW\}/g, '<span class="change-tag new">NEW</span>');
        formatted = formatted.replace(/\{UPDATE\}/g, '<span class="change-tag update">UPDATE</span>');
        formatted = formatted.replace(/\{DELETE\}/g, '<span class="change-tag delete">DELETE</span>');

        statuses.forEach(status => {
            formatted = formatted.replace(new RegExp(status, 'g'),
                `<span class="log-detail-badge status-${status}">${status}</span>`);
        });

        Object.keys(priorities).forEach(label => {
            formatted = formatted.replace(new RegExp(label, 'g'),
                `<span class="log-detail-badge priority-${priorities[label]}">${label}</span>`);
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
