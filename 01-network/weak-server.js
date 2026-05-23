// 弱いコード: HTTP (TLSなし) でログイン情報を受け取る
// → ネットワーク経路上の誰でも中身を読める

const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      console.log('受信:', body); // 例: {"user":"alice","password":"p@ss"}
      res.end('ok\n');
    });
  } else {
    res.end('hello\n');
  }
});

server.listen(3000, () => console.log('HTTP on http://localhost:3000'));
