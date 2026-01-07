import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { todos } from '../db/schema/schema'
import type { NewTodo } from '../db/schema/schema'

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
