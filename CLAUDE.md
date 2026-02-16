# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Coins.ph dashboard — full-stack React app built with TanStack Start.

# shadcn instructions

Use the latest version of Shadcn to install new components, like this command to add a button component:

```bash
pnpm dlx shadcn@latest add button
```

## Commands

```bash
pnpm dev              # Dev server on port 3000
pnpm build            # Production build
pnpm test             # Run all tests (vitest)
pnpm vitest run <file> # Single test file
pnpm check            # Biome lint + format check
pnpm lint             # Biome lint only
pnpm format           # Biome format only
```

## Tech Stack

- **Framework:** TanStack Start (SSR, server functions, streaming) on Vite 7 + Nitro
- **Routing:** TanStack Router — file-based, type-safe (`src/routes/`)
- **Data:** TanStack Query for server state, TanStack Store for client state
- **Forms:** TanStack Form + Zod 4 validation
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Linting:** Biome (lint + format) — tabs, double quotes
- **Types:** TypeScript strict mode, `verbatimModuleSyntax`
- **React:** v19 with React Compiler (babel-plugin-react-compiler)
- **Env:** `@t3-oss/env-core` — server vars in `env.ts`, client vars prefixed `VITE_`

## Architecture

```
src/
  routes/           # File-based routing (auto-generates routeTree.gen.ts)
    __root.tsx      # Root layout — shell, head, providers, devtools
    index.tsx       # Home page
    demo/           # Demo routes (flat file convention: form.simple.tsx → /demo/form/simple)
  components/
    ui/             # shadcn/ui primitives (button, input, select, etc.)
    Header.tsx      # App header + sidebar nav
  integrations/
    tanstack-query/ # QueryClient provider + devtools config
  hooks/            # Custom hooks (form hooks, etc.)
  lib/              # Utilities (cn(), store helpers)
  env.ts            # Type-safe env vars
  router.tsx        # Router factory — creates router with query context
  styles.css        # Global Tailwind styles
```

### Key Patterns

- **Router context:** `QueryClient` injected via `getContext()` from `root-provider.tsx` → available in all route loaders
- **Route tree:** Auto-generated `routeTree.gen.ts` — never edit manually
- **Path alias:** `@/*` maps to `src/*`
- **SSR query:** QueryClient is a singleton on client, fresh instance per server request
- **shadcn/ui:** Components in `src/components/ui/`, use `cn()` from `@/lib/utils` for class merging

## API

- **Coins.ph REST API docs:** https://docs.coins.ph/rest-api/
- Use this as the source of truth for all Coins.ph API integration (endpoints, auth, payloads, error codes)

- **Coins.ph WebSocket Streams docs:** https://docs.coins.ph/web-socket-streams/
- Real-time market data streams (ticker, trades, depth, kline) via WebSocket

- **Coins.ph User Data Streams docs:** https://docs.coins.ph/user-data-stream/
- Real-time private user data streams (account updates, order updates, balance changes) via WebSocket


### API Error Codes

Coins.ph returns errors as `{"code":-XXXX,"msg":"..."}` — sometimes with HTTP 200. Key codes:

| Code | Meaning |
|------|---------|
| -1000 | Unknown error |
| -1002 | Unauthorized (missing API key header) |
| -1003 | Rate limit exceeded |
| -1015 | Too many orders |
| -1020 | Unsupported operation (read-only key, not functional) |
| -1021 | Timestamp outside recvWindow |
| -1022 | Invalid signature |
| -1025 | Invalid parameter value |
| -1103 | Unknown/missing required parameter |
| -1106 | Unnecessary parameter provided |
| -1131 | Insufficient balance |
| -2010 | New order rejected |
| -2011 | Cancel rejected |
| -2013 | No such order |
| -2015 | API key disabled |
| -9xxx | Filter failures (price/qty/notional validation) |

Full reference: https://docs.coins.ph/errors/

**Important:** API can return error JSON with HTTP 200 status. `coins.server.ts` uses `assertNoApiError()` to catch these.

## Conventions

- Functional components only, no class components
- Single quotes, no semicolons in source (Biome enforces double quotes — follow Biome config)
- Use `createFileRoute` for page routes, `createRootRouteWithContext` for root
- Prefer TanStack Query for async data, TanStack Store for shared client state
- Icons from `lucide-react`
- Always use shadcn/ui components for UI — never write raw HTML inputs, buttons, dialogs, etc.
