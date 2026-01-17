# Cloudflare 環境設定ガイド

このドキュメントでは、`@cloudflare/vite-plugin` を使用する TanStack Start アプリケーションにおける環境設定の方法と注意点を解説します。

## 目次

- [Cloudflare 環境設定ガイド](#cloudflare-環境設定ガイド)
  - [目次](#目次)
  - [はじめに](#はじめに)
  - [重要な注意点](#重要な注意点)
  - [なぜ `--env` フラグが使えないのか](#なぜ---env-フラグが使えないのか)
    - [背景](#背景)
    - [技術的な理由](#技術的な理由)
  - [`CLOUDFLARE_ENV` 環境変数の使い方](#cloudflare_env-環境変数の使い方)
    - [基本的な使い方](#基本的な使い方)
    - [利用可能な環境](#利用可能な環境)
  - [環境別の設定方法](#環境別の設定方法)
    - [Local 環境(開発環境)](#local-環境開発環境)
    - [Preview 環境(ローカルプレビュー)](#preview-環境ローカルプレビュー)
    - [Develop 環境(リモート開発)](#develop-環境リモート開発)
    - [Staging 環境(ステージング)](#staging-環境ステージング)
    - [Production 環境(本番)](#production-環境本番)
  - [よくある間違いと解決方法](#よくある間違いと解決方法)
    - [❌ 間違い 1: `--env` フラグを使用](#-間違い-1---env-フラグを使用)
    - [❌ 間違い 2: `CLOUDFLARE_ENV` を設定せずに実行](#-間違い-2-cloudflare_env-を設定せずに実行)
    - [❌ 間違い 3: 環境変数ファイルの命名ミス](#-間違い-3-環境変数ファイルの命名ミス)
  - [実践例](#実践例)
    - [例 1: ローカル開発を開始する](#例-1-ローカル開発を開始する)
    - [例 2: Preview 環境でビルドをテストする](#例-2-preview-環境でビルドをテストする)
    - [例 3: データベースマイグレーションを実行する](#例-3-データベースマイグレーションを実行する)
    - [例 4: CI/CD パイプラインでの環境指定](#例-4-cicd-パイプラインでの環境指定)
  - [package.json での設定](#packagejson-での設定)
  - [GitHub Actions での設定](#github-actions-での設定)
  - [トラブルシューティング](#トラブルシューティング)
    - [問題 1: 環境が正しく認識されない](#問題-1-環境が正しく認識されない)
    - [問題 2: データベース接続エラー](#問題-2-データベース接続エラー)
    - [問題 3: 環境変数が読み込まれない](#問題-3-環境変数が読み込まれない)
  - [関連リソース](#関連リソース)

---

## はじめに

TanStack Start アプリケーションで Cloudflare Workers にデプロイする際、通常は `wrangler` CLI を使用します。しかし、**`@cloudflare/vite-plugin` を使用している場合、環境の指定方法が通常の wrangler とは異なります**。

このプロジェクトでは、Vite の開発サーバーと統合するために `@cloudflare/vite-plugin` を使用しているため、特別な環境変数の設定が必要になります。

## 重要な注意点

⚠️ **このプロジェクトでは、`wrangler` コマンドの `--env` フラグは機能しません。**

代わりに、**`CLOUDFLARE_ENV` 環境変数を使用して環境を指定する必要があります**。

```bash
# ✅ 正しい方法
CLOUDFLARE_ENV=local pnpm dev

# ❌ 間違った方法（機能しません）
wrangler dev --env local
```

## なぜ `--env` フラグが使えないのか

### 背景

通常、Cloudflare Workers の開発では、`wrangler.jsonc` ファイルに複数の環境を定義し、`--env` フラグで環境を切り替えます。

```bash
# 通常の wrangler CLI の使い方
wrangler dev --env develop
wrangler deploy --env staging
```

### 技術的な理由

しかし、`@cloudflare/vite-plugin` を使用する場合、Vite の開発サーバーが Cloudflare Workers ランタイムをシミュレートします。この場合：

1. **Vite が起動時に設定を読み込む**: Vite プラグインは、Vite サーバーの起動時に環境設定を読み込みます
2. **コマンドラインフラグでは遅すぎる**: `--env` フラグは wrangler コマンド固有のもので、Vite の設定読み込みタイミングには間に合いません
3. **環境変数が必要**: そのため、Vite の起動**前**に `CLOUDFLARE_ENV` 環境変数を設定する必要があります

公式ドキュメント： [Cloudflare Vite Plugin - Cloudflare Environments](https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/)

## `CLOUDFLARE_ENV` 環境変数の使い方

### 基本的な使い方

`CLOUDFLARE_ENV` 環境変数に、`wrangler.jsonc` の `env` セクションで定義した環境名を設定します。

```bash
CLOUDFLARE_ENV=<environment-name> <command>
```

### 利用可能な環境

このプロジェクトでは、以下の環境が `wrangler.jsonc` で定義されています：

| 環境名       | 用途                                       | データベース            |
| ------------ | ------------------------------------------ | ----------------------- |
| `local`      | ローカル開発環境（`pnpm dev`）             | `tanstack-test-local`   |
| `preview`    | ローカルビルドプレビュー（`pnpm preview`） | `tanstack-test-preview` |
| `develop`    | リモート開発環境                           | `tanstack-test-develop` |
| `staging`    | ステージング環境                           | `tanstack-test-staging` |
| `production` | 本番環境（デフォルト）                     | `tanstack-test`         |

## 環境別の設定方法

### Local 環境(開発環境)

**用途**: ローカルでの開発作業。

```bash
# 開発サーバーを起動
CLOUDFLARE_ENV=local pnpm dev
```

**設定ファイル**:

- 環境変数： `.dev.vars.local` または `.env.local`
- データベース： ローカル SQLite ファイル
- BASE_URL: `http://localhost:3000`

**package.json での設定**:

```json
{
  "scripts": {
    "dev": "CLOUDFLARE_ENV=local vite dev --port 3000"
  }
}
```

このため、通常は単に `pnpm dev` を実行するだけで、自動的に `CLOUDFLARE_ENV=local` が設定されます。

### Preview 環境(ローカルプレビュー)

**用途**: ローカルで本番ビルドのテスト。

```bash
# Preview 環境用にビルド
CLOUDFLARE_ENV=preview pnpm build:preview

# Preview サーバーを起動（ポート 4173）
pnpm preview
```

**設定ファイル**:

- 環境変数： `.env.preview`
- データベース： ローカル SQLite ファイル（preview 専用）
- BASE_URL: `http://localhost:4173`

**使用場面**:

- 本番ビルドのローカルテスト
- パフォーマンスの検証
- 本番デプロイ前の最終確認

### Develop 環境(リモート開発)

**用途**: リモートの開発環境にデプロイ。

```bash
# Develop 環境にデプロイ
wrangler deploy --env develop
```

**設定ファイル**:

- 環境変数： `wrangler.jsonc` の `env.develop.vars`
- データベース： リモート D1（`tanstack-test-develop`）
- BASE_URL: `https://tanstack-start-app-develop.tomoya0209.workers.dev`

**GitHub Actions**: `develop` ブランチへのプッシュで自動デプロイ。

### Staging 環境(ステージング)

**用途**: 本番前のテスト環境。

```bash
# Staging 環境にデプロイ
wrangler deploy --env staging
```

**設定ファイル**:

- 環境変数： `wrangler.jsonc` の `env.staging.vars`
- データベース： リモート D1（`tanstack-test-staging`）
- BASE_URL: `https://tanstack-start-app-staging.tomoya0209.workers.dev`

**GitHub Actions**: `staging` ブランチへのプッシュで自動デプロイ。

### Production 環境(本番)

**用途**: 本番環境。

```bash
# Production 環境にデプロイ（デフォルト）
wrangler deploy
```

**設定ファイル**:

- 環境変数： `wrangler.jsonc` の `vars`（トップレベル）
- データベース： リモート D1（`tanstack-test`）
- BASE_URL: `https://tanstack-start-app.tomoya0209.workers.dev`

**GitHub Actions**: `main` ブランチへのプッシュで自動デプロイ。

## よくある間違いと解決方法

### ❌ 間違い 1: `--env` フラグを使用

```bash
# ❌ これは機能しません
wrangler dev --env local
pnpm dev --env local
```

**✅ 正しい方法**:

```bash
CLOUDFLARE_ENV=local pnpm dev
```

**理由**: `@cloudflare/vite-plugin` を使用しているため、Vite の起動前に環境変数を設定する必要があります。

### ❌ 間違い 2: `CLOUDFLARE_ENV` を設定せずに実行

```bash
# ❌ 環境が指定されていない
pnpm dev
```

**結果**: デフォルトの本番環境設定が使用される可能性があります。

**✅ 正しい方法**:

```bash
# package.json にあらかじめ設定されているので、これで OK
pnpm dev
```

または、手動で環境を指定：

```bash
CLOUDFLARE_ENV=local pnpm dev
```

### ❌ 間違い 3: 環境変数ファイルの命名ミス

```bash
# ❌ 間違ったファイル名
.env.development  # ❌ "development" ではなく "develop"
.env.start        # ❌ "start" ではなく "preview"
```

**✅ 正しいファイル名**:

- `.env.local` または `.dev.vars.local`
- `.env.preview`
- `.env.develop`
- `.env.staging`
- `.env.production`

環境名は `wrangler.jsonc` の `env` セクションで定義された名前と**正確に一致する必要があります**。

## 実践例

### 例 1: ローカル開発を開始する

```bash
# 1. 依存関係をインストール
pnpm install

# 2. ローカル環境変数ファイルを作成
cat > .env.local << EOF
D1_LOCAL_URL='./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/00000000-0000-0000-0000-000000000000.sqlite'
EOF

# 3. データベースマイグレーションを実行
pnpm db:migrate:local

# 4. 開発サーバーを起動（自動的に CLOUDFLARE_ENV=local が設定される）
pnpm dev
```

### 例 2: Preview 環境でビルドをテストする

```bash
# 1. Preview 環境用の環境変数ファイルを作成
cat > .env.preview << EOF
D1_LOCAL_URL='./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/00000000-0000-0000-0000-000000000000.sqlite'
EOF

# 2. Preview 環境用にビルド
pnpm build:preview

# 3. Preview サーバーを起動
pnpm preview

# 4. ブラウザで http://localhost:4173 を開く
```

### 例 3: データベースマイグレーションを実行する

```bash
# ローカル環境
pnpm db:migrate:local

# Preview 環境
pnpm db:migrate:preview

# Develop 環境（リモート）
pnpm db:migrate:dev

# Staging 環境（リモート）
pnpm db:migrate:stg

# Production 環境（リモート）
pnpm db:migrate:prod
```

各コマンドは、対応する Drizzle 設定ファイル（`src/db/config/drizzle-*.config.ts`）を使用します。

### 例 4: CI/CD パイプラインでの環境指定

GitHub Actions でのビルド時：

```yaml
- name: Build
  run: pnpm build
  env:
    CLOUDFLARE_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || (github.ref == 'refs/heads/staging' && 'staging' || 'develop') }}
```

このように、`CLOUDFLARE_ENV` 環境変数を使用して、ビルド時の環境を動的に指定できます。

## package.json での設定

このプロジェクトでは、`package.json` のスクリプトに `CLOUDFLARE_ENV` があらかじめ設定されています：

```json
{
  "scripts": {
    "dev": "CLOUDFLARE_ENV=local vite dev --port 3000",
    "build:preview": "rimraf dist && CLOUDFLARE_ENV=preview vite build --mode preview"
  }
}
```

このため、通常は環境変数を手動で設定する必要はありません。

## GitHub Actions での設定

`.github/workflows/deploy.yml` では、ブランチに応じて `CLOUDFLARE_ENV` を動的に設定しています：

```yaml
- name: Build
  run: pnpm build
  env:
    CLOUDFLARE_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || (github.ref == 'refs/heads/staging' && 'staging' || 'develop') }}
```

**環境とブランチの対応**:

| ブランチ  | 環境         | デプロイ先                   |
| --------- | ------------ | ---------------------------- |
| `main`    | `production` | `tanstack-start-app`         |
| `staging` | `staging`    | `tanstack-start-app-staging` |
| `develop` | `develop`    | `tanstack-start-app-develop` |

## トラブルシューティング

### 問題 1: 環境が正しく認識されない

**症状**: 別の環境の設定が使用されているように見える。

**解決方法**:

1. `CLOUDFLARE_ENV` が正しく設定されているか確認：

   ```bash
   echo $CLOUDFLARE_ENV
   ```

2. `wrangler.jsonc` の環境名と一致しているか確認：

   ```bash
   cat wrangler.jsonc | grep -A 2 'env'
   ```

3. キャッシュをクリアして再起動：

   ```bash
   rm -rf .wrangler dist node_modules/.vite
   pnpm dev
   ```

### 問題 2: データベース接続エラー

**症状**: `Error: no such table` や接続エラーが発生。

**解決方法**:

1. 環境に対応する `.env.*` ファイルが存在するか確認
2. データベースマイグレーションを実行：

   ```bash
   pnpm db:migrate:local  # または該当する環境
   ```

3. D1 データベースが作成されているか確認：

   ```bash
   wrangler d1 list
   ```

### 問題 3: 環境変数が読み込まれない

**症状**: 環境変数が `undefined` になる。

**解決方法**:

1. `.dev.vars` と `.env` の両方が存在する場合、`.dev.vars` が優先されます
2. 環境に応じた正しいファイル名を使用：
   - ローカル： `.env.local` または `.dev.vars.local`
   - Preview: `.env.preview`
   - リモート環境： `wrangler.jsonc` の `vars` セクション

3. Vite サーバーを再起動して変更を反映：

   ```bash
   # Ctrl+C でサーバーを停止してから
   pnpm dev
   ```

## 関連リソース

- [Cloudflare Workers Vite Plugin - 公式ドキュメント](https://developers.cloudflare.com/workers/vite-plugin/)
- [Cloudflare Environments - 公式ドキュメント](https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/)
- [TanStack Start - 公式ドキュメント](https://tanstack.com/start/)
- [Wrangler Configuration - 公式ドキュメント](https://developers.cloudflare.com/workers/wrangler/configuration/)

---

**注意**: このドキュメントは、`@cloudflare/vite-plugin` を使用する TanStack Start プロジェクト固有の内容です。通常の Cloudflare Workers プロジェクトでは `--env` フラグが正常に機能します。
