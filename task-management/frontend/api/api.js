// api/api.js - API 통신 모듈

const BASE_URL = '';

async function request(url, options = {}) {
    const response = await fetch(BASE_URL + url, options);
    return response.json();
}

export const API = {
    tasks: {
        getAll: () => request('/api/tasks').catch(e => { console.error(e); return []; }),
        create: (data) => request('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id, data) => request(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        delete: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
        archive: () => request('/api/tasks/archive', { method: 'POST' }),
        restore: (id) => request('/api/tasks/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }),
        restoreAll: () => request('/api/tasks/restore-all', { method: 'POST' })
    },

    archive: {
        getAll: () => request('/api/archive').catch(e => { console.error(e); return []; })
    },

    categories: {
        getAll: () => request('/api/categories').catch(e => { console.error(e); return []; }),
        create: (data) => request('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id, data) => request(`/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        delete: (id) => request(`/api/categories/${id}`, { method: 'DELETE' })
    },

    logs: {
        getAll: () => request('/api/logs').catch(e => { console.error(e); return []; })
    },

    holidays: {
        getAll: () => request('/api/holidays').catch(e => { console.error(e); return {}; })
    },

    memos: {
        getAll: () => request('/api/memos').catch(e => { console.error(e); return []; }),
        create: (data) => request('/api/memos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id, data) => request(`/api/memos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        delete: (id) => request(`/api/memos/${id}`, { method: 'DELETE' })
    }
};
