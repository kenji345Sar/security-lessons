// 直したコード: HTTPS (TLS) で受け取る
// → 中身が暗号化され、経路上では読めない

const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync(__dirname + '/cert/key.pem'),
  cert: fs.readFileSync(__dirname + '/cert/cert.pem'),
};

const server = https.createServer(options, (req, res) => {
  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      console.log('受信:', body);
      res.end('ok\n');
    });
  } else {
    res.end('hello\n');
  }
});

server.listen(3443, () => console.log('HTTPS on https://localhost:3443'));
