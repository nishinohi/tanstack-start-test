# コードベース構造

## プロジェクトルート構造

```
tanstack-start-test/
├── src/                    # ソースコード
├── migrations/             # 自動生成されたDBマイグレーションファイル（Gitにコミット）
├── public/                 # 静的ファイル
├── dist/                   # ビルド出力（Gitignore対象）
├── .wrangler/              # Cloudflare Wrangler作業ディレクトリ（Gitignore対象）
├── .github/                # GitHub Actions設定
├── docs/                   # ドキュメント
├── .vscode/                # VSCode設定
├── node_modules/           # npm依存関係
├── package.json            # パッケージ定義
├── tsconfig.json           # TypeScript設定
├── vite.config.ts          # Viteビルド設定
├── wrangler.jsonc          # Cloudflare Workers設定
├── eslint.config.js        # ESLint設定
├── .prettierrc             # Prettier設定
├── lefthook.yml            # Gitフック設定
├── CLAUDE.md               # Claude Code用ガイド（重要）
└── README.md               # プロジェクトREADME
```

## src/ ディレクトリ構造

```
src/
├── components/             # Reactコンポーネント
│   └── ui/                # Shadcn/ui UIコンポーネント
├── data/                  # データファイル
├── db/                    # データベース層（Drizzle ORM）
│   ├── config/           # 環境別Drizzle設定
│   ├── lib/              # データベースユーティリティ（認証情報ローダー）
│   ├── schema/           # データベーススキーマ定義
│   └── seed/             # シードファイルとユーティリティ
├── integrations/          # サードパーティ統合
│   └── tanstack-query/   # TanStack Query設定
├── lib/                   # ユーティリティ関数（utils.ts）
├── middleware/            # ミドルウェア
├── routes/                # ファイルベースルート（自動生成: routeTree.gen.ts）
│   ├── __root.tsx        # ルートレイアウト
│   ├── index.tsx         # ホームページ
│   └── demo/             # デモファイル（削除可能）
├── router.tsx             # ルーター初期化
├── routeTree.gen.ts       # 自動生成されたルートツリー（編集不可）
├── styles.css             # グローバルスタイル（Tailwind CSS）
└── logo.svg               # ロゴファイル
```

## 主要ディレクトリの役割

### `/src/routes/`

- **ファイルベースルーティング**: TanStack Routerの規約に従ってルートを定義
- **自動生成**: `routeTree.gen.ts` が `@tanstack/router-plugin` により自動生成
- **ルートファイル**: `__root.tsx` がすべてのページをラップ
- **デモファイル**: `demo/` 内のファイルは例示用で削除可能

### `/src/db/`

データベース層の完全な実装：

- **schema/**: Drizzleスキーマ定義（型推論を含む）
- **config/**: 各環境用のDrizzle設定ファイル
- **lib/**: 認証情報ローダーなどのユーティリティ
- **seed/**: シードデータとテーブル削除スクリプト

### `/src/integrations/`

サードパーティライブラリの統合設定：

- **tanstack-query/**: TanStack Queryのプロバイダーとコンテキスト設定

### `/src/components/`

再利用可能なReactコンポーネント：

- **ui/**: Shadcn/uiコンポーネント（`pnpm dlx shadcn@latest add` で追加）

### `/src/lib/`

ユーティリティ関数：

- `utils.ts`: `cn()` ヘルパー（クラス名マージ用）など

### `/migrations/`

- Drizzle ORMが生成するSQLマイグレーションファイル
- Gitにコミットする必要あり
- `pnpm db:generate` で生成

### `/public/`

静的ファイル（画像、フォントなど）

## 重要な設定ファイル

### `wrangler.jsonc`

Cloudflare Workers設定：

- 5つの環境設定（local, start, develop, staging, production）
- D1データベースバインディング
- KVネームスペースバインディング（セッション管理用）
- 環境変数設定

### `vite.config.ts`

Viteプラグイン設定（順序重要）：

1. `@tanstack/devtools-vite` - 開発ツール
2. `@cloudflare/vite-plugin` - Cloudflare Workers対応
3. `vite-tsconfig-paths` - パスエイリアス解決
4. `@tailwindcss/vite` - Tailwind CSS v4
5. `@tanstack/react-start/plugin/vite` - TanStack Start
6. `@vitejs/plugin-react` - React対応
7. `rollup-plugin-visualizer` - バンドルサイズ解析

### `CLAUDE.md`

Claude Code（AIアシスタント）用の詳細なプロジェクトガイド。このファイルには：

- 技術スタックの詳細
- コマンド一覧
- アーキテクチャ説明
- コード品質ツール設定
- デプロイメント情報

このファイルは非常に重要で、プロジェクトの全体像を理解するための主要なリファレンスです。

## パスエイリアス

`@/*` → `./src/*`

例:

```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

## 自動生成ファイル（編集禁止）

- `src/routeTree.gen.ts` - TanStack Routerが自動生成
- `worker-configuration.d.ts` - Cloudflare Worker型定義（`pnpm typegen:cf`で生成）
