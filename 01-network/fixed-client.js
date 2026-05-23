// 直したクライアント: HTTPS で password を送る
// 自己署名証明書なので ca を渡して検証 (本番では公的CA証明書なので不要)

const https = require('https');
const fs = require('fs');

const data = JSON.stringify({ user: 'alice', password: 'p@ss' });

const req = https.request({
  hostname: 'localhost',
  port: 3443,
  path: '/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  ca: fs.readFileSync(__dirname + '/cert/cert.pem'), // 自己署名のため明示
}, res => {
  res.on('data', chunk => process.stdout.write(chunk));
});

req.write(data);
req.end();
