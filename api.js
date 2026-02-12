// api.js - API 통신 모듈

const API = {
    // 기본 URL
    baseURL: '',
    
    // Tasks API
    tasks: {
        // 모든 업무 가져오기
        getAll: async function() {
            try {
                const response = await fetch(`${API.baseURL}/api/tasks`);
                return await response.json();
            } catch (error) {
                console.error('Error loading tasks:', error);
                return [];
            }
        },
        
        // 업무 생성
        create: async function(taskData) {
            try {
                const response = await fetch(`${API.baseURL}/api/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                return await response.json();
            } catch (error) {
                console.error('Error creating task:', error);
                throw error;
            }
        },
        
        // 업무 수정
        update: async function(id, updates) {
            try {
                const response = await fetch(`${API.baseURL}/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                return await response.json();
            } catch (error) {
                console.error('Error updating task:', error);
                throw error;
            }
        },
        
        // 업무 삭제
        delete: async function(id) {
            try {
                const response = await fetch(`${API.baseURL}/api/tasks/${id}`, {
                    method: 'DELETE'
                });
                return await response.json();
            } catch (error) {
                console.error('Error deleting task:', error);
                throw error;
            }
        }
    },
    
    // Categories API
    categories: {
        // 모든 분류 가져오기
        getAll: async function() {
            try {
                const response = await fetch(`${API.baseURL}/api/categories`);
                return await response.json();
            } catch (error) {
                console.error('Error loading categories:', error);
                return [];
            }
        },
        
        // 분류 생성
        create: async function(categoryData) {
            try {
                const response = await fetch(`${API.baseURL}/api/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoryData)
                });
                return await response.json();
            } catch (error) {
                console.error('Error creating category:', error);
                throw error;
            }
        },
        
        // 분류 수정
        update: async function(id, updates) {
            try {
                const response = await fetch(`${API.baseURL}/api/categories/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                return await response.json();
            } catch (error) {
                console.error('Error updating category:', error);
                throw error;
            }
        },
        
        // 분류 삭제
        delete: async function(id) {
            try {
                const response = await fetch(`${API.baseURL}/api/categories/${id}`, {
                    method: 'DELETE'
                });
                return await response.json();
            } catch (error) {
                console.error('Error deleting category:', error);
                throw error;
            }
        }
    }
};
