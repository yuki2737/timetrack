# timetrack

React + TypeScript + Vite で作成した学習時間トラッキングアプリです。

## 現在の接続状態（GitHub / Firebase）

- ローカルは Git リポジトリとして初期化済みです。
- `origin` リモートは `https://github.com/yuki2737/timetrack.git` に接続されています。
- Firebase プロジェクトは `my-app-3bc93` を使用しています。
- Hosting ターゲット `timetrack` はサイト `timetrack48367` に紐付いています。

## 自動デプロイ（GitHub Actions -> Firebase Hosting）

このリポジトリには `.github/workflows/deploy-firebase-hosting.yml` が含まれています。

- 実行トリガー: `main` ブランチへの push（手動実行 `workflow_dispatch` も可）
- ビルド: `npm ci` + `npm run build`
- デプロイ先: Firebase Hosting の `live` チャンネル

### 必要な GitHub Secrets

自動デプロイを動かすには、GitHub リポジトリに以下の Secret が必要です。

- `FIREBASE_SERVICE_ACCOUNT_MY_APP_3BC93`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

値には、Firebase のサービスアカウントキー（JSON）の内容をそのまま全文貼り付けてください。
`VITE_...` 系は Firebase Console -> Project settings -> Your apps の値をそのまま設定してください。

## ローカル開発

```bash
npm install
npm run dev
```

## ローカルから手動デプロイ

```bash
npm run build
npm run deploy:hosting
```
