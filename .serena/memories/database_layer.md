# データベース層（Drizzle ORM + Cloudflare D1）

## 概要

このプロジェクトはDrizzle ORMとCloudflare D1（サーバーレスSQLite）を使用してデータベース操作を行います。

## データベース構成

### D1バインディング（wrangler.jsonc設定）

各環境に個別のD1データベースインスタンスが設定されています：

- **local**: ローカルD1（`tanstack-test-local`）
- **start**: ローカルD1（本番と同じデータベース名を使用、テスト用）
- **develop**: リモートD1（`tanstack-test-develop`）
- **staging**: リモートD1（`tanstack-test-staging`）
- **production**: リモートD1（`tanstack-test`）

バインディング名: `DB`（すべての環境で共通）

## ディレクトリ構造

```
src/db/
├── config/                    # 環境別Drizzle設定
│   ├── drizzle-local.config.ts
│   ├── drizzle-start.config.ts
│   ├── drizzle-dev.config.ts
│   ├── drizzle-stg.config.ts
│   └── drizzle-prod.config.ts
├── lib/                       # データベースユーティリティ
│   └── drizzle-config-loader.ts  # 認証情報ローダー
├── schema/                    # データベーススキーマ定義
│   └── auth.ts               # Better Auth スキーマ
└── seed/                      # シードファイル
    └── drop-all-table.sql    # 全テーブル削除スクリプト

migrations/                    # 自動生成マイグレーションファイル（Gitにコミット）
```

## スキーマ定義パターン

`src/db/schema/` にDrizzleスキーマ構文でテーブルを定義します。

```typescript
// 例: src/db/schema/users.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
})

// 型推論のエクスポート
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

## Drizzle設定パターン

各環境の設定ファイルは `loadD1Credentials()` を使用して認証情報をロードします。

### ローカル/Start環境

`.env.local` または `.env.start` に設定：

```bash
D1_LOCAL_URL='./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/[database_id].sqlite'
```

### リモート環境（develop/staging/production）

`.env.develop`、`.env.staging`、`.env.production` に設定：

```bash
CLOUDFLARE_ACCOUNT_ID='your_account_id'
D1_ID='your_database_id'
CLOUDFLARE_API_TOKEN='your_api_token'
```

## データベース操作の流れ

### 1. スキーマ定義

`src/db/schema/` にテーブルを定義します。

### 2. マイグレーション生成

```bash
pnpm db:generate
```

これにより `migrations/` ディレクトリに SQLマイグレーションファイルが生成されます。

### 3. マイグレーション適用

環境別にマイグレーションを実行：

```bash
pnpm db:migrate:local    # ローカル環境
pnpm db:migrate:dev      # develop環境
pnpm db:migrate:stg      # staging環境
pnpm db:migrate:prod     # production環境
```

### 4. サーバー関数でのデータベースアクセス

```typescript
import { createServerFn } from '@tanstack/react-start'
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import { users } from '@/db/schema/users'

export const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const db = drizzle(env.DB) // env.DB はCloudflare WorkersのD1バインディング
  const result = await db.select().from(users).all()
  return result
})
```

**重要**: `env.DB` はCloudflare Workersの実行時バインディングです。`wrangler.jsonc` で設定されています。

## Drizzle Studio

データベースをGUIで確認・編集：

```bash
pnpm db:view:local    # ローカル
pnpm db:view:dev      # develop環境
pnpm db:view:stg      # staging環境
pnpm db:view:prod     # production環境
```

## データベースリセット

全テーブルを削除：

```bash
pnpm db:drop:local    # ローカル
pnpm db:drop:dev      # develop環境
pnpm db:drop:stg      # staging環境
pnpm db:drop:prod     # 警告のみ（手動実行が必要）
```

## Better Auth 統合

Better Authは Drizzle アダプターを使用して認証を処理します：

- 設定ファイル: プロジェクトルートの `auth.ts`
- スキーマ: `src/db/schema/auth.ts`
- セッションストレージ: Cloudflare KV（`SESSION_KV` バインディング）
- BASE_URL: 各環境で `wrangler.jsonc` に設定（認証コールバック用）

**注意**: `auth.ts` はスキーマ生成用の設定ファイルです。データベースインスタンスは不要です。

## 環境変数管理

### ローカル開発

`.dev.vars` または `.env` をプロジェクトルートに作成：

```bash
# .dev.vars または .env（デフォルト）
SOME_SECRET=value

# .dev.vars.local または .env.local（CLOUDFLARE_ENV=local時）
SOME_SECRET=local_value
```

注意: `.dev.vars` と `.env` のどちらか一方を使用してください。`.dev.vars` が存在する場合、`.env` の値は無視されます。

### リモート環境

`wrangler.jsonc` の `vars` セクションで設定します。

## 重要なポイント

1. **マイグレーションファイルは必ずGitにコミット**してください
2. **環境ごとに個別のD1データベース**を使用
3. **ローカル環境は2つ**: `local`（通常の開発）と `start`（本番相当のテスト）
4. **Drizzle設定は環境別**に分離されています
5. **サーバー関数内でのみ**データベースアクセスが可能です（`env.DB`バインディング経由）
