import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { NewTodo, Todo } from '@/db/schema/schema'
import { todos } from '@/db/schema/schema'
import { getDb } from '@/lib/server-client'
import { authMiddleware } from '@/middleware/auth'

// Zod スキーマ定義
const todoFormSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
})

type TodoFormData = z.infer<typeof todoFormSchema>

// Server function用のZodスキーマ
const createTodoSchema = z.object({
  title: z.string().min(1).max(100),
  completed: z.boolean().optional(),
})

const updateTodoSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(100).optional(),
  completed: z.boolean().optional(),
})

const deleteTodoSchema = z.object({
  id: z.number().int().positive(),
})

// 統計情報の型定義
type TodoStats = {
  total: number
  completed: number
  pending: number
  completionRate: number
  fetchedAt: string
}

// 最近の更新履歴の型定義
type RecentActivity = {
  activities: Array<{
    id: number
    action: string
    title: string
    timestamp: string
  }>
  fetchedAt: string
}

// すべてのTodoを取得（ストリーミング対象 - 遅延あり）
export const getAllTodos = createServerFn({ method: 'GET' }).handler(async () => {
  if (Math.random() < 0.3) throw new Error('todo error')
  const db = getDb()
  const allTodos = await db.select().from(todos).all()
  return allTodos
})

// 統計情報を取得（非クリティカルデータ - 遅延あり）
export const getTodoStats = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  const allTodos = await db.select().from(todos).all()
  const completed = allTodos.filter((t) => t.completed).length
  const total = allTodos.length

  return {
    total,
    completed,
    pending: total - completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    fetchedAt: new Date().toLocaleTimeString('ja-JP'),
  } satisfies TodoStats
})

// 最近の更新履歴を取得（非クリティカルデータ - より長い遅延）
export const getRecentActivity = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  const allTodos = await db.select().from(todos).all()

  // 仮想的な更新履歴を生成（実際のアプリでは別テーブルで管理）
  const activities = allTodos.slice(-5).map((todo, index) => ({
    id: todo.id,
    action: todo.completed ? '完了' : '追加',
    title: todo.title,
    timestamp: `${(index + 1) * 2}分前`,
  }))

  return {
    activities: activities.reverse(),
    fetchedAt: new Date().toLocaleTimeString('ja-JP'),
  } satisfies RecentActivity
})

// 新しいTodoを作成
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => createTodoSchema.parse(input))
  .handler(async ({ data }) => {
    const db = getDb()
    const result = await db
      .insert(todos)
      .values({
        title: data.title,
        completed: data.completed ?? false,
      })
      .returning()
    return result[0]
  })

// Todoを更新
export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => updateTodoSchema.parse(input))
  .handler(async ({ data }) => {
    const db = getDb()
    const updateData: Partial<NewTodo> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.completed !== undefined) updateData.completed = data.completed

    const result = await db.update(todos).set(updateData).where(eq(todos.id, data.id)).returning()
    return result[0]
  })

// Todoを削除
export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => deleteTodoSchema.parse(input))
  .handler(async ({ data }) => {
    const db = getDb()
    await db.delete(todos).where(eq(todos.id, data.id))
    return { success: true }
  })

// Query Options 定義
export const todosQueryOptions = () =>
  queryOptions({
    queryKey: ['streaming-query-todos'],
    queryFn: () => getAllTodos(),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  })

