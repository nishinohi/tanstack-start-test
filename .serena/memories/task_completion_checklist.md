# タスク完了時のチェックリスト

コードの変更を完了したら、以下のステップを実行してください。

## 1. コード品質チェック

```bash
# フォーマット + リント修正を一括実行
pnpm check
```

このコマンドは以下を実行します：

- `prettier --write .` - すべてのファイルをフォーマット
- `eslint --fix` - リントエラーを自動修正

## 2. 型チェック

```bash
# TypeScript型エラーがないか確認
pnpm typecheck
```

## 3. テスト実行

```bash
# すべてのテストを実行
pnpm test
```

## 4. ビルド確認

```bash
# 本番ビルドが成功するか確認
pnpm build
```

バンドルサイズを確認したい場合：

```bash
# バンドルサイズ解析
pnpm build:analyze
```

## 5. Git フック

コミット時に自動的に以下が実行されます（Lefthook設定）：

- Prettier による自動フォーマット
- ESLint による自動修正
- Stylelint による CSS 修正

したがって、ステージング前に手動で `pnpm check` を実行しておくことを推奨します。

## 6. データベース変更の場合

データベーススキーマを変更した場合：

```bash
# 1. マイグレーションファイルを生成
pnpm db:generate

# 2. ローカル環境でマイグレーション実行
pnpm db:migrate:local

# 3. Drizzle Studioで確認（オプション）
pnpm db:view:local
```

リモート環境へのマイグレーション適用は、コミット後に該当環境で実行：

```bash
pnpm db:migrate:dev    # develop環境
pnpm db:migrate:stg    # staging環境
pnpm db:migrate:prod   # production環境
```

## 7. ルート変更の場合

TanStack Routerのファイルベースルーティングを使用している場合、`src/routeTree.gen.ts` が自動生成されます。このファイルは：

- 自動生成されるため、手動編集不要
- Gitにコミットする必要あり
- `.prettierrc` と `eslint.config.js` で除外設定済み

## タスク完了の推奨フロー

1. コード変更を完了
2. `pnpm check` でフォーマット + リント修正
3. `pnpm typecheck` で型エラー確認
4. `pnpm test` でテスト実行
5. `pnpm build` でビルド確認（本番環境と同じビルドプロセス）
6. 問題がなければコミット（Gitフックが自動実行される）

## 注意事項

- **自動生成ファイル**: `src/routeTree.gen.ts` は編集しない
- **デプロイ**: GitHub Actionsによる自動デプロイが設定されているため、ブランチへのプッシュで自動的にデプロイされます
  - `main` → production
  - `staging` → staging
  - `develop` → develop
