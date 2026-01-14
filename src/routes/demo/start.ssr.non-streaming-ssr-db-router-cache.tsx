import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { NewTodo } from '@/db/schema/schema'
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

export const Route = createFileRoute('/demo/start/ssr/non-streaming-ssr-db-router-cache')({
  component: DBTestPage,
  loader: async ({ context }) => {
    // サーバー側でTodosを取得し、Query Clientにキャッシュ
    // 注意: このページ専用のqueryKeyを使用（他のページとキャッシュを共有しないため）
    await context.queryClient.ensureQueryData({
      queryKey: ['todos-with-cache-metadata'],
      queryFn: () => getAllTodos(),
    })
  },
  server: {
    middleware: [authMiddleware],
  },
})

// すべてのTodoを取得（キャッシュ確認用にタイムスタンプを含める）
export const getAllTodos = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  const allTodos = await db.select().from(todos).all()

  // キャッシュ確認用のメタデータを追加
  return {
    todos: allTodos,
    metadata: {
      fetchedAt: new Date().toISOString(),
      timestamp: Date.now(),
    },
  }
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

function DBTestPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [renderCount, setRenderCount] = useState(0)

  // レンダリング回数をカウント
  useState(() => {
    setRenderCount((prev) => prev + 1)
  })

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

  // Todosを取得（ルーターキャッシュから取得される）
  // 注意: このページ専用のqueryKeyを使用（他のページとキャッシュを共有しないため）
  const {
    data: todoData,
    isLoading,
    dataUpdatedAt,
    isFetching,
  } = useQuery({
    queryKey: ['todos-with-cache-metadata'],
    queryFn: () => getAllTodos(),
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
  })

  const todoList = todoData?.todos ?? []
  const metadata = todoData?.metadata

  // Todo作成のMutation
  const createMutation = useMutation({
    mutationFn: (input: { title: string }) => createTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos-with-cache-metadata'] })
      createForm.reset()
    },
  })

  // Todo更新のMutation
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; title?: string; completed?: boolean }) => updateTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos-with-cache-metadata'] })
      setEditingId(null)
      editForm.reset()
    },
  })

  // Todo削除のMutation
  const deleteMutation = useMutation({
    mutationFn: (input: { id: number }) => deleteTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos-with-cache-metadata'] })
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
    deleteMutation.mutate({ id })
  }

  const startEdit = (id: number, title: string) => {
    setEditingId(id)
    editForm.reset({ title })
  }

  const cancelEdit = () => {
    setEditingId(null)
    editForm.reset()
  }

  // キャッシュをクリアする関数
  const handleClearCache = () => {
    queryClient.invalidateQueries({ queryKey: ['todos-with-cache-metadata'] })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <p className="text-center text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Non-streaming SSR DB Router Cache - CRUD Operations</h1>

      {/* ルーターキャッシュ情報 */}
      <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 p-4">
        <h2 className="mb-3 text-lg font-semibold text-blue-900">🔍 ルーターキャッシュ情報</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-blue-900">コンポーネントレンダリング回数:</span>
            <span className="text-blue-700">{renderCount}回</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-blue-900">データフェッチ時刻:</span>
            <span className="text-blue-700">{metadata?.fetchedAt ?? '未取得'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-blue-900">クライアント側更新時刻:</span>
            <span className="text-blue-700">{new Date(dataUpdatedAt).toISOString()}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-blue-900">現在フェッチ中:</span>
            <span className={isFetching ? 'text-yellow-600' : 'text-green-600'}>
              {isFetching ? 'はい（再取得中）' : 'いいえ（キャッシュ使用中）'}
            </span>
          </div>
          <div className="mt-3">
            <button
              onClick={handleClearCache}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              キャッシュをクリア（再フェッチ）
            </button>
          </div>
        </div>
      </div>

      {/* 新規作成フォーム */}
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
              disabled={createMutation.isPending}
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

      {/* Todoリスト */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Todoリスト ({todoList.length}件)</h2>
        {todoList.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Todoがありません。上のフォームから作成してください。</p>
        ) : (
          <div className="space-y-2">
            {todoList.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* 完了チェックボックス */}
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(todo.id, todo.completed)}
                  className="h-5 w-5 cursor-pointer"
                />

                {/* タイトル表示/編集 */}
                {editingId === todo.id ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      {...editForm.register('title')}
                      className="w-full rounded border border-gray-300 px-3 py-1 focus:border-blue-500 focus:outline-none"
                    />
                    {editForm.formState.errors.title && (
                      <p className="mt-1 text-xs text-red-500">{editForm.formState.errors.title.message}</p>
                    )}
                  </div>
                ) : (
                  <span className={`flex-1 ${todo.completed ? 'text-gray-400 line-through' : ''}`}>{todo.title}</span>
                )}

                {/* アクションボタン */}
                <div className="flex gap-2">
                  {editingId === todo.id ? (
                    <>
                      <button
                        onClick={editForm.handleSubmit((data) => handleUpdate(todo.id, data))}
                        disabled={updateMutation.isPending}
                        className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600 disabled:bg-gray-300"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(todo.id, todo.title)}
                        className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        disabled={deleteMutation.isPending}
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
        )}
      </div>

      {/* ナビゲーションテスト用リンク */}
      <div className="mt-8 rounded-lg border border-purple-300 bg-purple-50 p-4">
        <h3 className="mb-3 font-semibold text-purple-900">🔗 キャッシュテスト用ナビゲーション</h3>
        <p className="mb-3 text-sm text-purple-700">
          他のページに遷移してから戻ってくると、キャッシュされたデータが即座に表示されます。
        </p>
        <div className="flex gap-2">
          <a href="/" className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700">
            ホームへ
          </a>
          <a
            href="/demo/start/ssr/non-streaming-ssr-db"
            className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
          >
            別のDBページへ
          </a>
        </div>
      </div>

      {/* デバッグ情報 */}
      <div className="mt-8 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold">データベース情報</h3>
        <pre className="overflow-auto text-xs">{JSON.stringify({ todos: todoList, metadata }, null, 2)}</pre>
      </div>
    </div>
  )
}
