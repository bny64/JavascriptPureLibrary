const fs = require('fs');
const path = require('path');

// 데이터 파일 경로 설정
const BASE_DATA_PATH = path.join(__dirname, '..', 'data');
const FILES = {
    TASKS: path.join(BASE_DATA_PATH, 'tasks.json'),
    CATEGORIES: path.join(BASE_DATA_PATH, 'categories.json'),
    LOGS: path.join(BASE_DATA_PATH, 'logs.json'),
    HOLIDAYS: path.join(BASE_DATA_PATH, 'holidays.json')
};

// 파일 초기화 로직
function initFiles() {
    if (!fs.existsSync(BASE_DATA_PATH)) {
        fs.mkdirSync(BASE_DATA_PATH, { recursive: true });
    }

    if (!fs.existsSync(FILES.TASKS)) {
        fs.writeFileSync(FILES.TASKS, JSON.stringify({ tasks: [] }, null, 2));
    }
    if (!fs.existsSync(FILES.CATEGORIES)) {
        fs.writeFileSync(FILES.CATEGORIES, JSON.stringify({ categories: [] }, null, 2));
    }
    if (!fs.existsSync(FILES.LOGS)) {
        fs.writeFileSync(FILES.LOGS, JSON.stringify({ logs: [] }, null, 2));
    }
    if (!fs.existsSync(FILES.HOLIDAYS)) {
        fs.writeFileSync(FILES.HOLIDAYS, JSON.stringify({}, null, 2));
    }
}

// 공통 JSON 읽기 함수
function readJSON(filePath, defaultData = {}) {
    try {
        if (!fs.existsSync(filePath)) return defaultData;
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultData;
    }
}

// 공통 JSON 쓰기 함수
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

const DataManager = {
    // 업무 관련
    tasks: {
        read: () => readJSON(FILES.TASKS, { tasks: [] }),
        write: (data) => writeJSON(FILES.TASKS, data)
    },

    // 카테고리 관련
    categories: {
        read: () => readJSON(FILES.CATEGORIES, { categories: [] }),
        write: (data) => writeJSON(FILES.CATEGORIES, data)
    },

    // 로그 관련
    logs: {
        read: () => readJSON(FILES.LOGS, { logs: [] }),
        write: (data) => writeJSON(FILES.LOGS, data),
        // 로그 기록 편의 함수
        add: (action, taskId, taskName, details = '') => {
            const data = DataManager.logs.read();
            const newLog = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                taskId,
                taskName,
                action,
                details,
                timestamp: new Date().toISOString()
            };
            data.logs.unshift(newLog);
            if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);
            return DataManager.logs.write(data);
        }
    },

    // 휴일 관련
    holidays: {
        read: () => readJSON(FILES.HOLIDAYS, {})
    }
};

// 모듈 초기화 실행
initFiles();

module.exports = DataManager;
