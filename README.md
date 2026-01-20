Welcome to your new TanStack app!

# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/people',
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json() as Promise<{
      results: {
        name: string
      }[]
    }>
  },
  component: () => {
    const data = peopleRoute.useLoaderData()
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    )
  },
})
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ...

const queryClient = new QueryClient()

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
})
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from '@tanstack/react-query'

import './App.css'

function App() {
  const { data } = useQuery({
    queryKey: ['people'],
    queryFn: () =>
      fetch('https://swapi.dev/api/people')
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  })

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
pnpm add @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store } from '@tanstack/store'

import './App.css'

const countStore = new Store(0)

function App() {
  const count = useStore(countStore)
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
    </div>
  )
}

export default App
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from '@tanstack/react-store'
import { Derived, Store } from '@tanstack/store'

import './App.css'

const countStore = new Store(0)

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
})
doubledStore.mount()

function App() {
  const count = useStore(countStore)
  const doubledCount = useStore(doubledStore)

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
      <div>Doubled - {doubledCount}</div>
    </div>
  )
}

export default App
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Project Initialization

This section explains how to set up the project for your own Cloudflare environment.

## 1. Configure Cloudflare Resources

Update `wrangler.jsonc` with your own Cloudflare resources:

### D1 Database

Create D1 databases for each environment:

```bash
# Create databases
wrangler d1 create tanstack-test           # Production
wrangler d1 create tanstack-test-develop   # Develop
wrangler d1 create tanstack-test-staging   # Staging
```

Update the `database_id` values in `wrangler.jsonc` with the IDs returned from the commands above.

### KV Namespace

Create KV namespaces for session storage:

```bash
# Create KV namespaces
wrangler kv namespace create SESSION_KV              # Production
wrangler kv namespace create SESSION_KV --env develop   # Develop
wrangler kv namespace create SESSION_KV --env staging   # Staging
```

Update the `id` values in `kv_namespaces` sections of `wrangler.jsonc`.

### Environment Variables

Update `vars` in `wrangler.jsonc`:

- `BASE_URL`: Your Workers URL (e.g., `https://your-app.your-subdomain.workers.dev`)

## 2. Set Up Local Development Secrets

Copy `.dev.vars.example` to `.dev.vars` and configure:

```bash
cp .dev.vars.example .dev.vars
```

```env
# .dev.vars - Wrangler secrets for local development
CLIENT_SECRET='Your Google OAuth secret'
CLIENT_ID='Your Google OAuth Client ID'
SESSION_SECRET='Random string for session encryption'
```

## 3. Set Up Environment Variables for Local Server

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

```env
# .env.local - Environment variables for local development
D1_LOCAL_URL='./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/your_sql_binary_name.sqlite'
VITE_BASE_URL=http://localhost:3000
```

> **Note**: The `D1_LOCAL_URL` path is generated after running `pnpm dev` for the first time. Check `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` for the actual SQLite file name.

## 4. Set Up Environment Variables for Remote D1 Migration

For running migrations against remote D1 databases, create environment-specific `.env` files:

```bash
cp .env.example .env.develop   # For develop environment
cp .env.example .env.staging   # For staging environment
cp .env.example .env.production # For production environment
```

```env
# .env.develop (or .env.staging, .env.production)
CLOUDFLARE_ACCOUNT_ID='your_cloudflare_account_id'
D1_ID='your_d1_database_id_for_this_environment'
CLOUDFLARE_D1_TOKEN='your_cloudflare_api_token_with_d1_read_and_write_permission'
```

## 5. Run Database Migrations

```bash
# Local development
pnpm db:migrate:local

# Remote environments
pnpm db:migrate:dev      # Develop
pnpm db:migrate:stg      # Staging
pnpm db:migrate:prod     # Production
```

## 6. Start Development Server

```bash
pnpm dev
```

# Deployment

This project is configured to deploy to Cloudflare Workers.

## Automatic Deployment via GitHub Actions

Automatic deployment is triggered on push to:

- **main** branch → Production environment
- **staging** branch → Staging environment
- **develop** branch → Develop environment

### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **CLOUDFLARE_API_TOKEN**: Generate at Cloudflare Dashboard → My Profile → API Tokens
   - Use "Edit Cloudflare Workers" template
   - Or create custom token with: `Workers Scripts:Edit`, `Workers Routes:Edit`

2. **CLOUDFLARE_ACCOUNT_ID**: Find at Cloudflare Dashboard → Workers & Pages → Overview

### Required GitHub Environments

Create the following environments in your GitHub repository (Settings → Environments):

1. **production** - For main branch deployments
2. **staging** - For staging branch deployments
3. **develop** - For develop branch deployments

For each environment, add the following variable (Environment variables, not secrets):

| Variable        | Description                           | Example                                       |
| --------------- | ------------------------------------- | --------------------------------------------- |
| `VITE_BASE_URL` | Base URL for the deployed application | `https://your-app.your-subdomain.workers.dev` |

Example values:

- **production**: `https://tanstack-start-app.your-subdomain.workers.dev`
- **staging**: `https://tanstack-start-app-staging.your-subdomain.workers.dev`
- **develop**: `https://tanstack-start-app-develop.your-subdomain.workers.dev`

## Manual Deployment

```bash
pnpm deploy          # Deploy to production
pnpm deploy:dev      # Deploy to develop environment
pnpm deploy:staging  # Deploy to staging environment
```

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).
