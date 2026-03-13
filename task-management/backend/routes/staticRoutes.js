const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

const staticRoutes = (req, res, pathname) => {
    // 프로젝트 루트 경로 설정 (task-management 폴더 기준)
    const taskMgmtRoot = path.join(__dirname, '..', '..');
    const projectRoot = path.join(taskMgmtRoot, '..');

    let filePath;
    if (pathname.startsWith('/vue-project/')) {
        // vue-project 요청은 상위 폴더에서 찾음
        filePath = path.join(projectRoot, pathname);
    } else {
        // 나머지는 task-management 폴더 내에서 찾음
        filePath = pathname === '/' ? path.join(taskMgmtRoot, 'index.html') : path.join(taskMgmtRoot, pathname);
    }

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // 보안: 상위 디렉토리 접근 차단 (간단한 예시)
    if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return true;
    }

    try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
            return true;
        }
    } catch (error) {
        console.error(`Error serving static file ${filePath}:`, error);
    }

    return false; // 파일을 찾지 못함
};

module.exports = staticRoutes;
