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

## Common Commands

```bash
# Development server (runs on port 3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Linting
pnpm lint

# Formatting (check only)
pnpm format

# Format and lint fix
pnpm check

# Deploy to Cloudflare
pnpm deploy
```

## Architecture

### Routing System

Routes are **file-based** and located in `src/routes/`. The route tree is automatically generated in `src/routeTree.gen.ts` by the `@tanstack/router-plugin`.

- `src/routes/__root.tsx`: Root layout component that wraps all pages
- Route files follow TanStack Router conventions (e.g., `index.tsx`, `about.tsx`)
- Routes can define `loader`, `component`, and other route options

### Router Setup

The router is created in `src/router.tsx` using the `getRouter()` function, which:

1. Initializes TanStack Query context
2. Creates router with generated route tree
3. Sets up SSR-Query integration via `setupRouterSsrQueryIntegration()`
4. Configures `defaultPreload: 'intent'` for prefetching

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

### DevTools

Integrated devtools (accessible in development):

- TanStack Devtools (unified panel)
- TanStack Router Devtools
- TanStack Query Devtools

All devtools are rendered in the root document (`__root.tsx`) via `<TanStackDevtools>`.

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` → `./src/*` (configured in `tsconfig.json` and enabled via `vite-tsconfig-paths`)
- Module resolution: `bundler`
- Target: ES2022

## Code Formatting

Prettier is configured with:

- Import sorting via `@trivago/prettier-plugin-sort-imports`
- Tailwind class sorting via `prettier-plugin-tailwindcss`
- Import order: React → Router libraries → Third-party → Local (`~/`) → Relative
- Custom Tailwind functions: `clsx`, `cn`, `twmerge`, `cva`

## Cloudflare Deployment

- Configured in `wrangler.jsonc`
- Uses `@tanstack/react-start/server-entry` as main entry
- Requires `nodejs_compat` compatibility flag
- Deploy with `pnpm deploy` (builds then runs `wrangler deploy`)

## Vite Plugins

The following Vite plugins are configured (in order):

1. `@tanstack/devtools-vite` - Devtools integration
2. `@cloudflare/vite-plugin` - Cloudflare Workers support
3. `vite-tsconfig-paths` - Path alias resolution
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
