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
    // 루트 경로면 index.html로 유도
    let filePath = pathname === '/' ? './index.html' : '.' + pathname;
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
