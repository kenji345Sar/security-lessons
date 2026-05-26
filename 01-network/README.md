# 01-network: TLS / HTTPS

## 何を守るか
通信の **中身** を、ネットワーク経路上の第三者から守る。

## 何から守るか
- **盗聴**: パスワード・トークン・個人情報がそのまま読まれる
- **改ざん**: レスポンスを途中で書き換えられる
- **なりすまし**: 偽サーバーに接続させられる (中間者攻撃 / MITM)

## 仕組み (ざっくり)
TLS は 2 つを同時にやる。

1. **暗号化** — 経路上の中身を読めなくする
2. **証明書による身元確認** — 接続先が本物のサーバーであることを保証

両方そろわないと意味がない。暗号化だけだと「偽サーバーと暗号通信」をしてしまう。

---

> **本サンプルの実行環境**: `node weak-server.js` は Mac 上の Node プロセス、`weak-client.js` も Mac 上の別 Node プロセス。tcpdump は **`-i lo0`（ループバック）** を覗いている。**「サーバ」「クライアント」は同じ Mac の中のプロセス2つ** であり、別マシン同士の通信ではない。本物の別マシン間の TLS 構築は [`infra-lessons/01-package-delivery`](../../infra-lessons/01-package-delivery/) を参照。

---

## 手順

### 1. 弱いコード (HTTP) を動かす

```bash
node weak-server.js
# 別ターミナル
node weak-client.js
```

サーバー側ターミナルに `受信: {"user":"alice","password":"p@ss"}` と表示される。

### 2. 攻撃される様子を見る

別ターミナルで通信を覗く (要 sudo)。

```bash
sudo tcpdump -A -i lo0 'port 3000'
```

その状態でもう一度 `node weak-client.js` を実行すると、
キャプチャに **password がそのまま文字列で見える**。

これがネットワーク経路上の人 (同じ Wi-Fi、ISP、社内ネット担当者など) から
見える状態。

> tcpdump がそもそも何をしていて、OSI のどこを覗いているのかは
> [../notes/tcpdump-and-osi.md](../notes/tcpdump-and-osi.md) 参照。

### 3. 証明書を作る

```bash
mkdir -p cert
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout cert/key.pem -out cert/cert.pem \
  -subj "/CN=localhost"
```

### 4. 直したコード (HTTPS) を動かす

```bash
node fixed-server.js
# 別ターミナル
node fixed-client.js
```

### 5. tcpdump で再度覗く

```bash
sudo tcpdump -A -i lo0 'port 3443'
```

今度は **暗号化された読めないバイト列** しか流れない。
password はキャプチャに現れない。

---

## ポイント

| 項目 | HTTP | HTTPS |
|---|---|---|
| 経路の中身 | 平文 (誰でも読める) | 暗号化 |
| 接続先の正しさ | 確認なし | 証明書で検証 |
| ブラウザ表示 | 「保護されていない通信」 | 鍵マーク |

## よくある間違い

- **HTTPS にしているから安全、と思って証明書検証を切る**
  例: `rejectUnauthorized: false` / `curl -k` / `verify=False`
  → 暗号化はされるが、中間者になりすまされても気づけない。
  自己署名証明書を使うときは `ca:` で明示的に渡す (本サンプルの方式)。

- **ログイン画面だけ HTTPS、他は HTTP**
  → セッション Cookie が HTTP 側で漏れる。サイト全体を HTTPS にする。

- **古い TLS バージョン (1.0 / 1.1) を許可**
  → 既知の脆弱性あり。最低 TLS 1.2、推奨 1.3。
