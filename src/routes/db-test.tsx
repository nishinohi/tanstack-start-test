import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import type { NewTodo } from '@/db/schema/schema'
import { todos } from '@/db/schema/schema'

export const Route = createFileRoute('/db-test')({
  component: DBTestPage,
})

// すべてのTodoを取得
export const getAllTodos = createServerFn({ method: 'GET' }).handler(async () => {
  const db = drizzle(env.DB)
  const allTodos = await db.select().from(todos).all()
  return allTodos
})

// 新しいTodoを作成
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator((input: NewTodo) => input)
  .handler(async ({ data }) => {
    const db = drizzle(env.DB)
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
  .inputValidator((input: { id: number; title?: string; completed?: boolean }) => input)
  .handler(async ({ data }) => {
    const db = drizzle(env.DB)
    const updateData: Partial<NewTodo> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.completed !== undefined) updateData.completed = data.completed

    const result = await db.update(todos).set(updateData).where(eq(todos.id, data.id)).returning()
    return result[0]
  })

// Todoを削除
export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const db = drizzle(env.DB)
    await db.delete(todos).where(eq(todos.id, data.id))
    return { success: true }
  })

function DBTestPage() {
  const queryClient = useQueryClient()
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Todosを取得
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: () => getAllTodos(),
  })

  // Todo作成のMutation
  const createMutation = useMutation({
    mutationFn: (input: { title: string }) => createTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setNewTodoTitle('')
    },
  })

  // Todo更新のMutation
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; title?: string; completed?: boolean }) => updateTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setEditingId(null)
      setEditingTitle('')
    },
  })

  // Todo削除のMutation
  const deleteMutation = useMutation({
    mutationFn: (input: { id: number }) => deleteTodo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodoTitle.trim()) {
      createMutation.mutate({ title: newTodoTitle.trim() })
    }
  }

  const handleUpdate = (id: number) => {
    if (editingTitle.trim()) {
      updateMutation.mutate({ id, title: editingTitle.trim() })
    }
  }

  const handleToggleComplete = (id: number, completed: boolean) => {
    updateMutation.mutate({ id, completed: !completed })
  }

  const handleDelete = (id: number) => {
    if (confirm('このTodoを削除しますか？')) {
      deleteMutation.mutate({ id })
    }
  }

  const startEdit = (id: number, title: string) => {
    setEditingId(id)
    setEditingTitle(title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle('')
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
      <h1 className="mb-8 text-3xl font-bold">D1 Database Test - CRUD Operations</h1>

      {/* 新規作成フォーム */}
      <div className="mb-8 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">新しいTodoを作成</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Todoのタイトルを入力..."
            className="flex-1 rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newTodoTitle.trim()}
            className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {createMutation.isPending ? '作成中...' : '作成'}
          </button>
        </form>
      </div>

      {/* Todoリスト */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Todoリスト ({todos.length}件)</h2>
        {todos.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Todoがありません。上のフォームから作成してください。</p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
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
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-3 py-1 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className={`flex-1 ${todo.completed ? 'text-gray-400 line-through' : ''}`}>{todo.title}</span>
                )}

                {/* アクションボタン */}
                <div className="flex gap-2">
                  {editingId === todo.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(todo.id)}
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

      {/* デバッグ情報 */}
      <div className="mt-8 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold">データベース情報</h3>
        <pre className="overflow-auto text-xs">{JSON.stringify(todos, null, 2)}</pre>
      </div>
    </div>
  )
}
