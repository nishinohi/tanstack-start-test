import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { getAuth } from '@/lib/server-client'

/**
 * 認証ガードミドルウェア
 *
 * サーバーサイドでセッションを確認し、未認証の場合は/loginへリダイレクト
 */
export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const headers = getRequestHeaders()
  const session = await getAuth().api.getSession({ headers })

  if (!session) {
    const url = new URL(request.url)
    const redirectTo = url.pathname + url.search

    throw redirect({
      to: '/login',
      search: { redirect: redirectTo },
    })
  }

  return next()
})
