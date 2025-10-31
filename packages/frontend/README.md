# Sui zkLogin Frontend

このディレクトリには Vite + React で実装されたハンズオン用 UI が入っています。  
環境のセットアップや Google OAuth の準備はリポジトリ直下の `README.md` に詳細をまとめています。

---

## 開発手順メモ

```bash
# 依存インストール（ルートで実行済みなら不要）
bun install

# フロント用 .env を作成（未作成の場合）
cat <<'EOF' > packages/frontend/.env
VITE_GOOGLE_CLIENT_ID=
VITE_REDIRECT_URI=http://localhost:5173/
VITE_SUI_NETWORK_NAME=devnet
VITE_SUI_FULLNODE_URL=https://fullnode.devnet.sui.io
VITE_SUI_DEVNET_FAUCET=https://faucet.devnet.sui.io
VITE_SUI_PROVER_DEV_ENDPOINT=https://prover-dev.mystenlabs.com/v1
EOF

# 開発サーバー
bun run dev
```

`VITE_GOOGLE_CLIENT_ID` には各自で発行した OAuth クライアント ID を入力してください。

---

## 参考

- 画面イメージ: `docs/0.png`
- スタイル: `src/style/`、`src/utils/theme/`
- グローバル状態: `src/context/GlobalProvider.tsx`
