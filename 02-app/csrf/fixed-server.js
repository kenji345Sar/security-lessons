// 直したコード: CSRF トークン検証 + SameSite=Strict Cookie
// → 他サイトからの POST を弾く

const http = require('http');
const crypto = require('crypto');

const sessions = new Map(); // sid -> { user, balance, csrf }

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map(s => s.trim().split('='))
      .filter(p => p[0])
  );
}
const getSession = req => sessions.get(parseCookies(req).sid);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/login') {
    const sid = crypto.randomBytes(16).toString('hex');
    const csrf = crypto.randomBytes(16).toString('hex'); // ★ CSRFトークン発行
    sessions.set(sid, { user: 'alice', balance: 1000, csrf });
    // ★ SameSite=Strict: 他サイトからのリクエストには Cookie を送らない
    res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; Path=/; SameSite=Strict`);
    res.writeHead(302, { Location: '/' });
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/transfer') {
    const sess = getSession(req);
    if (!sess) { res.writeHead(401); return res.end('not logged in'); }
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      const p = new URLSearchParams(body);
      // ★ トークン検証
      if (p.get('csrf') !== sess.csrf) {
        res.writeHead(403);
        return res.end('CSRF token mismatch');
      }
      const amount = Number(p.get('amount'));
      const to = p.get('to');
      sess.balance -= amount;
      console.log(`[transfer] ${amount}円 → ${to}, 残高: ${sess.balance}`);
      res.end(`transferred ${amount} to ${to}`);
    });
    return;
  }

  const sess = getSession(req);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!sess) {
    return res.end(`<!DOCTYPE html><html lang="ja"><body>
      <h1>銀行サイト (fixed)</h1>
      <form method="POST" action="/login">
        <button>alice としてログイン</button>
      </form>
    </body></html>`);
  }
  res.end(`<!DOCTYPE html><html lang="ja"><body>
    <h1>こんにちは ${sess.user}</h1>
    <p>残高: <b>${sess.balance}</b> 円</p>
    <h2>送金</h2>
    <form method="POST" action="/transfer">
      <input type="hidden" name="csrf" value="${sess.csrf}">
      宛先: <input name="to" value="bob">
      金額: <input name="amount" type="number" value="100">
      <button>送金</button>
    </form>
  </body></html>`);
});

server.listen(4000, () => console.log('fixed target: http://localhost:4000'));
