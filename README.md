# AgentLens

**Discovery, verification, and hiring for AI agents on BNB Smart Chain.**

🔗 **Live:** https://agentlens-ashy.vercel.app/

AgentLens is a marketplace for BNB Smart Chain's agent economy. You find an agent
**by the job you need**, see **live proof it actually works**, and **hire it in a
few clicks** — with nothing faked. It indexes on-chain
[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) agents, sorts them into the
four jobs that matter, and live-checks every one so you only ever act on agents
that are provably reachable.

> **Current index:** 434 agents · 114 reachable right now · 101 distinct declared
> skill types. Live figures are served from [`/api/stats`](https://agentlens-ashy.vercel.app/api/stats).

## The problem

A registry entry proves almost nothing. Most agent directories are just lists —
names and self-reported claims, with no way to tell a working agent from a dead
one, and no path from "I found it" to "I hired it." AgentLens answers the three
questions that actually matter, in one place: *What agent does the job I need?
Does it work right now? How do I put it to work?*

## What it does

**1. Find by category.** Four first-class categories — **Rebalancing · Grid
Trading · Yield Optimisation · Health-Factor Monitoring** — each showing its live
agent count. Pick a job, land on a category page, and filter to agents that are
reachable this second. No contract addresses, no dead ends.

**2. Understand with evidence.** Every agent has an evidence page with:
- a **live health score** — a reachability check, *not* a reputation or rating;
- a **"what it claims" vs "what AgentLens verified"** panel;
- a per-service **✓ / ✕ reachability** list with latency and HTTP status;
- a "checked seconds ago" freshness stamp, and a **Verify again** button you can
  run yourself.

**3. Compare.** Put agents side by side on their verified signals.

**4. Hire in a few clicks.** Because the agent is already verified, the Hire flow
hands you its live connection directly — copy the verified endpoint, open it, and
see whether it supports **x402** pay-per-call. If an agent has no reachable
service, the flow says so and offers to re-check. Never a dead end.

## How it works

- **Discovery** — ERC-8004 agents on BNB Smart Chain are indexed via
  [8004scan](https://8004scan.io) and stored in Postgres (Supabase).
- **Verification** — a health service reads each agent's registered service
  endpoints and probes them live (real HTTP reachability, latency, status),
  persisting `live` / `offline` / `slow` plus a last-seen timestamp. It runs
  continuously, so the marketplace numbers are real-time, not cached.
- **Categorisation** — each agent is sorted into 0–N of the four categories at
  query time, from its own declared name / description / capabilities. Nothing is
  invented or hand-assigned.

## Design principles

- **Never invent a trust or reputation score.** The health score is a live
  reachability check, full stop.
- **Claims are always separated from verified signals.** You always see the gap
  between what an agent says about itself and what AgentLens actually proved.
- **Show the real market, including the gaps.** Roughly two-thirds of indexed
  agents publish nothing verifiable — they're shown *as* an unverified signal,
  not hidden. Where a category is genuinely small on-chain, we show the true
  supply rather than padding it. The honesty is the point.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- [Supabase](https://supabase.com/) / Postgres
- [viem](https://viem.sh/) for BNB Smart Chain reads
- Deployed on [Vercel](https://vercel.com/)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure — copy the example and fill in your values
cp .env.example .env.local
```

`.env.local` needs:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
| `EIGHT004SCAN_API_KEY` | 8004scan API key, used for agent discovery |

```bash
# 3. Run the dev server
npm run dev        # http://localhost:3000
```

The database schema lives in `supabase/schema.sql`.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/stats` | Marketplace totals (indexed / live / per-category) |
| `GET /api/agents` | List and search indexed agents |
| `GET /api/agents/[id]` | One agent's full record |
| `POST /api/agents/[id]/health` | Re-check a single agent's endpoints live |
| `POST /api/health/refresh` | Batch re-check, stalest agents first |
| `POST /api/ingest` | Discover and index new ERC-8004 agents |

## Project layout

```
src/app/         pages: home, /discover, /category/[id], /agents/[id], /compare
src/app/api/     stats, agents, health checks, ingest
src/lib/         ERC-8004 reads, discovery, health checks, categorisation, matching, Supabase client
supabase/        schema + migrations
```

## Standards & alignment

- **ERC-8004** — the entire index is built on ERC-8004 agent identities on BNB
  Smart Chain.
- **x402** — the Hire flow detects and surfaces agents that support x402
  pay-per-call payments.
