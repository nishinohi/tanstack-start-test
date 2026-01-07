# Demo ファイル解説ガイド

このドキュメントでは、`src/routes/demo/` ディレクトリ内の各ファイルについて、TanStack Start と TanStack Router の初学者向けに解説します。

## 目次

- [Demo ファイル解説ガイド](#demo-ファイル解説ガイド)
  - [目次](#目次)
  - [API エンドポイント](#api-エンドポイント)
    - [api.names.ts](#apinamests)
    - [api.tq-todos.ts](#apitq-todosts)
  - [TanStack Start の機能デモ](#tanstack-start-の機能デモ)
    - [start.api-request.tsx](#startapi-requesttsx)
    - [start.server-funcs.tsx](#startserver-funcstsx)
  - [SSR（サーバーサイドレンダリング）モードのデモ](#ssrサーバーサイドレンダリングモードのデモ)
    - [start.ssr.index.tsx](#startssrindextsx)
    - [start.ssr.spa-mode.tsx](#startssrspa-modetsx)
    - [start.ssr.full-ssr.tsx](#startssrfull-ssrtsx)
    - [start.ssr.data-only.tsx](#startssrdata-onlytsx)
  - [TanStack Query のデモ](#tanstack-query-のデモ)
    - [tanstack-query.tsx](#tanstack-querytsx)
  - [まとめ](#まとめ)
    - [SSR モードの比較表](#ssr-モードの比較表)
    - [学習の順序](#学習の順序)
    - [次のステップ](#次のステップ)

---

## API エンドポイント

### api.names.ts

**ファイルパス**: `src/routes/demo/api.names.ts`

**目的**: シンプルな GET API エンドポイントを実装するデモ。

**内容解説**:

```typescript
export const Route = createFileRoute('/demo/api/names')({
  server: {
    handlers: {
      GET: () => json(['Alice', 'Bob', 'Charlie']),
    },
  },
})
```

**学べること**:

- **ルートベースの API 定義**: TanStack Router では、ルートファイル内で API エンドポイントを定義できます
- **server.handlers オプション**: `server` オブジェクト内で HTTP メソッド（GET, POST など）ごとにハンドラーを定義
- **json() ヘルパー**: `@tanstack/react-start` の `json()` 関数を使って JSON レスポンスを簡単に返せます

**アクセス方法**: `/demo/api/names` にアクセスすると、名前の配列が JSON で返されます。

---

### api.tq-todos.ts

**ファイルパス**: `src/routes/demo/api.tq-todos.ts`

**目的**: CRUD 操作を含む API エンドポイントを実装するデモ。

**内容解説**:

```typescript
const todos = [
  { id: 1, name: 'Buy groceries' },
  { id: 2, name: 'Buy mobile phone' },
  { id: 3, name: 'Buy laptop' },
]

export const Route = createFileRoute('/demo/api/tq-todos')({
  server: {
    handlers: {
      GET: () => Response.json(todos),
      POST: async ({ request }) => {
        const name = await request.json()
        const todo = {
          id: todos.length + 1,
          name: name as string,
        }
        todos.push(todo)
        return Response.json(todo)
      },
    },
  },
})
```

**学べること**:

- **複数の HTTP メソッド対応**: GET と POST の両方を同じルートで処理
- **リクエストボディの処理**: `request.json()` でクライアントから送信されたデータを取得
- **ステートフルな API**: メモリ内の配列を操作してデータを管理（本番環境ではデータベースを使用）
- **標準の Response API**: `Response.json()` を使った標準的な Web API のレスポンス

**アクセス方法**:

- GET `/demo/api/tq-todos`: TODO リストを取得
- POST `/demo/api/tq-todos`: 新しい TODO を追加

---

## TanStack Start の機能デモ

### start.api-request.tsx

**ファイルパス**: `src/routes/demo/start.api-request.tsx`

**目的**: クライアントサイドでの API リクエストと TanStack Query の統合デモ。

**内容解説**:

```typescript
function getNames(): Promise<string[]> {
  return fetch('/demo/api/names').then((res) => res.json())
}

export const Route = createFileRoute('/demo/start/api-request')({
  component: Home,
})

function Home() {
  const { data: names = [] } = useQuery({
    queryKey: ['names'],
    queryFn: getNames,
  })

  return (
    // UI レンダリング...
  )
}
```

**学べること**:

- **TanStack Query の基本**: `useQuery` フックを使ったデータフェッチング
- **Query Key**: `['names']` のようにユニークなキーでクエリを識別
- **Query Function**: データを取得する非同期関数（`getNames`）
- **自動キャッシング**: TanStack Query が自動的にデータをキャッシュし、再利用
- **ローディング状態の管理**: `useQuery` が自動的にローディング、エラー、データの状態を管理

**表示ページ**: `/demo/start/api-request` にアクセスすると、名前のリストが表示されます。

---

### start.server-funcs.tsx

**ファイルパス**: `src/routes/demo/start.server-funcs.tsx`

**目的**: Server Functions の使い方を学ぶデモ。

**内容解説**:

```typescript
const getCurrentServerTime = createServerFn({
  method: 'GET',
}).handler(async () => await new Date().toISOString())

export const Route = createFileRoute('/demo/start/server-funcs')({
  component: Home,
  loader: async () => await getCurrentServerTime(),
})

function Home() {
  const originalTime = Route.useLoaderData()
  const [time, setTime] = useState(originalTime)

  return (
    // ボタンクリックで時刻を更新...
  )
}
```

**学べること**:

- **Server Functions の定義**: `createServerFn()` でサーバー側でのみ実行される関数を作成
- **Loader との統合**: ルートの `loader` で Server Function を呼び出し、SSR 時にデータを取得
- **クライアントサイドでの呼び出し**: ボタンクリック時などにクライアントから Server Function を実行可能
- **型安全性**: Server Function は完全に型安全で、クライアント・サーバー間で型が共有される
- **useLoaderData フック**: Loader で取得したデータをコンポーネントで利用

**表示ページ**: `/demo/start/server-funcs` にアクセスすると、サーバー時刻が表示され、ボタンで更新できます。

---

## SSR（サーバーサイドレンダリング）モードのデモ

TanStack Start では、ルートごとに異なる SSR モードを選択できます。

### start.ssr.index.tsx

**ファイルパス**: `src/routes/demo/start.ssr.index.tsx`

**目的**: SSR デモのナビゲーションページ。

**内容解説**:

```typescript
export const Route = createFileRoute('/demo/start/ssr/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <Link to="/demo/start/ssr/spa-mode">SPA Mode</Link>
      <Link to="/demo/start/ssr/full-ssr">Full SSR</Link>
      <Link to="/demo/start/ssr/data-only">Data Only</Link>
    </div>
  )
}
```

**学べること**:

- **Link コンポーネント**: TanStack Router の `Link` コンポーネントで SPA ナビゲーション
- **型安全なルーティング**: `to` プロパティは型チェックされ、存在しないルートを指定するとエラー
- **インデックスルート**: パス末尾の `/` でインデックスルートを定義

**表示ページ**: `/demo/start/ssr/` にアクセスすると、3 つの SSR モードへのリンクが表示されます。

---

### start.ssr.spa-mode.tsx

**ファイルパス**: `src/routes/demo/start.ssr.spa-mode.tsx`

**目的**: SPA（Single Page Application）モードのデモ。

**内容解説**:

```typescript
export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  ssr: false,  // SSR を無効化
  component: RouteComponent,
})

function RouteComponent() {
  const [punkSongs, setPunkSongs] = useState([])

  useEffect(() => {
    getPunkSongs().then(setPunkSongs)
  }, [])

  return (
    // パンクソングのリスト表示...
  )
}
```

**学べること**:

- **ssr: false オプション**: サーバーサイドレンダリングを完全に無効化
- **クライアントサイドのみのレンダリング**: 初回ロード時は空の HTML が送信され、JavaScript でコンテンツを生成
- **useEffect でのデータフェッチ**: クライアント側でマウント後にデータを取得
- **従来の SPA と同様の動作**: React の従来の動作と同じ

**使用場面**:

- SEO が不要なページ（管理画面など）
- クライアント側でのみ利用可能な API を使用する場合

**表示ページ**: `/demo/start/ssr/spa-mode` にアクセス（初回は空白で、その後データがロード）

---

### start.ssr.full-ssr.tsx

**ファイルパス**: `src/routes/demo/start.ssr.full-ssr.tsx`

**目的**: フル SSR（サーバーサイドレンダリング）モードのデモ。

**内容解説**:

```typescript
export const Route = createFileRoute('/demo/start/ssr/full-ssr')({
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
})

function RouteComponent() {
  const punkSongs = Route.useLoaderData()

  return (
    // パンクソングのリスト表示...
  )
}
```

**学べること**:

- **デフォルトの SSR モード**: `ssr` オプションを指定しない場合、フル SSR が有効
- **Loader でのデータ取得**: サーバー側で事前にデータを取得
- **完全な HTML の配信**: 初回リクエストで完全にレンダリングされた HTML が返される
- **SEO 最適化**: 検索エンジンが完全なコンテンツをクロール可能
- **高速な初回表示**: ユーザーはすぐにコンテンツを見ることができる

**使用場面**:

- SEO が重要なページ（公開ブログ、商品ページなど）
- 初回表示速度を最適化したいページ
- JavaScript が無効でも動作する必要があるページ

**表示ページ**: `/demo/start/ssr/full-ssr` にアクセス（即座に完全なコンテンツが表示）

---

### start.ssr.data-only.tsx

**ファイルパス**: `src/routes/demo/start.ssr.data-only.tsx`

**目的**: Data Only SSR モードのデモ。

**内容解説**:

```typescript
export const Route = createFileRoute('/demo/start/ssr/data-only')({
  ssr: 'data-only',  // データのみ SSR
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
})

function RouteComponent() {
  const punkSongs = Route.useLoaderData()

  return (
    // パンクソングのリスト表示...
  )
}
```

**学べること**:

- **ssr: 'data-only' オプション**: HTML のレンダリングはクライアント側、データ取得のみサーバー側
- **ハイブリッドアプローチ**: SSR と SPA の中間的なモード
- **初回リクエストでデータを取得**: Loader がサーバー側で実行され、データが HTML に埋め込まれる
- **クライアント側でのレンダリング**: HTML 自体はクライアント側の JavaScript で生成

**使用場面**:

- データは事前に取得したいが、HTML レンダリングはクライアント側で行いたい場合
- 複雑なインタラクティブ UI で、部分的な SSR を避けたい場合
- Suspense などの React 機能をフル活用したい場合

**SPA Mode との違い**:

- **SPA Mode**: データ取得もレンダリングもクライアント側（`useEffect` 内で実行）
- **Data Only**: データ取得はサーバー側（Loader で実行）、レンダリングはクライアント側

**Full SSR との違い**:

- **Full SSR**: データ取得もレンダリングもサーバー側
- **Data Only**: データ取得はサーバー側、レンダリングはクライアント側

**表示ページ**: `/demo/start/ssr/data-only` にアクセス（データは即座に利用可能だが、レンダリングはクライアント側）

---

## TanStack Query のデモ

### tanstack-query.tsx

**ファイルパス**: `src/routes/demo/tanstack-query.tsx`

**目的**: TanStack Query の完全な CRUD 操作のデモ（TODO アプリ）

**内容解説**:

```typescript
type Todo = {
  id: number
  name: string
}

function TanStackQueryDemo() {
  const { data, refetch } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: () => fetch('/demo/api/tq-todos').then((res) => res.json()),
    initialData: [],
  })

  const { mutate: addTodo } = useMutation({
    mutationFn: (todo: string) =>
      fetch('/demo/api/tq-todos', {
        method: 'POST',
        body: JSON.stringify(todo),
      }).then((res) => res.json()),
    onSuccess: () => refetch(),
  })

  const submitTodo = useCallback(async () => {
    await addTodo(todo)
    setTodo('')
  }, [addTodo, todo])

  return (
    // TODO リストと入力フォームの表示...
  )
}
```

**学べること**:

- **useQuery の高度な使用法**:
  - `initialData`: クエリの初期データを設定
  - `refetch`: 手動でクエリを再実行する関数
  - 型パラメータ（`<Todo[]>`）でデータの型を指定

- **useMutation の使い方**:
  - `mutationFn`: データを変更する非同期関数
  - `onSuccess`: ミューテーション成功時のコールバック（ここでデータを再取得）
  - `mutate`: ミューテーションを実行する関数

- **楽観的更新のパターン**: `onSuccess` で `refetch()` を呼び出し、サーバーから最新データを取得

- **フォーム処理**:
  - `useState` で入力状態を管理
  - `onKeyDown` で Enter キー押下時の送信
  - `disabled` 属性で空の TODO の送信を防止

**表示ページ**: `/demo/tanstack-query` にアクセスすると、TODO リストと入力フォームが表示されます。

**実装のポイント**:

1. **Query Key の重要性**: `['todos']` というキーでデータをキャッシュ
2. **自動的な再フェッチ**: ウィンドウフォーカス時などに自動でデータを更新
3. **型安全性**: TypeScript で完全に型付けされたデータフロー
4. **状態管理の簡素化**: Redux などの状態管理ライブラリ不要でサーバー状態を管理

---

## まとめ

### SSR モードの比較表

| モード                             | データ取得   | HTML レンダリング | 初回表示 | SEO | 使用場面           |
| ---------------------------------- | ------------ | ----------------- | -------- | --- | ------------------ |
| **SPA Mode** (`ssr: false`)        | クライアント | クライアント      | 遅い     | ×   | 管理画面など       |
| **Data Only** (`ssr: 'data-only'`) | サーバー     | クライアント      | 中間     | △   | ハイブリッドな要件 |
| **Full SSR** (デフォルト)          | サーバー     | サーバー          | 速い     | ◎   | 公開ページ         |

### 学習の順序

1. **基本的なルーティング**: `start.ssr.index.tsx` で `Link` の使い方を学ぶ
2. **API エンドポイント**: `api.names.ts` でシンプルな API 定義を理解
3. **データフェッチング**: `start.api-request.tsx` で `useQuery` の基本を学ぶ
4. **Server Functions**: `start.server-funcs.tsx` でサーバー側のロジックを理解
5. **SSR モード**: 3 つの SSR モードの違いを比較
6. **完全な CRUD**: `tanstack-query.tsx` と `api.tq-todos.ts` で実践的な実装を学ぶ

### 次のステップ

これらのデモファイルを理解したら、以下に進むことをおすすめします：

1. **データベース統合**: Drizzle ORM と Cloudflare D1 を使った永続化
2. **認証**: ユーザー認証とセッション管理の実装
3. **フォームバリデーション**: Zod や React Hook Form を使った高度なフォーム処理
4. **エラーハンドリング**: エラーバウンダリーとエラー表示の実装
5. **本番デプロイ**: Cloudflare Workers へのデプロイとパフォーマンス最適化

---

**注意**: これらのデモファイルは学習目的のため、本番環境での使用には適していません。本番環境では、適切なデータベース、バリデーション、エラーハンドリング、セキュリティ対策を実装してください。