export const todoStatsQueryOptions = () =>
  queryOptions({
    queryKey: ['streaming-query-todos-stats'],
    queryFn: () => getTodoStats(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

export const recentActivityQueryOptions = () =>
  queryOptions({
    queryKey: ['streaming-query-todos-activity'],
    queryFn: () => getRecentActivity(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

// エラー表示コンポーネント
function StreamingErrorFallback({ error, reset, title }: { error: unknown; reset: () => void; title: string }) {
  const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-red-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-semibold">{title}の読み込みに失敗しました</span>
      </div>
      <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
      <button onClick={reset} className="mt-4 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
        再試行
      </button>
    </div>
  )
}

export const Route = createFileRoute('/demo/start/ssr/streaming-ssr-db-with-query')({
  component: StreamingDBWithQueryPage,
  loader: ({ context }) => {
    // prefetchQuery は await しない → ストリーミング対象
    context.queryClient.prefetchQuery(todosQueryOptions())
    context.queryClient.prefetchQuery(todoStatsQueryOptions())
    context.queryClient.prefetchQuery(recentActivityQueryOptions())
  },
  server: {
    middleware: [authMiddleware],
  },
})

function StreamingDBWithQueryPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)

  // 新規作成フォーム
  const createForm = useForm<TodoFormData>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: '',
    },
  })

  // 編集フォーム
  const editForm = useForm<TodoFormData>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: '',
    },
  })

  // Mutation: 新規作成
  const createMutation = useMutation({
    mutationFn: (input: { title: string }) => createTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos'] })
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos-stats'] })
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos-activity'] })
      createForm.reset()
    },
  })

  // Mutation: 更新
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; title?: string; completed?: boolean }) => updateTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos'] })
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos-stats'] })
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos-activity'] })
      setEditingId(null)
      editForm.reset()
    },
  })

  // Mutation: 削除
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTodo({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos'] })
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos-stats'] })
      queryClient.invalidateQueries({ queryKey: ['streaming-query-todos-activity'] })
    },
  })

  const handleCreate = (data: TodoFormData) => {
    createMutation.mutate({ title: data.title })
  }

  const handleUpdate = (id: number, data: TodoFormData) => {
    updateMutation.mutate({ id, title: data.title })
  }

  const handleToggleComplete = (id: number, completed: boolean) => {
    updateMutation.mutate({ id, completed: !completed })
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const startEdit = (id: number, title: string) => {
    setEditingId(id)
    editForm.reset({ title })
  }

  const cancelEdit = () => {
    setEditingId(null)
    editForm.reset()
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-2 text-3xl font-bold">⚡ Streaming SSR DB with TanStack Query</h1>
      <p className="mb-4 text-gray-600">
        このページはTanStack Queryの<code className="rounded bg-gray-100 px-1">useSuspenseQuery</code>
        を使用したストリーミングSSRの実装例です。
      </p>

      {/* 実装の違い説明セクション */}
      <div className="mb-8 rounded-lg border border-cyan-200 bg-cyan-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-cyan-800">既存実装（use() API）との違い</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cyan-200">
                <th className="py-2 pr-4 text-left text-cyan-700">機能</th>
                <th className="py-2 pr-4 text-left text-cyan-700">既存 (use() API)</th>
                <th className="py-2 text-left text-cyan-700">TanStack Query</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-cyan-100">
                <td className="py-2 pr-4 font-medium">データ取得</td>
                <td className="py-2 pr-4">
                  <code className="rounded bg-white px-1">use(promise)</code>
                </td>
                <td className="py-2">
                  <code className="rounded bg-white px-1">useSuspenseQuery</code>
                </td>
              </tr>
              <tr className="border-b border-cyan-100">
                <td className="py-2 pr-4 font-medium">Loader</td>
                <td className="py-2 pr-4">await しない Promise を返す</td>
                <td className="py-2">
                  <code className="rounded bg-white px-1">prefetchQuery</code> を呼び出し
                </td>
              </tr>
              <tr className="border-b border-cyan-100">
                <td className="py-2 pr-4 font-medium">キャッシュ</td>
                <td className="py-2 pr-4">Router のみ (gcTime)</td>
                <td className="py-2">Query Cache (staleTime, gcTime)</td>
              </tr>
              <tr className="border-b border-cyan-100">
                <td className="py-2 pr-4 font-medium">再取得</td>
                <td className="py-2 pr-4">
                  <code className="rounded bg-white px-1">router.invalidate()</code>
                </td>
                <td className="py-2">
                  <code className="rounded bg-white px-1">refetch()</code> /{' '}
                  <code className="rounded bg-white px-1">invalidateQueries()</code>
                </td>
              </tr>
              <tr className="border-b border-cyan-100">
                <td className="py-2 pr-4 font-medium">状態情報</td>
                <td className="py-2 pr-4">なし</td>
                <td className="py-2">
                  <code className="rounded bg-white px-1">isFetching</code>,{' '}
                  <code className="rounded bg-white px-1">dataUpdatedAt</code> 等
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Mutation</td>
                <td className="py-2 pr-4">手動 async</td>
                <td className="py-2">
                  <code className="rounded bg-white px-1">useMutation</code> +{' '}
                  <code className="rounded bg-white px-1">isPending</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規作成フォーム - クリティカル */}
      <div className="mb-8 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">新しいTodoを作成</h2>
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              {...createForm.register('title')}
              placeholder="Todoのタイトルを入力..."
              className="flex-1 rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {createMutation.isPending ? '作成中...' : '作成'}
            </button>
          </div>
          {createForm.formState.errors.title && (
            <p className="text-sm text-red-500">{createForm.formState.errors.title.message}</p>
          )}
        </form>
      </div>

      {/* Todoリスト - ストリーミング */}
      <div className="mb-8 space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <span>Todoリスト</span>
        </h2>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <StreamingErrorFallback error={error} reset={resetErrorBoundary} title="Todoリスト" />
          )}
        >
          <Suspense fallback={<TodoListLoadingSkeleton />}>
            <TodoListWithQuery
              editingId={editingId}
              isSubmitting={isSubmitting}
              editForm={editForm}
              onToggleComplete={handleToggleComplete}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* 統計情報 - ストリーミング */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <span>📊 統計情報</span>
        </h2>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <StreamingErrorFallback error={error} reset={resetErrorBoundary} title="統計情報" />
          )}
        >
          <Suspense fallback={<StatsLoadingSkeleton />}>
            <TodoStatsWithQuery />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* 最近の更新履歴 - ストリーミング */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <span>📜 最近の更新履歴</span>
        </h2>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <StreamingErrorFallback error={error} reset={resetErrorBoundary} title="更新履歴" />
          )}
        >
          <Suspense fallback={<ActivityLoadingSkeleton />}>
            <RecentActivityWithQuery />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* デバッグ情報 */}
      <div className="mt-8 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold">データベース情報（ストリーミングデータ）</h3>
        <ErrorBoundary fallback={<div className="text-red-500">データの読み込みに失敗しました</div>}>
          <Suspense fallback={<div className="text-gray-400">読み込み中...</div>}>
            <DebugDataWithQuery />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

