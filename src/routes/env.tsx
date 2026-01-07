import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'

// Server function to get Cloudflare environment variables
const getEnvVars = createServerFn({ method: 'GET' }).handler(() => {
  return {
    // シリアライズ可能なプロパティのみを抽出
    environment: {
      ENVIRONMENT: env.ENVIRONMENT,
      // 他に必要な環境変数があればここに追加
    },
    // Vite環境変数（ビルド時）
    viteMode: import.meta.env.MODE || 'unknown',
    viteDev: import.meta.env.DEV,
    viteProd: import.meta.env.PROD,
  }
})

export const Route = createFileRoute('/env')({
  component: EnvPage,
  loader: async () => {
    const envVars = await getEnvVars()
    return envVars
  },
})

function EnvPage() {
  const data = Route.useLoaderData()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">環境変数設定状況</h1>

      <div className="space-y-6">
        {/* Current Environment */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">現在の環境</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground font-medium">Cloudflare ENVIRONMENT:</span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  data.environment.ENVIRONMENT === 'production'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : data.environment.ENVIRONMENT === 'staging'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : // develop
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                }`}
              >
                {data.environment.ENVIRONMENT}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground font-medium">Vite Mode (ビルド時):</span>
              <span className="bg-muted rounded px-3 py-1 font-mono text-sm">{data.viteMode}</span>
            </div>
          </div>
        </section>

        {/* Vite Environment Variables */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">Vite環境変数（ビルド時）</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            これらの値はビルド時に埋め込まれ、ランタイムでは変更できません。
          </p>
          <div className="space-y-2">
            <div className="bg-muted rounded p-3">
              <div className="font-mono text-sm font-semibold">MODE</div>
              <div className="text-muted-foreground mt-1 font-mono text-sm">{data.viteMode}</div>
            </div>
            <div className="bg-muted rounded p-3">
              <div className="font-mono text-sm font-semibold">DEV</div>
              <div className="text-muted-foreground mt-1 font-mono text-sm">{String(data.viteDev)}</div>
            </div>
            <div className="bg-muted rounded p-3">
              <div className="font-mono text-sm font-semibold">PROD</div>
              <div className="text-muted-foreground mt-1 font-mono text-sm">{String(data.viteProd)}</div>
            </div>
          </div>
        </section>

        {/* Environment Configuration Info */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">環境設定情報</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Development (develop)</h3>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>App名: tanstack-start-app-develop</li>
                <li>ENVIRONMENT: develop</li>
                <li>
                  デプロイ: <code className="bg-muted rounded px-1">pnpm deploy:dev</code>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Staging</h3>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>App名: tanstack-start-app-staging</li>
                <li>ENVIRONMENT: staging</li>
                <li>
                  デプロイ: <code className="bg-muted rounded px-1">pnpm deploy:staging</code>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Production</h3>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>App名: tanstack-start-app</li>
                <li>ENVIRONMENT: production</li>
                <li>
                  デプロイ: <code className="bg-muted rounded px-1">pnpm deploy</code>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Usage Example */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">環境変数の使用方法</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Cloudflare環境変数へのアクセス（サーバー側）</h3>
              <pre className="bg-muted overflow-x-auto rounded p-4 text-sm">
                <code>{`import { env } from 'cloudflare:workers'

const serverFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Cloudflareのランタイム環境変数にアクセス
    const environment = env.ENVIRONMENT
    const apiUrl = env.API_URL
    return { environment, apiUrl }
  })`}</code>
              </pre>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Vite環境変数へのアクセス（ビルド時）</h3>
              <pre className="bg-muted overflow-x-auto rounded p-4 text-sm">
                <code>{`// クライアント・サーバー両方で使用可能（ビルド時に埋め込まれる）
const mode = import.meta.env.MODE
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD`}</code>
              </pre>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">環境変数の追加方法</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                wrangler.jsoncの各環境のvarsセクションに追加してください：
              </p>
              <pre className="bg-muted overflow-x-auto rounded p-4 text-sm">
                <code>{`{
  "vars": {
    "ENVIRONMENT": "production",
    "API_URL": "https://api.example.com"
  },
  "env": {
    "develop": {
      "name": "tanstack-start-app-develop",
      "vars": {
        "ENVIRONMENT": "develop",
        "API_URL": "https://api-dev.example.com"
      }
    }
  }
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-6">
          <h2 className="mb-4 text-2xl font-semibold">重要な注意事項</h2>
          <ul className="list-inside list-disc space-y-2 text-sm">
            <li>
              <strong>Cloudflare環境変数</strong>: wrangler.jsoncで設定。ランタイムで動的に取得可能。
            </li>
            <li>
              <strong>Vite環境変数</strong>: ビルド時に埋め込まれ、ランタイムでは変更不可。
            </li>
            <li>
              <strong>セキュリティ</strong>:
              機密情報（APIキー、トークンなど）は必ずCloudflareのSecretsとして管理してください。
            </li>
            <li>
              <strong>型生成</strong>: <code className="bg-muted rounded px-1">pnpm typegen</code>{' '}
              でCloudflare環境変数の型定義を生成できます。
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
