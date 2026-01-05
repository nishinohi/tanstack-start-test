// @ts-check
import { tanstackConfig } from '@tanstack/eslint-config'

import importPlugin from 'eslint-plugin-import-x'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import { globalIgnores } from 'eslint/config'

export default [
  // ============================================
  // TanStack 公式設定をベースとして使用
  // ============================================
  ...tanstackConfig,
  globalIgnores(['.claude/*']),
  // ============================================
  // React 関連の設定
  // ============================================
  {
    plugins: {
      // import-x プラグインを明示的に登録（公式ドキュメント通りの記法で使えるようにする）
      // ※ TanStackの設定では 'import' としてエイリアスされているが、
      //    公式ドキュメントとの整合性のため 'import-x' として登録
      'import-x': importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // -----------------------------------------
      // React 基本ルール
      // -----------------------------------------

      // JSXで使用されるReact変数がスコープ内にあることを確認
      // ※ React 17+の新しいJSX変換では不要になる場合あり → 除外可
      'react/react-in-jsx-scope': 'off',

      // propsのバリデーション（TypeScript使用時は不要なことが多い）
      // ※ TypeScriptで型定義している場合は除外可
      'react/prop-types': 'off',

      // JSXでのbooleanの明示的な記述を強制
      'react/jsx-boolean-value': ['error', 'never'],

      // 不要なReactフラグメントを禁止
      'react/jsx-no-useless-fragment': 'error',

      // JSXでの重複propsを禁止
      'react/jsx-no-duplicate-props': 'error',

      // JSXでのkeyの欠落を検出
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],

      // target="_blank"のセキュリティ問題を検出
      'react/jsx-no-target-blank': 'error',

      // JSXでの未エスケープエンティティを禁止
      'react/no-unescaped-entities': 'error',

      // 非推奨のライフサイクルメソッドの使用を禁止
      'react/no-deprecated': 'error',

      // findDOMNodeの使用を禁止
      'react/no-find-dom-node': 'error',

      // 直接的なstate変更を禁止
      'react/no-direct-mutation-state': 'error',

      // dangerouslySetInnerHTMLの使用を警告
      // ※ サニタイズ済みコンテンツでは必要な場合もある → 除外可
      'react/no-danger': 'warn',

      // 文字列のrefを禁止（コールバックref推奨）
      'react/no-string-refs': 'error',

      // -----------------------------------------
      // React Hooks ルール（重要！）
      // -----------------------------------------

      // Hooksのルール違反を検出（必須）
      'react-hooks/rules-of-hooks': 'error',

      // 依存配列の網羅性をチェック（重要）
      'react-hooks/exhaustive-deps': 'warn',

      // -----------------------------------------
      // アクセシビリティ (a11y) ルール
      // ※ 厳しすぎる場合は個別に除外可
      // -----------------------------------------

      // alt属性の必須化
      'jsx-a11y/alt-text': 'error',

      // アンカー要素のコンテンツ必須
      'jsx-a11y/anchor-has-content': 'error',

      // 有効なアンカー要素
      'jsx-a11y/anchor-is-valid': 'error',

      // aria-propsの正当性
      'jsx-a11y/aria-props': 'error',

      // aria-proptypesの正当性
      'jsx-a11y/aria-proptypes': 'error',

      // aria-unsupported-elementsのチェック
      'jsx-a11y/aria-unsupported-elements': 'error',

      // roleの正当性
      'jsx-a11y/aria-role': 'error',

      // クリックイベントにキーボードイベントを併用
      // ※ カスタムコンポーネントでは除外が必要な場合あり → 除外可
      'jsx-a11y/click-events-have-key-events': 'warn',

      // 見出しにコンテンツが必要
      'jsx-a11y/heading-has-content': 'error',

      // html要素にlang属性が必要
      'jsx-a11y/html-has-lang': 'error',

      // iframe要素にtitle属性が必要
      'jsx-a11y/iframe-has-title': 'error',

      // img要素のalt属性に冗長な単語を禁止
      'jsx-a11y/img-redundant-alt': 'error',

      // インタラクティブ要素がフォーカス可能であること
      // ※ カスタム実装では除外が必要な場合あり → 除外可
      'jsx-a11y/interactive-supports-focus': 'warn',

      // label要素にコントロールが関連付けられていること
      'jsx-a11y/label-has-associated-control': 'error',

      // media要素にcaptionが必要
      // ※ デコレーション用途では除外可
      'jsx-a11y/media-has-caption': 'warn',

      // マウスイベントにキーボード代替がある
      // ※ 必須ではない操作の場合は除外可
      'jsx-a11y/mouse-events-have-key-events': 'warn',

      // accessKeyの使用を禁止
      'jsx-a11y/no-access-key': 'error',

      // 自動再生を禁止
      // ※ ミュート状態での自動再生は許容される場合あり → 除外可
      'jsx-a11y/no-autofocus': 'warn',

      // divやspanにインタラクティブハンドラを禁止
      // ※ WAI-ARIAで適切に設定している場合は除外可
      'jsx-a11y/no-static-element-interactions': 'warn',

      // 非インタラクティブ要素にインタラクティブroleを禁止
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',

      // tabindexの値を制限
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },

  // ============================================
  // TypeScript 厳格ルール
  // ============================================
  {
    rules: {
      // -----------------------------------------
      // 型安全性の向上
      // -----------------------------------------

      // any型の使用を警告
      // ※ 外部ライブラリ連携等で必要な場合は除外可
      '@typescript-eslint/no-explicit-any': 'warn',

      // 未使用変数を禁止（アンダースコアプレフィックスは許可）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // require()の使用を禁止（ESM推奨）
      '@typescript-eslint/no-require-imports': 'error',

      // 空のインターフェースを禁止
      // ※ 拡張ポイントとして空インターフェースが必要な場合は除外可
      '@typescript-eslint/no-empty-interface': 'warn',

      // 空の関数を禁止
      // ※ noopコールバック等では必要な場合あり → 除外可
      '@typescript-eslint/no-empty-function': 'warn',

      // 非nullアサーション(!)の使用を警告
      // ※ 型システムの限界で必要な場合もある → 除外可
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ts-expect-error より ts-expect-error を推奨
      '@typescript-eslint/prefer-ts-expect-error': 'error',

      // -----------------------------------------
      // コードスタイルの一貫性
      // -----------------------------------------

      // 型のインポートにtype修飾子を強制
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      // 型のエクスポートにtype修飾子を強制
      '@typescript-eslint/consistent-type-exports': ['error', { fixMixedExportsWithInlineTypeSpecifier: true }],

      // 配列型の一貫した記法を強制
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // -----------------------------------------
      // 高度な型チェック（要type-checked設定）
      // ※ これらを有効にするには parserOptions.project の設定が必要
      // ※ ビルド時間が増加する可能性あり → 除外可
      // -----------------------------------------

      // 浮遊するPromiseを禁止
      // '@typescript-eslint/no-floating-promises': 'error',

      // awaitしないPromiseを禁止
      // '@typescript-eslint/no-misused-promises': 'error',

      // async関数の戻り値の型を明示
      // '@typescript-eslint/promise-function-async': 'error',
    },
  },

  // ============================================
  // 一般的なコード品質ルール
  // ============================================
  {
    rules: {
      // -----------------------------------------
      // バグの可能性を検出
      // -----------------------------------------

      // 定数条件を禁止
      'no-constant-condition': 'error',

      // debuggerを禁止
      'no-debugger': 'error',

      // 重複するcaseラベルを禁止
      'no-duplicate-case': 'error',

      // 空のブロック文を禁止
      // ※ catchブロック等では空が適切な場合あり → 除外可
      'no-empty': ['error', { allowEmptyCatch: true }],

      // 不正な正規表現を禁止
      'no-invalid-regexp': 'error',

      // 条件式での代入を禁止
      'no-cond-assign': 'error',

      // 到達不能コードを禁止
      'no-unreachable': 'error',

      // unsafeなオプショナルチェイニングを禁止
      'no-unsafe-optional-chaining': 'error',

      // -----------------------------------------
      // ベストプラクティス
      // -----------------------------------------

      // ==ではなく===を使用
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // eval()の使用を禁止
      'no-eval': 'error',

      // Function()コンストラクタを禁止
      'no-new-func': 'error',

      // with文を禁止
      'no-with': 'error',

      // alert, confirm, promptを禁止
      // ※ 開発中のデバッグ用途では除外可
      'no-alert': 'warn',

      // console文を警告
      // ※ サーバーサイドログ等では必要 → 除外可
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // 不要なcatchの再スローを禁止
      'no-useless-catch': 'error',

      // 不要なreturnを禁止
      'no-useless-return': 'error',

      // varの使用を禁止（let/const推奨）
      'no-var': 'error',

      // const優先
      'prefer-const': 'error',

      // テンプレートリテラル優先
      'prefer-template': 'warn',

      // スプレッド構文優先
      'prefer-spread': 'warn',

      // オブジェクトショートハンド構文優先
      'object-shorthand': ['warn', 'always'],

      // -----------------------------------------
      // 複雑性の制限
      // ※ 厳しすぎる場合は値を調整または除外可
      // -----------------------------------------

      // サイクロマティック複雑度の制限
      // ※ 大きなswitch文等では超過する場合あり → 値を調整可
      complexity: ['warn', { max: 15 }],

      // 関数のパラメータ数を制限
      // ※ オプションオブジェクトパターンで回避推奨
      'max-params': ['warn', { max: 4 }],

      // ネストの深さを制限
      'max-depth': ['warn', { max: 4 }],

      // コールバックのネストを制限
      'max-nested-callbacks': ['warn', { max: 3 }],
    },
  },

  // ============================================
  // インポート関連の追加ルール
  // ============================================
  {
    rules: {
      // 自己インポートを禁止
      'import-x/no-self-import': 'error',

      // 循環インポートを警告
      // ※ 大規模プロジェクトではパフォーマンス影響あり → 除外可
      'import-x/no-cycle': 'warn',

      // 重複インポートを禁止
      // ※ prefer-inlineは指定しない（TanStackの設定でprefer-top-levelが推奨されているため）
      'import-x/no-duplicates': 'error',

      // デフォルトエクスポートの使用を警告（名前付きエクスポート推奨）
      // ※ ページコンポーネント等では必要 → 除外可
      'import-x/no-default-export': 'off', // TanStack Startはdefault exportを使用するため

      // 可変エクスポートを禁止
      'import-x/no-mutable-exports': 'error',
    },
  },

  // ============================================
  // 特定ファイルの除外設定
  // ============================================
  {
    ignores: [
      // ビルド出力
      '**/dist/**',
      '**/build/**',
      '**/.output/**',
      '**/.vinxi/**',

      // 依存関係
      '**/node_modules/**',

      // 設定ファイル（必要に応じて調整）
      // '*.config.js',
      // '*.config.ts',

      // 生成されたファイル
      '**/*.generated.*',
      '**/routeTree.gen.ts',
    ],
  },

  // ============================================
  // 設定ファイル向けの緩和ルール
  // ============================================
  {
    files: ['**/*.config.{js,ts,mjs,mts}', '**/vite.config.*'],
    rules: {
      // 設定ファイルではdefault exportが必要
      'import-x/no-default-export': 'off',
      // 設定ファイルではconsoleを許可
      'no-console': 'off',
    },
  },

  // ============================================
  // テストファイル向けの緩和ルール
  // ============================================
  {
    files: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}', '**/__tests__/**'],
    rules: {
      // テストではanyを許可
      '@typescript-eslint/no-explicit-any': 'off',
      // テストでは非nullアサーションを許可
      '@typescript-eslint/no-non-null-assertion': 'off',
      // テストではconsoleを許可
      'no-console': 'off',
      // テストではマジックナンバーを許可
      'no-magic-numbers': 'off',
    },
  },
]
