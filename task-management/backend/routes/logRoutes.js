const DataManager = require('../models/dataManager');

const logRoutes = (req, res, pathname) => {
    // 모든 활동 로그 가져오기
    if (pathname === '/api/logs' && req.method === 'GET') {
        const data = DataManager.logs.read();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data.logs));
        return true;
    }

    // 휴일 정보 가져오기
    if (pathname === '/api/holidays' && req.method === 'GET') {
        const data = DataManager.holidays.read();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return true;
    }

    return false;
};

module.exports = logRoutes;
