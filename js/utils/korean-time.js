// utils/korean-time.js - 한국 시간 관련 유틸리티

export const KoreanTime = {
    now() {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (9 * 60 * 60 * 1000));
    },

    toKST(date) {
        if (typeof date === 'string') date = new Date(date);
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (9 * 60 * 60 * 1000));
    },

    today() {
        return this.formatDate(this.now());
    },

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    isSameDay(date1, date2) {
        const d1 = this.toKST(date1);
        const d2 = this.toKST(date2);
        return d1.getFullYear() === d2.getFullYear()
            && d1.getMonth() === d2.getMonth()
            && d1.getDate() === d2.getDate();
    },

    isDateInRange(checkDate, startDate, endDate) {
        const check = new Date(checkDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        check.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return check >= start && check <= end;
    }
};
