import { createAuthClient } from 'better-auth/react'

// クライアントサイドでは window.location.origin を使用
const baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

export const authClient = createAuthClient({
  baseURL,
})
