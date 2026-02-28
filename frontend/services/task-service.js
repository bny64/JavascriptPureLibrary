// services/task-service.js
import { API } from '../api/api.js';
import { AppState } from '../state/app-state.js';
import { EventBus } from '../utils/event-bus.js';

export const TaskService = {
  async loadTasks() {
    try {
      const response = await API.tasks.getAll();
      // 백엔드가 { tasks: [], totalCount: ... } 형태를 반환하므로 배열만 추출
      AppState.tasks = response.tasks || [];
      EventBus.publish('tasks-updated', AppState.tasks);
      return AppState.tasks;
    } catch (error) {
      console.error('업무 목록 로딩 실패:', error);
      throw error;
    }
  },

  async createTask(task) {
    await API.tasks.create(task);
    return this.loadTasks();
  },

  async updateTask(id, updates) {
    await API.tasks.update(id, updates);
    return this.loadTasks();
  },

  async deleteTask(id) {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) return;
    await API.tasks.delete(id);
    return this.loadTasks();
  },

  async archiveOldTasks() {
    if (!confirm('완료된 지 30일이 지난 업무들을 별도 보관소로 이동하시겠습니까? 이동된 업무는 현재 목록에서 제외되며 통계에는 포함되지 않습니다.')) return;
    try {
      const result = await API.tasks.archive();
      if (result.count > 0) {
        alert(`${result.count}건의 업무가 보관되었습니다.`);
        return this.loadTasks();
      } else {
        alert('보관할 업무가 없습니다 (최근 30일 이내 완료된 업무만 있거나 완료 업무가 없습니다).');
      }
    } catch (error) {
      console.error('Error archiving tasks:', error);
      alert('업무 보관 중 오류가 발생했습니다.');
    }
  },

  async restoreTask(id) {
    try {
      const result = await API.tasks.restore(id);
      if (result.success) {
        return this.loadTasks();
      }
    } catch (error) {
      console.error('Error restoring task:', error);
      alert('업무 복구 중 오류가 발생했습니다.');
    }
  },

  async restoreAllTasks() {
    if (!confirm('보관함의 모든 업무를 활성 목록으로 복구하시겠습니까?')) return;
    try {
      const result = await API.tasks.restoreAll();
      if (result.success) {
        alert(`${result.count}건의 업무가 복구되었습니다.`);
        return this.loadTasks();
      }
    } catch (error) {
      console.error('Error restoring all tasks:', error);
      alert('전체 업무 복구 중 오류가 발생했습니다.');
    }
  },

  async loadArchivedTasks() {
    try {
      return await API.archive.getAll();
    } catch (error) {
      console.error('Error loading archived tasks:', error);
      return [];
    }
  }
};
