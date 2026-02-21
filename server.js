const http = require('http');
const url = require('url');

// 라우터 불러오기
const taskRoutes = require('./backend/routes/taskRoutes');
const categoryRoutes = require('./backend/routes/categoryRoutes');
const logRoutes = require('./backend/routes/logRoutes');
const staticRoutes = require('./backend/routes/staticRoutes');

const PORT = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS 및 공통 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight 요청 처리
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 순차적으로 라우터 실행 (매칭되는 것이 있으면 처리 종료)
    // 1. API 라우터
    if (taskRoutes(req, res, pathname)) return;
    if (categoryRoutes(req, res, pathname)) return;
    if (logRoutes(req, res, pathname)) return;

    // 2. 정적 파일 라우터
    if (staticRoutes(req, res, pathname)) return;

    // 3. 모두 실패 시 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  Task Management System Server Started `);
    console.log(`  URL: http://localhost:${PORT}/        `);
    console.log(`========================================`);
});
