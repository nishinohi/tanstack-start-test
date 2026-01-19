import { createFileRoute, useRouter } from '@tanstack/react-router'
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

export const Route = createFileRoute('/demo/start/ssr/non-streaming-ssr-db')({
  component: DBTestPage,
  loader: () => getAllTodos(),
  server: {
    middleware: [authMiddleware],
  },
  gcTime: 0,
  pendingComponent: () => <div className="h-60 w-60 bg-red-700 text-xl font-bold text-white">loading...</div>,
  pendingMs: 100,
  pendingMinMs: 3000,
})

// すべてのTodoを取得
export const getAllTodos = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  const allTodos = await db.select().from(todos).all()
  return allTodos
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
  const router = useRouter()
  const todoList = Route.useLoaderData()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleCreate = async (data: TodoFormData) => {
    setIsSubmitting(true)
    try {
      await createTodo({ data: { title: data.title } })
      createForm.reset()
      // ルーターを無効化してloaderを再実行
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id: number, data: TodoFormData) => {
    setIsSubmitting(true)
    try {
      await updateTodo({ data: { id, title: data.title } })
      setEditingId(null)
      editForm.reset()
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = async (id: number, completed: boolean) => {
    setIsSubmitting(true)
    try {
      await updateTodo({ data: { id, completed: !completed } })
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    setIsSubmitting(true)
    try {
      await deleteTodo({ data: { id } })
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
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
      <h1 className="mb-8 text-3xl font-bold">Non-streaming SSR DB - CRUD Operations</h1>

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
                  disabled={isSubmitting}
                  className="h-5 w-5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />

                {/* タイトル表示/編集 */}
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

                {/* アクションボタン */}
                <div className="flex gap-2">
                  {editingId === todo.id ? (
                    <>
                      <button
                        onClick={editForm.handleSubmit((data) => handleUpdate(todo.id, data))}
                        disabled={isSubmitting}
                        className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600 disabled:bg-gray-300"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSubmitting}
                        className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600 disabled:bg-gray-300"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(todo.id, todo.title)}
                        disabled={isSubmitting}
                        className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:bg-gray-300"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
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
        )}
      </div>

      {/* デバッグ情報 */}
      <div className="mt-8 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold">データベース情報</h3>
        <pre className="overflow-auto text-xs">{JSON.stringify(todoList, null, 2)}</pre>
      </div>
    </div>
  )
}
