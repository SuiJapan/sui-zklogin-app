## 画面イメージ

![](packages/frontend/docs/0.png)

# ようこそ！Sui zkLogin ハンズオン

このリポジトリは「Google アカウントで zkLogin を体験し、Sui ブロックチェーンで送金 & NFT ミントを試す」ための教材です。  
バックエンド（Bun）とフロントエンド（Vite + React）がセットになっており、データベースは不要です。

---

# zkLogin のキホン

Web3 を触ったことがない人が最初にぶつかる壁は、「ウォレットを作って、シードフレーズや秘密鍵を自分で管理しなければならない」という点です。  
zkLogin は、この手間を無くすために Sui ブロックチェーンが実装した仕組みで、Google などの Web2 アカウントでそのまま Web3 にログインできるようにします。

主な特徴は次のとおりです。（もっと深く知りたい方は [Haruki さんの記事](https://zenn.dev/mashharuki/articles/sui_zklogin_1#1.-openid-connect-(oidc)-%E3%81%A8-json-web-token-(jwt)) も併せてどうぞ）

- **いつもの Google アカウントでログイン**  
  OAuth（OpenID Connect）を利用し、普段使っているアカウントで dApp にサインインできます。
- **秘密鍵の管理が不要**  
  dApp 側でセッションごとに「一時的な鍵ペア」を生成・廃棄するので、利用者は鍵を保存したり覚えたりする必要がありません。
- **プライバシー保持**  
  ゼロ知識証明（ZKP）によって「本人確認済みであること」だけを Sui に伝え、メールアドレスなどの個人情報はブロックチェーンに載りません。

### 仕組みをもう少しだけ詳しく

1. **一時的な鍵ペアと nonce を生成**  
   アプリはセッション開始時に使い捨ての秘密鍵・公開鍵と nonce（使い捨てトークン）を作ります。これでリプレイ攻撃を防止します。

2. **Google のログイン画面で本人確認**  
   OAuth フローを通じてログインすると、Google から署名付きの JWT（JSON Web Token）が返ってきます。これは改ざんできない「本人確認書類」のようなものです。

3. **ソルトと JWT から Sui アドレスを導出**  
   JWT に含まれるユーザー ID（sub）に、バックエンドが管理する「ユーザーソルト」を組み合わせて Sui アドレスを作成します。ソルトのおかげで Google アカウントとウォレットが 1 対 1 で結び付かず、プライバシーが守られます。

4. **ゼロ知識証明を生成**  
   JWT や一時公開鍵、ソルトなどの情報を Mysten Labs の Prover API に送り、ZK 証明を作ってもらいます。これで「有効な JWT を持っていて、その JWT に自分の一時公開鍵が含まれている」と証明できます。

5. **トランザクションに署名して送信**  
   4 で得た ZK 証明と一時鍵を使って、Sui のトランザクションに zkLogin 署名を付け、ネットワークへ送信します。

この流れにより、Google のログイン体験と Sui のウォレット操作が安全に接続され、Web2 と同じくらいの手軽さで Web3 を体験できるようになります。

---

## 1️⃣ 事前インストール（15 分）

| 必須ツール | 推奨バージョン | インストール方法 |
|------------|----------------|------------------|
| Bun | 1.1 以上 | **macOS / Linux**:`curl -fsSL https://bun.sh/install \| bash`<br>**Homebrew:**`brew install oven-sh/bun/bun`<br>**Windows:** PowerShell:`iwr bun.sh/install.ps1 -useb \| iex` |
| Node.js | 18 以上 | [公式サイト](https://nodejs.org/) / nvm など |
| Git | 最新推奨 | すでに入っていることが多いですが、不明な場合はインストール |

インストール後は `bun --version` などで動作確認してください。

---

## 2️⃣ リポジトリの準備

```bash
git clone https://github.com/numa/sui-zklogin-app.git
cd sui-zklogin-app
bun install

# フロントエンド用 .env を作成
cat <<'EOF' > packages/frontend/.env
VITE_GOOGLE_CLIENT_ID=
VITE_REDIRECT_URI=http://localhost:5173/

VITE_SUI_NETWORK_NAME=devnet
VITE_SUI_FULLNODE_URL=https://fullnode.devnet.sui.io
VITE_SUI_DEVNET_FAUCET=https://faucet.devnet.sui.io
VITE_SUI_PROVER_DEV_ENDPOINT=https://prover-dev.mystenlabs.com/v1
EOF

# バックエンド用 .env を作成
cat <<'EOF' > packages/backend/.env
PORT=3001
SEED=
EXPECTED_ISS=https://accounts.google.com
EXPECTED_AUD=
EOF
```

> `bun install` は backend / frontend 両方の依存をまとめて入れます。

上記コマンドで `.env` ファイルが生成されます。空欄のままになっている値（`VITE_GOOGLE_CLIENT_ID` や `SEED` など）は次のステップで入力します。

---

## 3️⃣ Google Cloud のセットアップ（10 分）

Google の ID トークンを使うため、各自で OAuth クライアント ID を発行します。アカウントを持っていなければ先に作成してください。生徒 1 人ずつこの手順を実施します。

- 画像付きの解説はこちら: https://buidl.unchain.tech/Sui/Sui-zklogin/section-1/lesson-1
- [Google Cloud コンソール › API とサービス › 認証情報](https://console.cloud.google.com/apis/credentials) へ移動
- 左メニューの **「OAuth 同意画面」** で「外部」を選び、アプリ名・サポートメールを入力して保存（テストモードでOK）
- 「認証情報を作成」→「OAuth クライアント ID」をクリック
- 設定は次のとおり
  - アプリケーションの種類: **ウェブアプリケーション**
  - 名前: `sui-zklogin`（任意の名前で可）
  - 承認済みのリダイレクト URI: `http://localhost:5173/`
- 作成完了後に表示される **クライアント ID** を控える（クライアントシークレットは今回は不要）
- テストモードのままで問題ありませんが、OAuth を使う Gmail アドレスを **テストユーザー** に登録しておくこと

この ID を `.env` の `VITE_GOOGLE_CLIENT_ID=` に書き込みます。設定を忘れると `redirect_uri_mismatch` エラーになります。

---

## 4️⃣ `.env` ファイルを作成しよう（5 分）

### 4-1. フロントエンド用 (`packages/frontend/.env`)

`VITE_GOOGLE_CLIENT_ID` に Google Cloud で発行したクライアント ID を貼り付けます。その他の値は既定のままで OK です。

```dotenv
VITE_GOOGLE_CLIENT_ID=ここにクライアントIDを貼り付け
VITE_REDIRECT_URI=http://localhost:5173/

# Sui Devnet と接続するための既定値（変更不要）
VITE_SUI_NETWORK_NAME=devnet
VITE_SUI_FULLNODE_URL=https://fullnode.devnet.sui.io
VITE_SUI_DEVNET_FAUCET=https://faucet.devnet.sui.io
VITE_SUI_PROVER_DEV_ENDPOINT=https://prover-dev.mystenlabs.com/v1
```

### 4-2. バックエンド用 (`packages/backend/.env`)

`SEED` と `EXPECTED_AUD`（クライアント ID）を忘れず設定してください。

> **SEED は当日会場で講師が共有します。** 事前に値を決めておく必要はありません。

```dotenv
PORT=3001
SEED=16バイト以上のランダム値(例: fc7b3a5c2d1e09ab45cd6789f01234ff)
EXPECTED_ISS=https://accounts.google.com
EXPECTED_AUD=ここにもクライアントIDを指定
```

- `SEED` は HKDF の根となる秘密値です。漏えいすると他の人も同じソルトを再計算できるため、リポジトリには絶対コミットしないでください。
- `EXPECTED_AUD` を設定すると、指定したクライアント ID 以外からの JWT を拒否します（セキュリティ向上）。

---

## 5️⃣ Sui Devnet を使う理由

デモでは実際に Sui のトランザクション（1 SUI 送金 / NFT ミント）を行います。そのため Devnet のノードと通信します。  
Sui との連携を体験しない場合は、フロントや README にある「送金」「NFT ミント」の部分をスキップしてください。

---

## 6️⃣ アプリを起動しよう

```bash
bun run dev
```

- バックエンド（HKDF サーバー）: `http://localhost:3001/hkdf`
- フロントエンド（React アプリ）: `http://localhost:5173/`

ブラウザで `http://localhost:5173/` を開き、**Sign in with Google** ボタンをクリックすると OAuth が始まります。  
ログイン成功後、ZK 証明の取得 → 送金／NFT ミントボタンが有効になります。

---

## 7️⃣ ハンズオンで体験する流れ

1. `bun run dev` を起動し `http://localhost:5173/` を開く  
2. 「Sign in with Google」→ OAuth フロー → ID トークンを取得  
3. 画面にウォレットアドレスが表示されたら **1 SUI 送金ボタン** を試す  
4. 途中で詰まったら Snackbar（画面右下の通知）とブラウザコンソールのエラーを確認

---

## 8️⃣ 実装コードで流れを把握しよう

このリポジトリのフロントエンドでは、次のファイルが zkLogin フローの中心になっています。

- `packages/frontend/src/hooks/useZKLogin.ts` → ボタン操作からフローを開始するためのカスタムフック。
- `packages/frontend/src/context/GlobalProvider.tsx` → ハンズオン全体の状態管理（鍵生成・JWT 解析・salt 取得・ZK Proof リクエストなど）。
- `packages/frontend/src/hooks/useSui.ts` → 取得した ZK Proof を使って Sui のトランザクションを実行する処理。

ハンズオンでは、この README の手順を踏みつつ上記のファイルを読み進めると、コード上での段取りが理解しやすくなります。

具体的な流れ（コード中のコメントも参照してください）：

1. `useZKLogin.ts` の `startLogin` が呼ばれると、一時鍵・ランダムネス・最新エポックを取得。ここで `nonce` を作る準備が整います。
2. `GlobalProvider.tsx` が `nonce` の準備を検知して Google OAuth へリダイレクト。戻ってきた `id_token` を JWT として解析します。
3. `GlobalProvider.tsx` がバックエンド `/hkdf` へ JWT を送り、Salt を受け取って Sui アドレスを算出。Mysten の Prover API から ZK Proof も取得します。
4. UI の送金ボタンなどから `useSui.ts` の関数を呼び出すと、`genAddressSeed` + `getZkLoginSignature` で zkLogin 署名を生成し、Sui ネットワークへ送信します。

各ファイルには今回追記したコメントで要点を説明しているので、ハンズオン中にコードと README を行き来しながら確認してみてください。

---

## 9️⃣ さらに学びたい人へ

- [zkLogin Integration Guide (公式ドキュメント)](https://docs.sui.io/guides/developer/cryptography/zklogin-integration)
- [Sui Faucet (Devnet)](https://faucet.sui.io/?network=devnet)
- [Mysten zkLogin GitHub](https://github.com/MystenLabs)
- [Haruki さんによるわかりやすい解説記事](https://zenn.dev/mashharuki/articles/sui_zklogin_1#1.-openid-connect-(oidc)-%E3%81%A8-json-web-token-(jwt))

改善提案や質問があれば Issue / PR を歓迎します。楽しいハンズオンにしましょう！
