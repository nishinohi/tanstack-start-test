# コードスタイルと規約

## TypeScript設定

- **厳格モード**: 有効
- **追加チェック**:
  - `noUnusedLocals: true` - 未使用のローカル変数を検出
  - `noUnusedParameters: true` - 未使用のパラメータを検出
  - `noFallthroughCasesInSwitch: true` - switchのfallthrough検出
  - `noUncheckedSideEffectImports: true` - 副作用インポートの検出
- **パスエイリアス**: `@/*` → `./src/*`
- **モジュール解決**: `bundler`
- **ターゲット**: ES2022
- **JSX**: `react-jsx`（React 17+の新しいJSX変換）

## Prettier設定

```json
{
  "printWidth": 120,
  "singleQuote": true,
  "tabWidth": 2,
  "semi": false,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindFunctions": ["clsx", "cn", "twmerge", "cva"]
}
```

**重要ポイント**:

- 行幅: 120文字
- シングルクォート使用
- セミコロンなし
- Tailwind CSSクラスの自動ソート
- カスタムTailwind関数: `clsx`, `cn`, `twmerge`, `cva`

## ESLint設定

- **ベース**: `@tanstack/eslint-config`
- **追加プラグイン**:
  - `eslint-plugin-react`
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-jsx-a11y`
  - `eslint-plugin-import-x`

**主要ルール**:

- `react/react-in-jsx-scope`: off（React 17+ JSX変換）
- `react/prop-types`: off（TypeScript使用）
- インポート順序はPrettierで管理（ESLintではない）

## Git フック（Lefthook）

コミット前に並列実行：

1. **Prettier** (優先度1): ステージされたファイルを自動フォーマット
   - 対象: `*.{js,jsx,ts,tsx,json,css,md}`
   - 除外: `src/routeTree.gen.ts`
2. **ESLint** (優先度2): ステージされたファイルを自動修正
   - 対象: `*.{js,jsx,ts,tsx}`
   - 除外: `eslint.config.js`, `vite.config.ts`, `src/routeTree.gen.ts`
3. **Stylelint** (優先度2): CSSファイルを自動修正
   - 対象: `*.css`

すべてのフックは `stage_fixed: true` で修正を自動ステージングします。

## 命名規約

- **ファイル名**:
  - コンポーネント: PascalCase（例: `Button.tsx`）
  - ユーティリティ: camelCase（例: `utils.ts`）
  - ルートファイル: kebab-case または特定のTanStackルート命名規則
- **変数/関数**: camelCase
- **型/インターフェース/クラス**: PascalCase
- **定数**: UPPER_SNAKE_CASE（グローバル定数の場合）

## インポート順序

Prettierプラグインがインポートを自動整理しますが、一般的な順序は：

1. 外部ライブラリ（React、TanStackなど）
2. エイリアスインポート（`@/*`）
3. 相対インポート（`./`, `../`）

## Tailwind CSS クラス使用

- **クラスマージ**: `cn()`ユーティリティ関数を使用（`@/lib/utils`からインポート）
- **条件付きクラス**: `cn('base-class', condition && 'conditional-class')`

例:

```typescript
import { cn } from '@/lib/utils'

cn('text-red-500', someCondition && 'font-bold')
```

## React パターン

- **React 17+ JSX変換**: `import React from 'react'` は不要
- **prop-types**: TypeScriptの型定義を使用するため不要
- **フック**: React Hooksを推奨
- **サーバー関数**: `createServerFn()`を使用

## 絵文字使用

- コードやコミットメッセージには絵文字を使用しない（ユーザーが明示的に要求した場合を除く）
