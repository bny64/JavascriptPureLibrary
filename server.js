const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'tasks.json');
const CATEGORY_FILE = path.join(__dirname, 'categories.json');
const HOLIDAY_FILE = path.join(__dirname, 'holidays.json'); // New holiday file constant
const LOG_FILE = path.join(__dirname, 'logs.json');

// 데이터 파일 초기화
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: [] }, null, 2));
}

if (!fs.existsSync(CATEGORY_FILE)) {
    fs.writeFileSync(CATEGORY_FILE, JSON.stringify({ categories: [] }, null, 2));
}

// Holiday file initialization - create empty if not exists (though we've created it already)
if (!fs.existsSync(HOLIDAY_FILE)) {
    fs.writeFileSync(HOLIDAY_FILE, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify({ logs: [] }, null, 2));
}

// 데이터 읽기
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { tasks: [] };
    }
}

// 데이터 쓰기
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 로그 읽기
function readLogs() {
    try {
        const data = fs.readFileSync(LOG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { logs: [] };
    }
}

// 로그 쓰기
function writeLog(action, taskId, taskName, details = '') {
    try {
        const data = readLogs();
        const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            taskId,
            taskName,
            action,
            details,
            timestamp: new Date().toISOString()
        };
        data.logs.unshift(newLog); // 최신 로그가 앞으로 오게 추가
        // 로그 개수 제한 (예: 최근 500개만 유지)
        if (data.logs.length > 500) {
            data.logs = data.logs.slice(0, 500);
        }
        fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing log:', error);
    }
}

// MIME 타입 매핑
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API 엔드포인트
    if (pathname === '/api/tasks' && req.method === 'GET') {
        const data = readData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.tasks));
        return;
    }

    // 로그 API
    if (pathname === '/api/logs' && req.method === 'GET') {
        const data = readLogs();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.logs));
        return;
    }

    // 휴일 API
    if (pathname === '/api/holidays' && req.method === 'GET') {
        try {
            const data = fs.readFileSync(HOLIDAY_FILE, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data); // Directly return the content as it's already a JSON object
        } catch (error) {
            console.error('Error reading holiday file:', error);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({})); // Return empty object on error
        }
        return;
    }

    // 카테고리 API
    if (pathname === '/api/categories' && req.method === 'GET') {
        try {
            const data = fs.readFileSync(CATEGORY_FILE, 'utf8');
            const categories = JSON.parse(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(categories.categories));
        } catch (error) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
        }
        return;
    }

    if (pathname === '/api/categories' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const category = JSON.parse(body);
            const data = JSON.parse(fs.readFileSync(CATEGORY_FILE, 'utf8'));
            category.id = Date.now().toString();
            data.categories.push(category);
            fs.writeFileSync(CATEGORY_FILE, JSON.stringify(data, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(category));
        });
        return;
    }

    if (pathname.startsWith('/api/categories/') && req.method === 'PUT') {
        const id = pathname.split('/')[3];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const updatedCategory = JSON.parse(body);
            const data = JSON.parse(fs.readFileSync(CATEGORY_FILE, 'utf8'));
            const index = data.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                data.categories[index] = { ...data.categories[index], ...updatedCategory, id };
                fs.writeFileSync(CATEGORY_FILE, JSON.stringify(data, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data.categories[index]));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Category not found' }));
            }
        });
        return;
    }

    if (pathname.startsWith('/api/categories/') && req.method === 'DELETE') {
        const id = pathname.split('/')[3];
        const data = JSON.parse(fs.readFileSync(CATEGORY_FILE, 'utf8'));
        const index = data.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            data.categories.splice(index, 1);
            fs.writeFileSync(CATEGORY_FILE, JSON.stringify(data, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Category not found' }));
        }
        return;
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const task = JSON.parse(body);
            const data = readData();
            task.id = Date.now().toString();
            task.createdAt = new Date().toISOString();
            data.tasks.push(task);
            writeData(data);
            writeLog('등록', task.id, task.taskName); // 로그 기록
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(task));
        });
        return;
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'PUT') {
        const id = pathname.split('/')[3];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const updatedTask = JSON.parse(body);
            const data = readData();
            const index = data.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                const oldTask = { ...data.tasks[index] };
                data.tasks[index] = { ...data.tasks[index], ...updatedTask, id };
                const newTask = data.tasks[index];
                
                // 변경 사항 비교 및 상세 메시지 생성
                const fieldMap = {
                    taskName: '업무명',
                    startDate: '시작 날짜',
                    endDate: '종료 날짜',
                    status: '진행 상태',
                    priority: '우선순위',
                    category1: '대분류',
                    category2: '중분류',
                    category3: '소분류',
                    description: '설명',
                    importantMemo: '중요 메모'
                };

                const priorityMap = {
                    'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
                };

                const changes = [];
                for (const key in fieldMap) {
                    let oldVal = oldTask[key] || '';
                    let newVal = newTask[key] || '';

                    if (oldVal !== newVal) {
                        // 우선순위 값 한글화
                        if (key === 'priority') {
                            oldVal = priorityMap[oldVal] || oldVal;
                            newVal = priorityMap[newVal] || newVal;
                        }
                        
                        let tag = '';
                        if (!oldVal && newVal) tag = '{NEW}';
                        else if (oldVal && newVal) tag = '{UPDATE}';
                        else if (oldVal && !newVal) tag = '{DELETE}';

                        if (tag === '{NEW}') {
                            changes.push(`${tag} [${fieldMap[key]}] ${newVal}`);
                        } else if (tag === '{UPDATE}') {
                            changes.push(`${tag} [${fieldMap[key]}] ${oldVal} → ${newVal}`);
                        } else if (tag === '{DELETE}') {
                            changes.push(`${tag} [${fieldMap[key]}] ${oldVal} 삭제됨`);
                        }
                    }
                }

                const details = changes.join(', ');
                writeData(data);
                writeLog('수정', id, newTask.taskName, details); // 상세 내용 포함하여 로그 기록
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data.tasks[index]));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Task not found' }));
            }
        });
        return;
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
        const id = pathname.split('/')[3];
        const data = readData();
        const index = data.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const taskName = data.tasks[index].taskName; // 삭제 전 이름 보관
            data.tasks.splice(index, 1);
            writeData(data);
            writeLog('삭제', id, taskName); // 로그 기록
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Task not found' }));
        }
        return;
    }

    // 정적 파일 제공
    let filePath = pathname === '/' ? './index.html' : '.' + pathname;
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Data file: ${DATA_FILE}`);
});
