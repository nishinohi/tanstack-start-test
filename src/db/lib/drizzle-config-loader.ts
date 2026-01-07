import dotenv from 'dotenv'

export type DBMode = 'local' | 'staging' | 'production' | 'develop' | 'start'

type D1RemoteCredentials = {
  accountId: string
  databaseId: string
  token: string
}

type D1LocalCredentials = {
  url: string
}

export function loadD1Credentials(mode: Exclude<DBMode, 'local'>): D1RemoteCredentials
export function loadD1Credentials(mode: Extract<DBMode, 'local'>): D1LocalCredentials
export function loadD1Credentials(mode: DBMode): D1LocalCredentials | D1RemoteCredentials {
  dotenv.config({ path: `.env.${mode}` })

  const url = process.env.D1_LOCAL_URL
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const databaseId = process.env.D1_ID
  const token = process.env.CLOUDFLARE_TOKEN

  if (mode === 'local' || mode === 'start') {
    if (!url)
      throw Error(
        `The DB URL is not set. Please execute the following command to set a value for D1_LOCAL_URL in .env.${mode}.
    $ echo "D1_LOCAL_URL='./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/[your_database_id].sqlite'" >> .env.${mode}`,
      )

    return { url }
  }
  if (!accountId || !databaseId || !token)
    throw Error(
      `dbCredentials is not set. Please execute the following command to set dbCredentials values in .env.${mode}.
    $ cat > .env.${mode} << EOF
CLOUDFLARE_ACCOUNT_ID='your_account_id'
D1_ID='your_database_id'
CLOUDFLARE_API_TOKEN='your_api_token'
EOF`,
    )

  return { accountId, databaseId, token }
}
