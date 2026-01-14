# プロジェクト概要

## プロジェクトの目的

このプロジェクトは **TanStack Start** をベースとしたフルスタックReactアプリケーションで、Cloudflare Workers環境にデプロイされます。SSR（Server-Side Rendering）サポートを持ち、モダンなReact開発のベストプラクティスを実装しています。

## 主要な技術スタック

### フロントエンド

- **React 19**: 最新のReact（React Server Componentsサポート）
- **TanStack Router**: ファイルベースルーティング + 型安全なナビゲーション
- **TanStack Query**: サーバーステート管理 + SSR統合
- **Tailwind CSS v4**: ユーティリティファーストCSSフレームワーク
- **Shadcn/ui**: UIコンポーネントライブラリ（New Yorkスタイル）
- **React Hook Form**: フォーム管理 + バリデーション
- **Zod**: TypeScriptファーストスキーマバリデーション

### バックエンド

- **TanStack Start**: フルスタックReactフレームワーク（SSRサポート）
- **Cloudflare Workers**: デプロイメント環境
- **Cloudflare D1**: サーバーレスSQLiteデータベース
- **Drizzle ORM**: TypeScript ORM（データベース操作）
- **Better Auth**: Drizzleアダプター付き認証ライブラリ

### 開発ツール

- **Vite**: ビルドツール + 開発サーバー
- **TypeScript**: 厳格モード有効（noUnusedLocals、noUnusedParametersなど）
- **Vitest**: テストフレームワーク（jsdom環境）
- **ESLint**: リンティング（@tanstack/eslint-config ベース）
- **Prettier**: フォーマッティング（Tailwind CSSプラグイン付き）
- **Stylelint**: CSSリンティング
- **Lefthook**: Gitフック管理

## パッケージマネージャー

- **pnpm@10.27.0**: プロジェクトのパッケージマネージャー
- Node.jsバージョン: **24.11.x**

## デプロイメント環境

5つの環境が設定されています：

- **local**: ローカル開発環境（`pnpm dev`で起動）
- **start**: ローカルテスト環境（本番相当の設定でローカルテスト）
- **develop**: リモート開発環境（GitHub: develop ブランチ）
- **staging**: リモートステージング環境（GitHub: staging ブランチ）
- **production**: 本番環境（GitHub: main ブランチ）

GitHub Actionsによる自動デプロイメントが構成されています。
