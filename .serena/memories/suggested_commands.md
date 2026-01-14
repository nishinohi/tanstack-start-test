# 重要なコマンド一覧

## 開発サーバー

```bash
# 開発サーバー起動（ポート3000で起動）
pnpm dev

# 本番ビルドのプレビュー
pnpm preview
```

## ビルドとデプロイ

```bash
# 本番ビルド
pnpm build

# バンドルサイズ解析付きビルド（./dist/stats.htmlを生成、ブラウザで自動表示）
pnpm build:analyze

# 注意: デプロイは通常GitHub Actionsで自動実行されます
# - main ブランチ → 本番環境
# - staging ブランチ → ステージング環境
# - develop ブランチ → 開発環境
# 手動デプロイは `wrangler deploy` コマンドを直接使用
```

## テストと型チェック

```bash
# テスト実行（Vitest）
pnpm test

# TypeScript型チェック
pnpm typecheck

# Cloudflare Worker型定義生成
pnpm typegen:cf
```

## コード品質

```bash
# ESLintリンティング
pnpm lint

# Prettierフォーマット確認
pnpm format

# フォーマット + リント修正（prettier --write + eslint --fix）
pnpm check
```

## データベース操作（Drizzle ORM + Cloudflare D1）

### マイグレーション生成と実行

```bash
# スキーマからマイグレーションファイル生成
pnpm db:generate

# マイグレーション実行（環境別）
pnpm db:migrate:local    # ローカルD1
pnpm db:migrate:start    # start環境
pnpm db:migrate:dev      # develop環境（リモート）
pnpm db:migrate:stg      # staging環境（リモート）
pnpm db:migrate:prod     # production環境（リモート）
```

### Drizzle Studio（データベースGUI）

```bash
# Drizzle Studio起動（環境別）
pnpm db:view:local    # ローカル
pnpm db:view:start    # start環境
pnpm db:view:dev      # develop環境
pnpm db:view:stg      # staging環境
pnpm db:view:prod     # production環境
```

### テーブル削除（危険）

```bash
# 全テーブル削除（環境別）
pnpm db:drop:local    # ローカル
pnpm db:drop:start    # start環境
pnpm db:drop:dev      # develop環境
pnpm db:drop:stg      # staging環境
pnpm db:drop:prod     # 警告メッセージのみ（手動実行が必要）
```

## UIコンポーネント

```bash
# Shadcnコンポーネント追加
pnpm dlx shadcn@latest add <component-name>

# 例: ボタンコンポーネント追加
pnpm dlx shadcn@latest add button
```

## システムユーティリティ（Darwin/macOS）

このプロジェクトはDarwin（macOS）環境で開発されています。一般的なUnixコマンドが使用できます：

- `git`: バージョン管理
- `ls`: ファイル一覧表示
- `cd`: ディレクトリ移動
- `grep`: テキスト検索
- `find`: ファイル検索
- `cat`: ファイル内容表示
- `head` / `tail`: ファイルの先頭/末尾表示
