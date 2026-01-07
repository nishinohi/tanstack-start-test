import { defineConfig } from 'drizzle-kit'

import { loadD1Credentials } from '../lib/drizzle-config-loader'

const dbCredentials = loadD1Credentials('staging')

export default defineConfig({
  schema: './src/db/schema',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials,
})
