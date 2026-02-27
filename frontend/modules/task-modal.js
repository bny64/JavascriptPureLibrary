// modules/task-modal.js - 업무 모달 관련 기능

import { AppState } from '../state/app-state.js';
import { ArrayUtils, DomUtils, TextUtils } from '../utils/dom.js';
import { KoreanTime } from '../utils/korean-time.js';

let quillInstance = null;
let localSubtasks = [];

export function addSubtask() {
    const input = document.getElementById('newSubtaskTitle');
    const title = input.value.trim();
    if (!title) return;

    localSubtasks.push({
        id: Date.now().toString(),
        title: title,
        completed: false
    });

    input.value = '';
    renderSubtasks();
}

export function toggleSubtask(id) {
    const subtask = localSubtasks.find(s => s.id === id);
    if (subtask) {
        subtask.completed = !subtask.completed;
        renderSubtasks();
    }
}

export function deleteSubtask(id) {
    localSubtasks = localSubtasks.filter(s => s.id !== id);
    renderSubtasks();
}

function renderSubtasks() {
    const list = document.getElementById('subtaskList');
    if (!list) return;

    list.innerHTML = localSubtasks.map(s => `
        <div class="subtask-item ${s.completed ? 'completed' : ''}" data-id="${s.id}">
            <input type="checkbox" class="subtask-checkbox" ${s.completed ? 'checked' : ''}>
            <span class="subtask-title-text" style="cursor:pointer;">${TextUtils.escapeHtml(s.title)}</span>
            <button type="button" class="btn-delete-subtask">&times;</button>
        </div>
    `).join('');

    list.querySelectorAll('.subtask-item').forEach(item => {
        const id = item.getAttribute('data-id');
        item.querySelector('.subtask-checkbox').addEventListener('change', () => toggleSubtask(id));
        item.querySelector('.subtask-title-text').addEventListener('click', () => toggleSubtask(id));
        item.querySelector('.btn-delete-subtask').addEventListener('click', () => deleteSubtask(id));
    });
}

// DomUtils에 escapeHtml이 없을 경우를 대비해 TextUtils.escapeHtml 사용 권장
// 하지만 task-modal.js에서 DomUtils만 임포트하고 있으므로 확인 필요

function initQuill() {
    if (!quillInstance && document.getElementById('description-editor')) {
        quillInstance = new window.Quill('#description-editor', {
            theme: 'snow',
            placeholder: '메모를 입력하세요 (서식 적용 가능)',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                ]
            }
        });
        quillInstance.on('text-change', function () {
            const html = quillInstance.root.innerHTML;
            document.getElementById('description').value = html === '<p><br></p>' ? '' : html;
        });
    }
}

export function openTaskModal(task = null) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');

    populateCategoryDropdowns();
    initQuill();

    if (task) {
        modalTitle.textContent = task.id ? '업무 수정' : '새 업무 추가';
        document.getElementById('taskId').value = task.id || '';
        document.getElementById('category1').value = task.category1;

        setTimeout(() => {
            updateSubCategories();
            if (task.category2) document.getElementById('category2').value = task.category2;
            setTimeout(() => {
                updateDetailCategories();
                if (task.category3) document.getElementById('category3').value = task.category3;
            }, 100);
        }, 100);

        document.getElementById('taskName').value = task.taskName;
        document.getElementById('startDate').value = task.startDate;
        document.getElementById('endDate').value = task.endDate;
        document.getElementById('status').value = task.status;
        document.getElementById('priority').value = task.priority || 'middle';
        document.getElementById('description').value = task.description || '';
        if (quillInstance) {
            quillInstance.root.innerHTML = task.description || '';
        }

        localSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
        renderSubtasks();
    } else {
        modalTitle.textContent = '새 업무 추가';
        document.getElementById('taskId').value = '';
        document.getElementById('taskForm').reset();
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('status').value = 'pending';
        document.getElementById('priority').value = 'middle';
        document.getElementById('description').value = '';
        if (quillInstance) {
            quillInstance.setContents([]);
        }

        localSubtasks = [];
        renderSubtasks();
    }

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

export function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

export function populateCategoryDropdowns() {
    const select = document.getElementById('category1');
    const mains = ArrayUtils.unique(AppState.categories.map(c => c.mainCategory));
    select.innerHTML = '<option value="">선택하세요</option>';
    mains.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        select.appendChild(opt);
    });
}

export function updateSubCategories() {
    const cat1 = document.getElementById('category1').value;
    const cat2Select = document.getElementById('category2');
    const cat3Select = document.getElementById('category3');
    cat2Select.innerHTML = '<option value="">선택하세요</option>';
    cat3Select.innerHTML = '<option value="">선택하세요</option>';
    if (!cat1) return;

    ArrayUtils.unique(AppState.categories.filter(c => c.mainCategory === cat1 && c.subCategory).map(c => c.subCategory))
        .forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            cat2Select.appendChild(opt);
        });
}

export function updateDetailCategories() {
    const cat1 = document.getElementById('category1').value;
    const cat2 = document.getElementById('category2').value;
    const cat3Select = document.getElementById('category3');
    cat3Select.innerHTML = '<option value="">선택하세요</option>';
    if (!cat1 || !cat2) return;

    ArrayUtils.unique(AppState.categories.filter(c => c.mainCategory === cat1 && c.subCategory === cat2 && c.detailCategory).map(c => c.detailCategory))
        .forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            cat3Select.appendChild(opt);
        });
}

export async function saveTask(event) {
    event.preventDefault();

    const taskId = document.getElementById('taskId').value;
    const savedCategory1 = document.getElementById('category1').value;
    const savedCategory2 = document.getElementById('category2').value;
    const savedCategory3 = document.getElementById('category3').value;

    const taskData = {
        category1: savedCategory1,
        category2: savedCategory2 || '',
        category3: savedCategory3 || '',
        taskName: document.getElementById('taskName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        description: document.getElementById('description').value,
        subtasks: localSubtasks,
    };

    if (taskData.startDate && taskData.endDate) {
        if (new Date(taskData.startDate) > new Date(taskData.endDate)) {
            alert('종료 날짜는 시작 날짜보다 이후여야 합니다.');
            return;
        }
    }

    if (taskId) {
        try {
            await window.updateTask(taskId, taskData);
            closeTaskModal();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('업무 수정 중 오류가 발생했습니다.');
        }
    } else {
        try {
            await window.createTask(taskData);
            closeTaskModal();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('업무 생성 중 오류가 발생했습니다.');
        }

        const today = KoreanTime.today();
        document.getElementById('taskName').value = '';
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        document.getElementById('status').value = 'pending';
        document.getElementById('description').value = '';
        if (quillInstance) {
            quillInstance.setContents([]);
        }
        document.getElementById('category1').value = savedCategory1;
        updateSubCategories();
        document.getElementById('category2').value = savedCategory2;
        updateDetailCategories();
        document.getElementById('category3').value = savedCategory3;
        document.getElementById('taskName').focus();
    }
}

export function copyTask(task) {
    openTaskModal({ ...task, id: '', taskName: task.taskName + ' (복사본)', createdAt: undefined });
}
