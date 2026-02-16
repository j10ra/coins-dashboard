# Coins Dashboard

Personal dashboard for [Coins.ph](https://coins.ph) account management. Quickly view buying averages, track trades, manage orders, and get AI-powered insights based on real-time market movements.

## Features

- **Portfolio Overview** — Real-time asset balances with price charts
- **Buying Average Tracker** — Cost basis per asset at a glance
- **Trade History & Orders** — View past trades, manage open orders
- **AI Market Insights** — Signals and analysis driven by market data
- **Secure Auth** — Supabase authentication with API key management

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | TanStack Start (SSR, server functions, streaming) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| Data | TanStack Query + Store |
| DB | Drizzle ORM + Postgres |
| Auth | Supabase |
| Charts | Recharts |
| API | Coins.ph REST + WebSocket Streams |

## Getting Started

```bash
pnpm install
pnpm dev
```

Runs on `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm test` | Run tests (vitest) |
| `pnpm check` | Lint + format (Biome) |
| `pnpm db:push` | Push schema to database |
