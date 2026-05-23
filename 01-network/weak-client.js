// 弱いクライアント: HTTP で password を送る

const http = require('http');

const data = JSON.stringify({ user: 'alice', password: 'p@ss' });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
}, res => {
  res.on('data', chunk => process.stdout.write(chunk));
});

req.write(data);
req.end();
