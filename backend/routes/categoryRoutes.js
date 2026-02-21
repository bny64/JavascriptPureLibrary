const DataManager = require('../models/dataManager');

const categoryRoutes = (req, res, pathname) => {
    // 모든 카테고리 가져오기
    if (pathname === '/api/categories' && req.method === 'GET') {
        const data = DataManager.categories.read();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.categories));
        return true;
    }

    // 카테고리 생성
    if (pathname === '/api/categories' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const category = JSON.parse(body);
            const data = DataManager.categories.read();
            category.id = Date.now().toString();
            data.categories.push(category);
            DataManager.categories.write(data);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(category));
        });
        return true;
    }

    // 카테고리 수정
    if (pathname.startsWith('/api/categories/') && req.method === 'PUT') {
        const id = pathname.split('/')[3];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const updatedCategory = JSON.parse(body);
            const data = DataManager.categories.read();
            const index = data.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                data.categories[index] = { ...data.categories[index], ...updatedCategory, id };
                DataManager.categories.write(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data.categories[index]));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Category not found' }));
            }
        });
        return true;
    }

    // 카테고리 삭제
    if (pathname.startsWith('/api/categories/') && req.method === 'DELETE') {
        const id = pathname.split('/')[3];
        const data = DataManager.categories.read();
        const index = data.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            data.categories.splice(index, 1);
            DataManager.categories.write(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Category not found' }));
        }
        return true;
    }

    return false;
};

module.exports = categoryRoutes;
