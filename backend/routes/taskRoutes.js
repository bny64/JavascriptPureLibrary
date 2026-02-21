const DataManager = require('../models/dataManager');

const taskRoutes = (req, res, pathname) => {
    // 모든 업무 가져오기
    if (pathname === '/api/tasks' && req.method === 'GET') {
        const data = DataManager.tasks.read();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.tasks));
        return true;
    }

    // 업무 생성
    if (pathname === '/api/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const task = JSON.parse(body);
            const data = DataManager.tasks.read();
            task.id = Date.now().toString();
            task.createdAt = new Date().toISOString();
            data.tasks.push(task);
            DataManager.tasks.write(data);
            DataManager.logs.add('등록', task.id, task.taskName);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(task));
        });
        return true;
    }

    // 업무 수정
    if (pathname.startsWith('/api/tasks/') && req.method === 'PUT') {
        const id = pathname.split('/')[3];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const updatedTask = JSON.parse(body);
            const data = DataManager.tasks.read();
            const index = data.tasks.findIndex(t => t.id === id);
            
            if (index !== -1) {
                const oldTask = { ...data.tasks[index] };
                data.tasks[index] = { ...data.tasks[index], ...updatedTask, id };
                const newTask = data.tasks[index];
                
                // 변경 사항 상세 생성
                const details = generateTaskChangeDetails(oldTask, newTask);
                DataManager.tasks.write(data);
                DataManager.logs.add('수정', id, newTask.taskName, details);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newTask));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Task not found' }));
            }
        });
        return true;
    }

    // 업무 삭제
    if (pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
        const id = pathname.split('/')[3];
        const data = DataManager.tasks.read();
        const index = data.tasks.findIndex(t => t.id === id);
        
        if (index !== -1) {
            const taskName = data.tasks[index].taskName;
            data.tasks.splice(index, 1);
            DataManager.tasks.write(data);
            DataManager.logs.add('삭제', id, taskName);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Task not found' }));
        }
        return true;
    }

    return false; // 매칭되는 라우트 없음
};

// 헬퍼 함수: 업무 수정 상세 내용 생성
function generateTaskChangeDetails(oldTask, newTask) {
    const fieldMap = {
        taskName: '업무명', startDate: '시작 날짜', endDate: '종료 날짜',
        status: '진행 상태', priority: '우선순위', category1: '대분류',
        category2: '중분류', category3: '소분류', description: '설명', importantMemo: '중요 메모'
    };
    const priorityMap = { 'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음' };

    const changes = [];
    for (const key in fieldMap) {
        let oldVal = oldTask[key] || '';
        let newVal = newTask[key] || '';

        if (oldVal !== newVal) {
            if (key === 'priority') {
                oldVal = priorityMap[oldVal] || oldVal;
                newVal = priorityMap[newVal] || newVal;
            }
            
            let tag = '';
            if (!oldVal && newVal) tag = '{NEW}';
            else if (oldVal && newVal) tag = '{UPDATE}';
            else if (oldVal && !newVal) tag = '{DELETE}';

            if (tag === '{NEW}') changes.push(`${tag} [${fieldMap[key]}] ${newVal}`);
            else if (tag === '{UPDATE}') changes.push(`${tag} [${fieldMap[key]}] ${oldVal} → ${newVal}`);
            else if (tag === '{DELETE}') changes.push(`${tag} [${fieldMap[key]}] ${oldVal} 삭제됨`);
        }
    }
    return changes.join(', ');
}

module.exports = taskRoutes;