// Todoリストコンポーネント（useSuspenseQuery でデータ取得）
function TodoListWithQuery({
  editingId,
  isSubmitting,
  editForm,
  onToggleComplete,
  onUpdate,
  onDelete,
  onStartEdit,
  onCancelEdit,
}: {
  editingId: number | null
  isSubmitting: boolean
  editForm: ReturnType<typeof useForm<TodoFormData>>
  onToggleComplete: (id: number, completed: boolean) => void
  onUpdate: (id: number, data: TodoFormData) => void
  onDelete: (id: number) => void
  onStartEdit: (id: number, title: string) => void
  onCancelEdit: () => void
}) {
  const { data: todoList, isFetching, dataUpdatedAt, refetch } = useSuspenseQuery(todosQueryOptions())

  return (
    <div>
      {/* Query ステータスパネル */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-blue-700">
            最終更新: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ja-JP') : '-'}
          </span>
          {isFetching && (
            <span className="flex items-center gap-1 text-blue-600">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              再取得中...
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:bg-gray-300"
        >
          手動再取得
        </button>
      </div>

      {todoList.length === 0 ? (
        <p className="py-8 text-center text-gray-500">Todoがありません。上のフォームから作成してください。</p>
      ) : (
        <div className="space-y-2">
          {todoList.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              editingId={editingId}
              isSubmitting={isSubmitting}
              editForm={editForm}
              onToggleComplete={onToggleComplete}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 個別のTodoアイテムコンポーネント
function TodoItem({
  todo,
  editingId,
  isSubmitting,
  editForm,
  onToggleComplete,
  onUpdate,
  onDelete,
  onStartEdit,
  onCancelEdit,
}: {
  todo: Todo
  editingId: number | null
  isSubmitting: boolean
  editForm: ReturnType<typeof useForm<TodoFormData>>
  onToggleComplete: (id: number, completed: boolean) => void
  onUpdate: (id: number, data: TodoFormData) => void
  onDelete: (id: number) => void
  onStartEdit: (id: number, title: string) => void
  onCancelEdit: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id, todo.completed)}
        disabled={isSubmitting}
        className="h-5 w-5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      />

      {editingId === todo.id ? (
        <div className="flex-1">
          <input
            type="text"
            {...editForm.register('title')}
            disabled={isSubmitting}
            className="w-full rounded border border-gray-300 px-3 py-1 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          />
          {editForm.formState.errors.title && (
            <p className="mt-1 text-xs text-red-500">{editForm.formState.errors.title.message}</p>
          )}
        </div>
      ) : (
        <span className={`flex-1 ${todo.completed ? 'text-gray-400 line-through' : ''}`}>{todo.title}</span>
      )}

      <div className="flex gap-2">
        {editingId === todo.id ? (
          <>
            <button
              onClick={editForm.handleSubmit((data) => onUpdate(todo.id, data))}
              disabled={isSubmitting}
              className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600 disabled:bg-gray-300"
            >
              保存
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600 disabled:bg-gray-300"
            >
              キャンセル
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onStartEdit(todo.id, todo.title)}
              disabled={isSubmitting}
              className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:bg-gray-300"
            >
              編集
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              disabled={isSubmitting}
              className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:bg-gray-300"
            >
              削除
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Todoリストローディングスケルトン
function TodoListLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="h-5 w-5 rounded bg-gray-200"></div>
          <div className="h-4 flex-1 rounded bg-gray-200"></div>
          <div className="flex gap-2">
            <div className="h-8 w-16 rounded bg-gray-200"></div>
            <div className="h-8 w-16 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
      <div className="mt-4 text-center text-sm text-gray-400">Todoリストを読み込み中...</div>
    </div>
  )
}

// 統計情報コンポーネント（useSuspenseQuery でデータ取得）
function TodoStatsWithQuery() {
  const { data: stats, isFetching, dataUpdatedAt, refetch } = useSuspenseQuery(todoStatsQueryOptions())

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Query ステータス */}
      <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>staleTime: 30秒</span>
          <span>|</span>
          <span>gcTime: 5分</span>
          {isFetching && (
            <>
              <span>|</span>
              <span className="text-blue-500">再取得中...</span>
            </>
          )}
        </div>
        <button onClick={() => refetch()} className="text-blue-500 hover:text-blue-700">
          再取得
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-500">総数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">完了</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">未完了</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
          <div className="text-sm text-gray-500">完了率</div>
        </div>
      </div>
      <div className="mt-4 text-center text-xs text-gray-400">
        サーバー取得時刻: {stats.fetchedAt} | キャッシュ取得時刻:{' '}
        {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ja-JP') : '-'}
      </div>
    </div>
  )
}

// 統計情報ローディングスケルトン
function StatsLoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto mb-2 h-8 w-16 rounded bg-gray-200"></div>
            <div className="mx-auto h-4 w-12 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-400">統計情報を読み込み中...</div>
    </div>
  )
}

// 更新履歴コンポーネント（useSuspenseQuery でデータ取得）
function RecentActivityWithQuery() {
  const { data: activity, isFetching, dataUpdatedAt, refetch } = useSuspenseQuery(recentActivityQueryOptions())

  if (activity.activities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500 shadow-sm">
        更新履歴がありません
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Query ステータス */}
      <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>staleTime: 30秒</span>
          <span>|</span>
          <span>gcTime: 5分</span>
          {isFetching && (
            <>
              <span>|</span>
              <span className="text-blue-500">再取得中...</span>
            </>
          )}
        </div>
        <button onClick={() => refetch()} className="text-blue-500 hover:text-blue-700">
          再取得
        </button>
      </div>

      <div className="space-y-3">
        {activity.activities.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${item.action === '完了' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
            <span className="flex-1">
              <span className="text-gray-500">{item.timestamp}:</span>{' '}
              <span className="font-medium">&quot;{item.title}&quot;</span> を{item.action}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-xs text-gray-400">
        サーバー取得時刻: {activity.fetchedAt} | キャッシュ取得時刻:{' '}
        {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ja-JP') : '-'}
      </div>
    </div>
  )
}

// 更新履歴ローディングスケルトン
function ActivityLoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-gray-200"></div>
            <div className="h-4 flex-1 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-400">更新履歴を読み込み中...</div>
    </div>
  )
}

// デバッグ情報コンポーネント（useSuspenseQuery でデータ取得）
function DebugDataWithQuery() {
  const { data } = useSuspenseQuery(todosQueryOptions())
  return <pre className="overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>
}
