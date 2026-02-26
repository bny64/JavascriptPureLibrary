const DataManager = require('../models/dataManager');

function memoRoutes(req, res, pathname) {
  if (pathname === '/api/memos') {
    if (req.method === 'GET') {
      const data = DataManager.memos.read();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data.memos));
      return true;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const newMemo = JSON.parse(body);
        newMemo.id = Date.now().toString();
        newMemo.createdAt = new Date().toISOString();

        const data = DataManager.memos.read();
        data.memos.unshift(newMemo);
        DataManager.memos.write(data);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newMemo));
      });
      return true;
    }
  }

  if (pathname.startsWith('/api/memos/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const updates = JSON.parse(body);
        const data = DataManager.memos.read();
        const index = data.memos.findIndex(m => m.id === id);

        if (index !== -1) {
          data.memos[index] = { ...data.memos[index], ...updates, updatedAt: new Date().toISOString() };
          DataManager.memos.write(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data.memos[index]));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Memo not found' }));
        }
      });
      return true;
    }

    if (req.method === 'DELETE') {
      const data = DataManager.memos.read();
      const index = data.memos.findIndex(m => m.id === id);

      if (index !== -1) {
        data.memos.splice(index, 1);
        DataManager.memos.write(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Memo not found' }));
      }
      return true;
    }
  }

  return false;
}

module.exports = memoRoutes;
