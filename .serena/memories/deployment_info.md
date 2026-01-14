# デプロイメント情報

## デプロイメント環境

このプロジェクトはCloudflare Workersにデプロイされます。5つの環境が設定されています：

| 環境           | アプリ名                     | デプロイ方法   | データベース            | 備考                     |
| -------------- | ---------------------------- | -------------- | ----------------------- | ------------------------ |
| **local**      | `tanstack-start-app-local`   | `pnpm dev`     | `tanstack-test-local`   | ローカル開発環境         |
| **start**      | `tanstack-start-app-start`   | ローカル       | 本番と同じDB名          | ローカルテスト環境       |
| **develop**    | `tanstack-start-app-develop` | GitHub Actions | `tanstack-test-develop` | リモート開発環境         |
| **staging**    | `tanstack-start-app-staging` | GitHub Actions | `tanstack-test-staging` | リモートステージング環境 |
| **production** | `tanstack-start-app`         | GitHub Actions | `tanstack-test`         | 本番環境                 |

## 自動デプロイ（GitHub Actions）

`.github/workflows/deploy.yml` による自動デプロイが設定されています：

- **main ブランチ** → production 環境へ自動デプロイ
- **staging ブランチ** → staging 環境へ自動デプロイ
- **develop ブランチ** → develop 環境へ自動デプロイ

### 必要なGitHub Secrets

リポジトリに以下のシークレットを設定する必要があります：

1. **CLOUDFLARE_API_TOKEN**
   - 生成場所: Cloudflare Dashboard → My Profile → API Tokens
   - テンプレート: "Edit Cloudflare Workers"
   - または、カスタムトークンを作成（必要な権限: `Workers Scripts:Edit`, `Workers Routes:Edit`）

2. **CLOUDFLARE_ACCOUNT_ID**
   - 取得場所: Cloudflare Dashboard → Workers & Pages → Overview（右サイドバー）

設定場所: リポジトリ Settings → Secrets and variables → Actions → New repository secret

### GitHub Actions 設定詳細

- **pnpm バージョン**: `package.json` の `packageManager` フィールドから自動検出（pnpm@10.27.0）
- **Node.js バージョン**: 24.11（`package.json` の `engines` フィールドと一致）
- これにより、ローカル開発とCI/CD環境の一貫性が保証されます

## 手動デプロイ

通常はGitHub Actionsで自動デプロイされますが、手動デプロイも可能です：

```bash
# 注意: package.jsonにはデプロイスクリプトが定義されていません
# 手動デプロイは wrangler deploy コマンドを直接使用する必要があります

# 例:
wrangler deploy --env production
wrangler deploy --env staging
wrangler deploy --env develop
```

## Cloudflare バインディング

### D1 Database（`DB` バインディング）

各環境に個別のD1データベースが設定されています。詳細は `database_layer.md` を参照してください。

### KV Namespace（`SESSION_KV` バインディング）

セッション管理用のKey-Valueストア。Better Authのサーバーサイドセッション管理に使用されます。

## 環境変数

### `wrangler.jsonc` で自動設定される変数

各環境で以下の変数が自動的に設定されます：

```jsonc
{
  "vars": {
    "ENVIRONMENT": "local|start|develop|staging|production",
    "BASE_URL": "http://localhost:3000 | https://...",
  },
}
```

- **ENVIRONMENT**: 現在の環境名
- **BASE_URL**: アプリケーションのベースURL（認証コールバックなどで使用）

### 環境別BASE_URL

- **local**: `http://localhost:3000`
- **develop**: `https://tanstack-start-app-develop.tomoya0209.workers.dev`
- **staging**: `https://tanstack-start-app-staging.tomoya0209.workers.dev`
- **production**: `https://tanstack-start-app.tomoya0209.workers.dev`

### カスタム環境変数の設定

#### ローカル環境

`.dev.vars` または `.env` ファイルをプロジェクトルートに作成：

```bash
# .dev.vars または .env（デフォルト）
CUSTOM_VAR=value

# .dev.vars.local または .env.local（CLOUDFLARE_ENV=local時）
CUSTOM_VAR=local_value
```

**注意**: `.dev.vars` と `.env` のどちらか一方を選択してください。`.dev.vars` が存在する場合、`.env` の値は無視されます。

#### リモート環境

`wrangler.jsonc` の各環境セクションで `vars` を設定：

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "CUSTOM_VAR": "production_value",
      },
    },
  },
}
```

## 互換性設定

```jsonc
{
  "compatibility_flags": ["nodejs_compat"],
  "compatibility_date": "2025-09-02",
}
```

- **nodejs_compat**: Node.js API互換性を有効化
- Cloudflare Workers環境でNode.js標準ライブラリの一部を使用可能

## エントリーポイント

```jsonc
{
  "main": "@tanstack/react-start/server-entry",
}
```

TanStack Startのサーバーエントリーポイントが使用されます。

## デプロイ前チェックリスト

1. ✅ `pnpm check` - フォーマット + リント
2. ✅ `pnpm typecheck` - 型チェック
3. ✅ `pnpm test` - テスト実行
4. ✅ `pnpm build` - 本番ビルド確認
5. ✅ データベースマイグレーション（必要な場合）
6. ✅ 環境変数の確認（`wrangler.jsonc`）
7. ✅ GitHub Secrets の設定確認（初回のみ）

## トラブルシューティング

### デプロイが失敗する場合

1. GitHub Secrets が正しく設定されているか確認
2. Cloudflare API Tokenの権限が適切か確認
3. `wrangler.jsonc` の設定が正しいか確認
4. ビルドエラーがないか確認（`pnpm build`）

### 環境変数が読み込まれない場合

- ローカル: `.dev.vars` または `.env` ファイルが存在するか確認
- リモート: `wrangler.jsonc` の `vars` セクションを確認
- `CLOUDFLARE_ENV` 環境変数が正しく設定されているか確認（ローカル環境の場合）
