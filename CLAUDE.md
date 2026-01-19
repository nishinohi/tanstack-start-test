# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Technology Stack

This is a **TanStack Start** application with the following key technologies:

- **TanStack Start**: Full-stack React framework with SSR support
- **TanStack Router**: File-based routing with type-safe navigation
- **TanStack Query**: Server state management with SSR integration
- **React 19**: Latest React with React Server Components support
- **Tailwind CSS v4**: Utility-first CSS framework
- **Vite**: Build tool and dev server
- **Cloudflare**: Deployment target (via Wrangler)
- **Cloudflare D1**: SQLite database for serverless applications
- **Drizzle ORM**: TypeScript ORM for database operations
- **Better Auth**: Authentication library with Drizzle adapter
- **React Hook Form**: Form management with validation
- **Zod**: TypeScript-first schema validation
- **Shadcn/ui**: UI component library (New York style)

## Common Commands

```bash
# Development server (runs on port 3000)
pnpm dev

# Build for production
pnpm build

# Build for preview environment (local testing with preview DB)
pnpm build:preview

# Build with bundle size analysis (opens stats.html in browser)
pnpm build:analyze

# Preview production build (runs on port 4173)
pnpm preview

# Run tests (Vitest)
pnpm test

# Run specific test file
pnpm test src/path/to/test.test.ts

# Run tests matching a pattern
pnpm test -t "pattern"

# Run tests in watch mode
pnpm vitest

# Type checking (TypeScript)
pnpm typecheck

# Linting (ESLint)
pnpm lint

# Formatting (Prettier - check only)
pnpm format

# Format and lint fix (runs prettier --write + eslint --fix)
pnpm check

# Note: Automatic deployment via GitHub Actions:
# - main branch → production
# - staging branch → staging environment
# - develop branch → develop environment

# Generate Cloudflare Worker types
pnpm typegen:cf

# Add Shadcn components
pnpm dlx shadcn@latest add <component-name>

# Database commands (Drizzle ORM with Cloudflare D1)
pnpm db:generate              # Generate migration files from schema
pnpm db:migrate:local         # Run migrations (local D1)
pnpm db:migrate:preview       # Run migrations (preview environment - local with separate DB)
pnpm db:migrate:dev           # Run migrations (develop environment, remote)
pnpm db:migrate:stg           # Run migrations (staging environment, remote)
pnpm db:migrate:prod          # Run migrations (production environment, remote)
pnpm db:view:local            # Open Drizzle Studio (local)
pnpm db:view:preview          # Open Drizzle Studio (preview environment)
pnpm db:view:dev              # Open Drizzle Studio (develop environment)
pnpm db:view:stg              # Open Drizzle Studio (staging environment)
pnpm db:view:prod             # Open Drizzle Studio (production environment)
pnpm db:drop:local            # Drop all tables (local, uses local flag)
pnpm db:drop:preview          # Drop all tables (preview environment, uses local flag)
pnpm db:drop:dev              # Drop all tables (develop environment, remote)
pnpm db:drop:stg              # Drop all tables (staging environment, remote)
pnpm db:drop:prod             # Warning message only - must execute manually
```

## Architecture

### Routing System

Routes are **file-based** and located in `src/routes/`. The route tree is automatically generated in `src/routeTree.gen.ts` by the `@tanstack/router-plugin`.

- `src/routes/__root.tsx`: Root layout component that wraps all pages
- Route files follow TanStack Router conventions (e.g., `index.tsx`, `about.tsx`)
- Routes can define `loader`, `component`, and other route options
- **Demo files**: Files in `src/routes/demo/` are examples and can be safely deleted

### Router Setup

The router is created in `src/router.tsx` using the `getRouter()` function, which:

1. Initializes TanStack Query context via `TanstackQuery.getContext()`
2. Creates router with generated route tree
3. Sets up SSR-Query integration via `setupRouterSsrQueryIntegration()`
4. Configures `defaultPreload: 'intent'` for prefetching on hover/focus

### TanStack Query Integration

TanStack Query is integrated in `src/integrations/tanstack-query/`:

- `root-provider.tsx`: Exports `getContext()` and `Provider` for query client setup
- `devtools.tsx`: Query devtools configuration
- The query client is passed through router context (type: `MyRouterContext`)

### Server Functions

Server functions are created using `createServerFn()` from `@tanstack/react-start`:

- They can be called from client components
- Used in route loaders for SSR data fetching
- See `src/routes/demo/start.server-funcs.tsx` for examples
- Server functions for database operations are typically placed in `src/server/` directory

### Authentication (Better Auth)

