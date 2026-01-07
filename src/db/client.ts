import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import { createServerOnlyFn } from '@tanstack/react-start'
import { schema } from './schema'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

/**
 * Drizzle ORM の DB インスタンスをキャッシュして返す
 *
 * Cloudflare Workers の isolate スコープでキャッシュされるため、
 * 同じ isolate 内の複数リクエストで再利用される
 *
 * @returns Drizzle D1 Database インスタンス
 */
let cachedDb: DrizzleD1Database<typeof schema> | null = null

export const getDb = createServerOnlyFn(() => {
  if (!cachedDb) {
    cachedDb = drizzle(env.DB, { schema })
  }
  return cachedDb
})
