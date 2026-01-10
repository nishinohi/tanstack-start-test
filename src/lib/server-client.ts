import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import { createServerOnlyFn } from '@tanstack/react-start'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { schema } from '@/db/schema'

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

/**
 * Batter Auth インスタンスをキャッシュして返す
 *
 * Cloudflare Workers の isolate スコープでキャッシュされるため、
 * 同じ isolate 内の複数リクエストで再利用される
 *
 * @returns Better Auth インスタンス
 */
type Auth = ReturnType<typeof betterAuth>

let cachedAuth: Auth | null = null

export const getAuth = createServerOnlyFn(() => {
  if (cachedAuth) return cachedAuth

  const db = getDb()

  cachedAuth = betterAuth({
    secret: env.SESSION_SECRET,
    baseURL: env.BASE_URL,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
    }),
    socialProviders: {
      google: {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
      },
    },
    secondaryStorage: {
      get: async (key) => {
        const value = await env.SESSION_KV.get(key)
        return value
      },
      set: async (key, value, ttl) => {
        if (ttl) {
          await env.SESSION_KV.put(key, value, {
            expiration: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000),
            expirationTtl: ttl,
          })
          return
        }
        await env.SESSION_KV.put(key, value)
      },
      delete: async (key) => {
        await env.SESSION_KV.delete(key)
      },
    },
  })
  return cachedAuth
})