Better Auth is integrated for authentication with Drizzle adapter:

- Configuration file: `auth.ts` in project root
- Uses `better-auth/adapters/drizzle` with SQLite provider
- Auth schema is defined in `src/db/schema/auth.ts`
- The `auth.ts` file is a configuration file for schema generation (database instance is not required)
- Session storage: Uses Cloudflare KV via `SESSION_KV` binding for server-side session management
- BASE_URL configuration: Set via `wrangler.jsonc` for each environment, used for authentication callbacks

### Database Layer (Drizzle ORM + Cloudflare D1)

The database layer uses Drizzle ORM with Cloudflare D1 (serverless SQLite):

- **Schema definition**: `src/db/schema/` - Define database tables using Drizzle's schema syntax
  - Export type inference using `typeof tableName.$inferSelect` and `typeof tableName.$inferInsert`
- **Migration files**: `migrations/` - Auto-generated SQL migration files (committed to git)
- **Drizzle configuration**: `src/db/config/drizzle-*.config.ts` - Environment-specific configs for each deployment environment
  - Each config uses `loadD1Credentials()` from `src/db/lib/drizzle-config-loader.ts`
- **Server functions**: Database operations are exposed via server functions in `src/server/`
  - Use `drizzle(env.DB)` to get database instance (env.DB is the D1 binding from Cloudflare Workers)
  - Import from `cloudflare:workers` to access environment bindings
- **D1 bindings**: Configured in `wrangler.jsonc` with separate databases per environment

**Environment-specific database setup:**

Each environment has its own D1 database instance configured in `wrangler.jsonc`:

- `local`: Local D1 instance for development (via `pnpm dev`, database: `tanstack-test-local`)
- `preview`: Local preview build testing environment (uses separate preview database locally, database: `tanstack-test-preview`)
- `develop`: Remote D1 instance for develop environment (database: `tanstack-test-develop`)
- `staging`: Remote D1 instance for staging environment (database: `tanstack-test-staging`)
- `production`: Remote D1 instance for production environment (database: `tanstack-test`)

Note: The "preview" environment is for local testing of production builds (`pnpm build:preview` + `pnpm preview`). It uses wrangler's `--local` flag with a separate preview database instance.

**Drizzle configuration pattern:**

Drizzle configs use environment-specific credential loading:

- **Local/Preview environments**: Uses local SQLite file (`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`)
  - Requires `D1_LOCAL_URL` in `.env.local` or `.env.preview`
- **Remote environments** (develop/staging/production): Uses Cloudflare D1 API
  - Requires `CLOUDFLARE_ACCOUNT_ID`, `D1_ID`, `CLOUDFLARE_API_TOKEN` in respective `.env.*` files

### Styling

- Global styles in `src/styles.css`
- Tailwind CSS v4 integrated via `@tailwindcss/vite` plugin
- Utility functions in `src/lib/utils.ts` (includes `cn()` helper for class merging)
- Path alias `@/*` maps to `./src/*`
- Shadcn/ui components configured with:
  - Style: "new-york"
  - Base color: "zinc"
  - CSS variables enabled
  - Icon library: lucide-react
  - Component aliases: `@/components`, `@/components/ui`

### Form Handling

Form management uses React Hook Form with Zod validation:

- **React Hook Form**: Performant, flexible form library
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Zod integration for React Hook Form
- See demo files for examples of form validation patterns

### DevTools

Integrated devtools (accessible in development):

- TanStack Devtools (unified panel)
- TanStack Router Devtools
- TanStack Query Devtools

All devtools are rendered in the root document (`__root.tsx`) via `<TanStackDevtools>`.

## TypeScript Configuration

