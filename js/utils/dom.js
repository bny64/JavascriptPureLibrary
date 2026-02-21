// utils/dom.js - DOM 유틸리티

export const DomUtils = {
    createElement(tag, className, textContent) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent !== undefined && textContent !== null) el.textContent = textContent;
        return el;
    },

    scrollToTop(element) {
        if (element) element.scrollTop = 0;
        else window.scrollTo(0, 0);
    }
};

export const TextUtils = {
    truncate(text, maxLength) {
        if (!text) return '';
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export const ArrayUtils = {
    unique(array) {
        return [...new Set(array)];
    },

    groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }
};

export const StorageUtils = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }
};
