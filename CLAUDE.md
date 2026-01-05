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
- **Shadcn/ui**: UI component library (New York style)

## Common Commands

```bash
# Development server (runs on port 3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests (Vitest)
pnpm test

# Type checking (TypeScript)
pnpm typecheck

# Linting (ESLint)
pnpm lint

# Formatting (Prettier - check only)
pnpm format

# Format and lint fix (runs prettier --write + eslint --fix)
pnpm check

# Deploy to Cloudflare (manual deployment)
pnpm deploy          # Deploy to production
pnpm deploy:dev      # Deploy to develop environment
pnpm deploy:staging  # Deploy to staging environment

# Note: Automatic deployment via GitHub Actions is configured for:
# - main branch → production
# - staging branch → staging environment
# - develop branch → develop environment

# Generate Cloudflare Worker types
pnpm typegen:cf

# Add Shadcn components
pnpm dlx shadcn@latest add <component-name>
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
- Four environments configured:
  - **Local**: `tanstack-start-app-local` (development via `pnpm dev`, uses `CLOUDFLARE_ENV=local`)
  - **Production**: `tanstack-start-app` (default)
  - **Develop**: `tanstack-start-app-develop` (via `pnpm deploy:dev`)
  - **Staging**: `tanstack-start-app-staging` (via `pnpm deploy:staging`)
- Environment variables set via `vars` in `wrangler.jsonc`
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

## Vite Plugins

The following Vite plugins are configured (in order):

1. `@tanstack/devtools-vite` - Devtools integration
2. `@cloudflare/vite-plugin` - Cloudflare Workers support (SSR environment)
3. `vite-tsconfig-paths` - Path alias resolution (`@/*`)
4. `@tailwindcss/vite` - Tailwind CSS v4
5. `@tanstack/react-start/plugin/vite` - TanStack Start
6. `@vitejs/plugin-react` - React support

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
├── integrations/     # Third-party integrations
│   └── tanstack-query/
├── lib/              # Utility functions (utils.ts)
├── routes/           # File-based routes (auto-generates routeTree.gen.ts)
│   ├── __root.tsx    # Root layout
│   ├── index.tsx     # Home page
│   └── demo/         # Demo files (can be deleted)
├── router.tsx        # Router initialization
└── styles.css        # Global styles (Tailwind CSS)
```

## Environment Variables

- **Local development**: Create a `.dev.vars` or `.env` file in the root
  - For environment-specific variables, create `.dev.vars.local` or `.env.local`
  - The `CLOUDFLARE_ENV` variable controls which environment configuration is used (set to `local` in `pnpm dev`)
- **Deployment variables**: Configure in `wrangler.jsonc` under `vars` (production) or `env.<environment>.vars` (per environment)
- **ENVIRONMENT variable**: Automatically set based on the selected environment:
  - `local` during development (`pnpm dev`)
  - `production` for default deployment
  - `develop` via `pnpm deploy:dev`
  - `staging` via `pnpm deploy:staging`