- Strict mode enabled with additional checks:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`
  - `noUncheckedSideEffectImports: true`
- Path alias: `@/*` → `./src/*` (configured in `tsconfig.json` and enabled via `vite-tsconfig-paths`)
- Module resolution: `bundler`
- Target: ES2022
- JSX: react-jsx (React 17+ new JSX transform)

## Code Quality Tools

### ESLint

- Based on `@tanstack/eslint-config`
- Additional plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import-x`
- Key rules:
  - `react/react-in-jsx-scope`: off (React 17+ JSX transform)
  - `react/prop-types`: off (using TypeScript)
  - Import sorting handled by Prettier (not ESLint)

### Prettier

Configuration in `.prettierrc`:

- Print width: 120
- Single quotes: true
- Tab width: 2
- Semi: false
- Plugins:
  - `prettier-plugin-tailwindcss`: Sorts Tailwind classes
- Custom Tailwind functions: `clsx`, `cn`, `twmerge`, `cva`
- Import sorting: Not configured (package includes `@trivago/prettier-plugin-sort-imports` but it's not enabled)

### Stylelint

- Extends `stylelint-config-standard`
- Configured to ignore Tailwind CSS at-rules: `@tailwind`, `@apply`, `@layer`, `@theme`, etc.
- Ignores Tailwind CSS functions: `theme()`

### Textlint

- For Japanese text linting (if applicable)
- Configured with presets: `ja-spacing`, `jtf-style`, `ja-technical-writing`

### Git Hooks (Lefthook)

Pre-commit hooks run in parallel:

1. **Prettier** (priority 1): Auto-formats staged files matching `*.{js,jsx,ts,tsx,json,css,md}`
   - Excludes: `src/routeTree.gen.ts`
2. **ESLint** (priority 2): Auto-fixes staged files matching `*.{js,jsx,ts,tsx}`
   - Excludes: `eslint.config.js`, `vite.config.ts`, `src/routeTree.gen.ts`
3. **Stylelint** (priority 2): Auto-fixes staged `*.css` files

All hooks use `stage_fixed: true` to automatically stage fixes.

## Testing

- Framework: **Vitest** with **jsdom** environment
- Testing Library: `@testing-library/react` and `@testing-library/dom`
- Run tests: `pnpm test`
- No separate vitest config file; Vitest uses defaults or inline config

## Cloudflare Deployment

- Configured in `wrangler.jsonc`
- App name: `tanstack-start-app`
- Uses `@tanstack/react-start/server-entry` as main entry
- Requires `nodejs_compat` compatibility flag
- Compatibility date: 2025-09-02
- Five environments configured in `wrangler.jsonc`:
  - **Local**: `tanstack-start-app-local` (development via `pnpm dev`, uses `CLOUDFLARE_ENV=local`)
  - **Preview**: `tanstack-start-app-preview` (local preview build testing)
  - **Develop**: `tanstack-start-app-develop` (remote development environment)
  - **Staging**: `tanstack-start-app-staging` (remote staging environment)
  - **Production**: `tanstack-start-app` (default, remote production environment)

**IMPORTANT: Environment Selection with Vite Plugin**

When using `@cloudflare/vite-plugin`, you **MUST** use the `CLOUDFLARE_ENV` environment variable to specify which environment to use. The standard wrangler `--env` flag is **NOT supported**.

- ✅ **Correct**: `CLOUDFLARE_ENV=local pnpm dev`
- ❌ **Incorrect**: `wrangler dev --env local`

This is already configured in package.json scripts. See [Cloudflare documentation](https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/) for details.

For a comprehensive guide, see [docs/cloudflare-environment-setup.md](./docs/cloudflare-environment-setup.md).

- Environment variables set via `vars` in `wrangler.jsonc`:
  - `ENVIRONMENT`: Current environment name (local/preview/develop/staging/production)
  - `BASE_URL`: Base URL for the application (used for authentication callbacks, etc.)
- Cloudflare bindings:
  - **D1 Database** (`DB` binding): SQLite database for data persistence
  - **KV Namespace** (`SESSION_KV` binding): Key-Value store for session management
- Local environment variables should be stored in `.dev.vars` or `.env` files:
  - `.dev.vars` / `.env`: Default environment variables for local development
  - `.dev.vars.local` / `.env.local`: Local environment-specific variables (loaded when `CLOUDFLARE_ENV=local`)
  - Note: Choose either `.dev.vars` or `.env` (not both). If `.dev.vars` exists, `.env` values are ignored

### GitHub Actions Automatic Deployment

Automatic deployment is configured via `.github/workflows/deploy.yml`:

- **main branch** push → Deploy to production environment
- **staging branch** push → Deploy to staging environment
- **develop branch** push → Deploy to develop environment

**Required GitHub Secrets:**

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers deployment permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

**Setup Instructions:**

1. Generate API token: Cloudflare Dashboard → My Profile → API Tokens → Create Token
   - Use "Edit Cloudflare Workers" template
   - Or create custom token with permissions: `Workers Scripts:Edit`, `Workers Routes:Edit`
2. Get Account ID: Cloudflare Dashboard → Workers & Pages → Overview (right sidebar)
3. Add secrets to GitHub: Repository Settings → Secrets and variables → Actions → New repository secret

**Notes:**

- The workflow uses `pnpm/action-setup@v4` without specifying a version, which automatically uses the version defined in package.json's `packageManager` field (pnpm@10.27.0)
- Node.js version is set to 24.11 to match the `engines` field in package.json
- This ensures consistency between local development and CI/CD environments

### Manual Deployment

For manual deployments, use the Wrangler CLI directly:

```bash
# Deploy to production (default)
wrangler deploy

# Deploy to specific environments
wrangler deploy --env develop
wrangler deploy --env staging
```

**Prerequisites:**

- Ensure you're authenticated: `wrangler login` or set `CLOUDFLARE_API_TOKEN` environment variable
- Build the application first: `pnpm build`

## Vite Plugins

The following Vite plugins are configured (in order):

1. `@tanstack/devtools-vite` - Devtools integration
2. `@cloudflare/vite-plugin` - Cloudflare Workers support (SSR environment)
3. `vite-tsconfig-paths` - Path alias resolution (`@/*`)
4. `@tailwindcss/vite` - Tailwind CSS v4
5. `@tanstack/react-start/plugin/vite` - TanStack Start
6. `@vitejs/plugin-react` - React support
7. `rollup-plugin-visualizer` - Bundle size analysis (enabled via `ANALYZE=true` env var)
   - Generates `./dist/stats.html` with interactive visualization
   - Shows gzip and brotli sizes
   - Automatically opens in browser after build

## Key Patterns

### Route Definition

```typescript
export const Route = createFileRoute('/path')({
  component: Component,
  loader: async () => {
    /* fetch data */
  },
})
```

### Server Functions

```typescript
const serverFn = createServerFn({ method: 'GET' }).handler(async () => {
  /* server-side logic */
})
```

### Database Operations with Drizzle

```typescript
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { myTable } from '@/db/schema/schema'

