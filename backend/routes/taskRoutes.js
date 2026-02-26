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

    // 아카이브 목록 가져오기
    if (pathname === '/api/archive' && req.method === 'GET') {
        const data = DataManager.archive.read();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.archive));
        return true;
    }

    // 업무 아카이빙 (30일 이상 지난 완료 업무)
    if (pathname === '/api/tasks/archive' && req.method === 'POST') {
        const taskData = DataManager.tasks.read();
        const archiveData = DataManager.archive.read();
        const today = new Date();
        const threshold = 30; // 30일

        const toArchive = [];
        const remaining = [];

        taskData.tasks.forEach(task => {
            if (task.status === 'completed' && task.endDate) {
                const endDate = new Date(task.endDate);
                const diffDays = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
                if (diffDays >= threshold) {
                    toArchive.push(task);
                } else {
                    remaining.push(task);
                }
            } else {
                remaining.push(task);
            }
        });

        if (toArchive.length > 0) {
            archiveData.archive = [...archiveData.archive, ...toArchive];
            DataManager.archive.write(archiveData);
            DataManager.tasks.write({ tasks: remaining });
            DataManager.logs.add('보관', 'system', `${toArchive.length}건의 업무가 보관되었습니다.`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ count: toArchive.length }));
        return true;
    }

    return false; // 매칭되는 라우트 없음
};

// 헬퍼 함수: 업무 수정 상세 내용 생성
function generateTaskChangeDetails(oldTask, newTask) {
    const fieldMap = {
        taskName: '업무명', startDate: '시작 날짜', endDate: '종료 날짜',
        status: '진행 상태', priority: '우선순위', category1: '대분류',
        category2: '중분류', category3: '소분류', description: '메모'
    };
    const priorityMap = { 'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음' };
    const statusMap = { 'pending': '대기', 'in-progress': '진행중', 'completed': '완료', 'on-hold': '보류' };

    const changes = [];
    for (const key in fieldMap) {
        let oldVal = oldTask[key] || '';
        let newVal = newTask[key] || '';

        if (oldVal !== newVal) {
            if (key === 'priority') {
                oldVal = priorityMap[oldVal] || oldVal;
                newVal = priorityMap[newVal] || newVal;
            }
            if (key === 'status') {
                oldVal = statusMap[oldVal] || oldVal;
                newVal = statusMap[newVal] || newVal;
            }

            if (key === 'description') {
                if (!oldVal && newVal) changes.push(`{NEW} [메모] 내용이 등록되었습니다.`);
                else if (oldVal && newVal) changes.push(`{UPDATE} [메모] 내용이 수정되었습니다.`);
                else if (oldVal && !newVal) changes.push(`{DELETE} [메모] 내용이 삭제되었습니다.`);
                continue;
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

    // 체크리스트 변경 감지
    const oldSub = JSON.stringify(oldTask.subtasks || []);
    const newSub = JSON.stringify(newTask.subtasks || []);
    if (oldSub !== newSub) {
        const oldS = oldTask.subtasks || [];
        const newS = newTask.subtasks || [];
        const oldDone = oldS.filter(s => s.completed).length;
        const newDone = newS.filter(s => s.completed).length;

        if (oldS.length !== newS.length) {
            changes.push(`{UPDATE} [체크리스트] 항목 개수 변경 (${oldS.length}개 → ${newS.length}개)`);
        } else if (oldDone !== newDone) {
            changes.push(`{UPDATE} [체크리스트] 진행률 변경 (${oldDone}/${oldS.length} → ${newDone}/${newS.length})`);
        } else {
            changes.push(`{UPDATE} [체크리스트] 내용 수정됨`);
        }
    }

    return changes.join(' ||| ');
}

module.exports = taskRoutes;
