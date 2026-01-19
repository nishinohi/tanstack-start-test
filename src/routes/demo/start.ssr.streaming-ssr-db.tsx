import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Suspense, use, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
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

export const Route = createFileRoute('/demo/start/ssr/streaming-ssr-db')({
  component: StreamingDBTestPage,
  loader: () => {
    // awaitしないPromiseを返すだけで自動的にストリーミングされる
    const todoList = getAllTodos()
    const stats = getTodoStats()
    const recentActivity = getRecentActivity()

    return { todoList, stats, recentActivity }
  },
  server: {
    middleware: [authMiddleware],
  },
  gcTime: 0,
  errorComponent: () => <div className="bg-green-400 text-2xl font-bold">this is error</div>,
})

// すべてのTodoを取得（ストリーミング対象 - 遅延あり）
export const getAllTodos = createServerFn({ method: 'GET' }).handler(async () => {
  if (Math.random() < 0.5) throw new Error('todo error')
  // 遅延シミュレーション: ストリーミングの効果を可視化
  const db = getDb()
  const allTodos = await db.select().from(todos).all()
  return allTodos
})

// 統計情報を取得（非クリティカルデータ - 遅延あり）
export const getTodoStats = createServerFn({ method: 'GET' }).handler(async () => {
  // 遅延シミュレーション: ストリーミングの効果を可視化
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
  // より長い遅延シミュレーション
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

function StreamingDBTestPage() {
  const router = useRouter()
  const { todoList, stats, recentActivity } = Route.useLoaderData()
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
      createForm.reset()
      router.invalidate()
    },
    onError: (error) => {
      console.error('Todo作成エラー:', error)
    },
  })

  // Mutation: 更新
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; title?: string; completed?: boolean }) => updateTodo({ data: input }),
    onSuccess: (_, variables) => {
      // タイトル更新の場合は編集状態をリセット
      if (variables.title !== undefined) {
        setEditingId(null)
        editForm.reset()
      }
      router.invalidate()
    },
    onError: (error, variables) => {
      console.error(`Todo更新エラー (id: ${variables.id}):`, error)
    },
  })

  // Mutation: 削除
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTodo({ data: { id } }),
    onSuccess: () => {
      router.invalidate()
    },
    onError: (error, id) => {
      console.error(`Todo削除エラー (id: ${id}):`, error)
    },
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

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

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-2 text-3xl font-bold">⚡ Streaming SSR DB - CRUD Operations</h1>
      <p className="mb-8 text-gray-600">
        このページはストリーミングSSRを使用しています。Todoリストは即座に表示され、統計情報と更新履歴は非同期でストリーミングされます。
      </p>

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
              {isSubmitting ? '作成中...' : '作成'}
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
            <TodoListComponent
              promise={todoList}
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
            <TodoStatsComponent promise={stats} />
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
            <RecentActivityComponent promise={recentActivity} />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* デバッグ情報 */}
      <div className="mt-8 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold">データベース情報（ストリーミングデータ）</h3>
        <ErrorBoundary fallback={<div className="text-red-500">データの読み込みに失敗しました</div>}>
          <Suspense fallback={<div className="text-gray-400">読み込み中...</div>}>
            <DebugDataComponent promise={todoList} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

// Todoリストコンポーネント（use APIでPromiseを解決）
function TodoListComponent({
  promise,
  editingId,
  isSubmitting,
  editForm,
  onToggleComplete,
  onUpdate,
  onDelete,
  onStartEdit,
  onCancelEdit,
}: {
  promise: Promise<Todo[]>
  editingId: number | null
  isSubmitting: boolean
  editForm: ReturnType<typeof useForm<TodoFormData>>
  onToggleComplete: (id: number, completed: boolean) => void
  onUpdate: (id: number, data: TodoFormData) => void
  onDelete: (id: number) => void
  onStartEdit: (id: number, title: string) => void
  onCancelEdit: () => void
}) {
  const todoList = use(promise)

  if (todoList.length === 0) {
    return <p className="py-8 text-center text-gray-500">Todoがありません。上のフォームから作成してください。</p>
  }

  return (
    <div className="space-y-2">
      {todoList.map((todo) => (
        <div key={todo.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
      ))}
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

// 統計情報コンポーネント（use APIでPromiseを解決）
function TodoStatsComponent({ promise }: { promise: Promise<TodoStats> }) {
  const stats = use(promise)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
      <div className="mt-4 text-center text-xs text-gray-400">取得時刻: {stats.fetchedAt}</div>
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

// 更新履歴コンポーネント（use APIでPromiseを解決）
function RecentActivityComponent({ promise }: { promise: Promise<RecentActivity> }) {
  const activity = use(promise)

  if (activity.activities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500 shadow-sm">
        更新履歴がありません
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
      <div className="mt-4 text-center text-xs text-gray-400">取得時刻: {activity.fetchedAt}</div>
    </div>
  )
}

// デバッグ情報コンポーネント（use APIでPromiseを解決）
function DebugDataComponent({ promise }: { promise: Promise<Todo[]> }) {
  const data = use(promise)
  return <pre className="overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>
}
