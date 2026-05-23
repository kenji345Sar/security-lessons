// 弱いコード: ユーザーが投稿したコメントを「そのまま」HTMLに埋め込む
// → コメントに <script> を書かれると、他人のブラウザでJSが実行される (XSS)

const http = require('http');

const comments = []; // 永続化なし、メモリ保持

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/comment') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      const params = new URLSearchParams(body);
      comments.push(params.get('text'));
      res.writeHead(302, { Location: '/' });
      res.end();
    });
    return;
  }

  // ★ ここがダメ: comments を escape せずに HTML に埋め込んでいる
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><title>掲示板(weak)</title></head>
<body>
  <h1>掲示板</h1>
  <form method="POST" action="/comment">
    <input name="text" placeholder="コメント">
    <button type="submit">投稿</button>
  </form>

  <h2>パスワード入力(本来は別ページ)</h2>
  <form onsubmit="return false">
    <input type="password" id="password" placeholder="パスワード">
  </form>

  <h2>コメント一覧</h2>
  <ul>
    ${comments.map(c => `<li>${c}</li>`).join('')}
  </ul>
</body>
</html>`);
});

server.listen(3001, () => console.log('http://localhost:3001'));