export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  const db = drizzle(env.DB)
  const result = await db.select().from(myTable).all()
  return result
})
```

### Router Context

The router context includes the TanStack Query client. Access it in routes via:

```typescript
interface MyRouterContext {
  queryClient: QueryClient
}
```

### Class Name Merging

Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes:

```typescript
import { cn } from '@/lib/utils'

cn('text-red-500', someCondition && 'font-bold')
```

## Project Structure

```
src/
├── components/        # React components (Shadcn/ui components in ui/)
├── data/             # Data files
├── db/               # Database layer (Drizzle ORM)
│   ├── config/       # Environment-specific Drizzle configs
│   ├── lib/          # Database utilities (credential loader)
│   ├── schema/       # Database schema definitions
│   └── seed/         # Database seed files and utilities
├── integrations/     # Third-party integrations
│   └── tanstack-query/
├── lib/              # Utility functions (utils.ts)
├── routes/           # File-based routes (auto-generates routeTree.gen.ts)
│   ├── __root.tsx    # Root layout
│   ├── index.tsx     # Home page
│   └── demo/         # Demo files (can be deleted)
├── router.tsx        # Router initialization
├── server/           # Server-side functions (database operations, etc.)
└── styles.css        # Global styles (Tailwind CSS)

migrations/           # Auto-generated database migration files
```

## Environment Variables

- **Local development**: Create a `.dev.vars` or `.env` file in the root
  - For environment-specific variables, create `.dev.vars.local` or `.env.local`
  - The `CLOUDFLARE_ENV` variable controls which environment configuration is used (set to `local` in `pnpm dev`)
- **Deployment variables**: Configure in `wrangler.jsonc` under `vars` (production) or `env.<environment>.vars` (per environment)
- **Built-in environment variables**: Automatically set based on the selected environment:
  - `ENVIRONMENT`: Current environment name (local/preview/develop/staging/production)
  - `BASE_URL`: Base URL for the application
    - `http://localhost:3000` for local
    - `http://localhost:4173` for preview
    - `https://tanstack-start-app-develop.tomoya0209.workers.dev` for develop
    - `https://tanstack-start-app-staging.tomoya0209.workers.dev` for staging
    - `https://tanstack-start-app.tomoya0209.workers.dev` for production

### Database Credential Environment Variables

For Drizzle migration and studio commands, create environment-specific `.env.*` files:

- **Local/Preview environments** (`.env.local`, `.env.preview`):

  ```bash
  D1_LOCAL_URL='./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/[your_database_id].sqlite'
  ```

- **Remote environments** (`.env.develop`, `.env.staging`, `.env.production`):

  ```bash
  CLOUDFLARE_ACCOUNT_ID='your_account_id'
  D1_ID='your_database_id'
  CLOUDFLARE_API_TOKEN='your_api_token'
  ```

These are used by `src/db/lib/drizzle-config-loader.ts` to connect to the appropriate database for migrations and Drizzle Studio.
