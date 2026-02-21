// modules/memo-modal.js - 중요 메모 모달 관련 기능

import { DomUtils } from '../utils/dom.js';

export function openImportantMemoModal(taskId, memoContent) {
    const modal = document.getElementById('importantMemoModal');
    document.getElementById('memoTaskId').value = taskId;
    document.getElementById('importantMemoContent').value = memoContent || '';
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

export function closeImportantMemoModal() {
    document.getElementById('importantMemoModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

export async function saveImportantMemo(event) {
    event.preventDefault();
    const taskId = document.getElementById('memoTaskId').value;
    const importantMemo = document.getElementById('importantMemoContent').value;

    if (!taskId) {
        console.error('Task ID is missing for saving important memo.');
        alert('메모를 저장할 업무를 찾을 수 없습니다.');
        return;
    }

    try {
        await window.updateTask(taskId, { importantMemo });
        closeImportantMemoModal();
    } catch (error) {
        console.error('Error saving important memo:', error);
        alert('중요 메모 저장 중 오류가 발생했습니다.');
    }
}
