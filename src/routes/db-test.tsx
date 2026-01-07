import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createTodo, deleteTodo, getAllTodos, updateTodo } from '@/server/db-test'

export const Route = createFileRoute('/db-test')({
  component: DBTestPage,
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
