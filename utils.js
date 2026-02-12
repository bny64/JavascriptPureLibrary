// utils.js - 유틸리티 함수 모듈

// 한국 시간 관련 함수
const KoreanTime = {
    // 현재 한국 시간 가져오기
    now: function() {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (9 * 60 * 60 * 1000));
    },
    
    // 날짜를 한국 시간으로 변환
    toKST: function(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (9 * 60 * 60 * 1000));
    },
    
    // 오늘 날짜 (YYYY-MM-DD 형식)
    today: function() {
        const date = this.now();
        return this.formatDate(date);
    },
    
    // 날짜 포맷 (YYYY-MM-DD)
    formatDate: function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // 두 날짜가 같은 날인지 비교 (한국 시간 기준)
    isSameDay: function(date1, date2) {
        const d1 = this.toKST(date1);
        const d2 = this.toKST(date2);
        
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    },
    
    // 날짜가 범위 내에 있는지 확인
    isDateInRange: function(checkDate, startDate, endDate) {
        const check = new Date(checkDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        check.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        return check >= start && check <= end;
    }
};

// 텍스트 유틸리티
const TextUtils = {
    // 텍스트 잘라내기
    truncate: function(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    // HTML 이스케이프
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 배열 유틸리티
const ArrayUtils = {
    // 중복 제거
    unique: function(array) {
        return [...new Set(array)];
    },
    
    // 객체 배열에서 특정 키 값으로 그룹화
    groupBy: function(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }
};

// 로컬 스토리지 유틸리티
const StorageUtils = {
    // 값 저장
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },
    
    // 값 가져오기
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    },
    
    // 값 삭제
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }
};

// DOM 유틸리티
const DomUtils = {
    // 요소 생성
    createElement: function(tag, className, textContent) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    },
    
    // 스크롤 최상단으로
    scrollToTop: function(element) {
        if (element) {
            element.scrollTop = 0;
        } else {
            window.scrollTo(0, 0);
        }
    }
};
