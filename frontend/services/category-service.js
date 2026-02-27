// services/category-service.js
import { API } from '../api/api.js';
import { AppState } from '../state/app-state.js';
import { EventBus } from '../utils/event-bus.js';
import { CategoryUI } from '../ui/category-ui.js';

export const CategoryService = {
  async loadCategories() {
    try {
      AppState.categories = await API.categories.getAll();
      EventBus.publish('categories-updated', AppState.categories);
      return AppState.categories;
    } catch (error) {
      console.error('카테고리 로딩 실패:', error);
      throw error;
    }
  },

  async createCategory(category) {
    await API.categories.create(category);
    return this.loadCategories();
  },

  async updateCategory(id, updates) {
    await API.categories.update(id, updates);
    return this.loadCategories();
  },

  async deleteCategory(id) {
    if (!confirm('정말로 이 분류를 삭제하시겠습니까?')) return;
    await API.categories.delete(id);
    return this.loadCategories();
  }
};
