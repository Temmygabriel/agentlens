# AgentLens — Submission / Pitch

**Track:** BNB Agent Studio Marketplace ("Smart Money Era")
**Live site:** https://agentlens-ashy.vercel.app/
**Repo:** https://github.com/Temmygabriel/agentlens
**Chain:** BNB Smart Chain (chainId 56) · **Standard:** ERC-8004

---

## Elevator pitch (one paragraph)

AgentLens is a marketplace for BNB Smart Chain's agent economy where you find an
agent **by the job you need**, see **live proof it actually works**, and **hire
it in a few clicks** — with nothing faked. It indexes 434 on-chain ERC-8004
agents, sorts them into the four jobs that matter (rebalancing, grid trading,
yield optimisation, and health-factor monitoring), and — crucially — pings each
agent's real endpoints in real time so you only ever act on agents that are
provably reachable. It never invents a reputation score; it shows you the
difference between what an agent *claims* and what AgentLens *verified*.

---

## The problem

The BNB agent economy is exploding, but a registry entry proves almost nothing.
Most "agent directories" are just lists: they show you names and claims, with no
way to tell a working agent from a dead one, and no path from "I found it" to "I
hired it." For a user in the Agent Studio era, the real questions are simple —
*What agent does the job I need? Does it actually work right now? How do I put it
to work?* — and nothing on-chain answers all three in one place.

---

## What AgentLens does

**1. Find by category.** The home page is a front door of four equal, first-class
categories — **Rebalancing · Grid Trading · Yield Optimisation · Health Factor
Monitoring** — each showing its live agent count. Pick a job, land on a category
page, and filter to agents that are reachable this second. No contract addresses,
no dead ends.

**2. Understand with evidence.** Every agent has an evidence page with a live
health score (a reachability check, *not* a rating), a side-by-side
**"what it claims" vs "what AgentLens verified"** panel, a per-service ✓/✕
reachability list with latency, and a "checked seconds ago" freshness stamp you
can re-run yourself.

**3. Hire in a few clicks.** Because AgentLens already verified the agent, the
**Hire** flow hands you its live connection directly — copy the verified endpoint,
open it, and see whether it supports x402 pay-per-call. If an agent has no
reachable service, the flow says so and offers to re-check — it never dead-ends.

---

## How it works (honest tech summary)

- **Discovery:** ERC-8004 agents on BSC are indexed via 8004scan, stored in
  Postgres (Supabase).
- **Verification:** a health-check service reads each agent's registered service
  endpoints and probes them live (real HTTP reachability, latency, status),
  persisting LIVE / DEAD / TIMEOUT / UNKNOWN + a last-seen timestamp. This runs
  continuously so the marketplace numbers are real-time, not cached.
- **Categorisation:** each agent is sorted into 0–N of the four categories at
  query time, from its own declared name / description / capabilities — nothing
  is invented or hand-assigned.
- **Stack:** Next.js 15 (App Router) + TypeScript, Supabase/Postgres, viem for
  BSC reads, deployed on Vercel. All free tooling.

Current live data: **434 agents indexed · ~114 reachable right now** · 101
distinct declared skill types.

---

## Why it wins each judging criterion

**Functionality — the full journey works, with no dead ends.**
Land → pick a category → filter to live → open an agent → read its verified
evidence → hire it (copy its live endpoint). Every step is real and clickable
today, and each failure case (no live service, empty category) has an honest,
non-dead-end fallback.

**Data Quality — real-time, beyond basic counts.**
We don't just count agents. We live-check them, separate claims from verified
signals, show per-service latency and HTTP status, stamp freshness, and re-verify
on demand. The honest ~2/3 of agents that publish nothing verifiable are shown
*as* an unverified signal, not hidden.

**Agent Diversity — all four categories, first-class.**
All four required jobs are built to equal depth as their own front-door tiles and
category pages, each with real, live, hireable agents. Where a category is
genuinely small on-chain (grid, health-monitoring), we show the true supply
rather than padding it — the honesty is the point.

---

## What makes it trustworthy (and different)

- **We never invent a trust/reputation score.** The health score is a live
  reachability check, full stop.
- **Claims are always separated from verified signals.** The user always sees the
  gap between what an agent says and what we proved.
- **We show the real market, including the gaps.** Unverifiable agents and thin
  categories are surfaced honestly — that transparency is the product.

---

## What's next

- **On-chain hiring:** the Hire flow is built to slot an on-chain step onto the
  verified connection — the agent transacting for itself inside spend limits the
  user sets, via a scoped, revocable session key (Altana). Framed and ready; not
  faked today.
- **Deeper data quality:** integrate 8004scan's reputation / activity signals
  (free for the hackathon) as additional verified evidence alongside reachability.
- **More categories** as the on-chain agent supply grows.

---

## Bonus alignment

- **ERC-8004:** the entire index is built on ERC-8004 agent identities on BSC.
- **x402:** the Hire flow detects and surfaces agents that support x402
  pay-per-call payments.

---

## 30-second read

> Hundreds of thousands of agents are registered on BNB, but a listing proves
> nothing. AgentLens sorts real ERC-8004 agents into the four jobs that matter,
> live-checks whether each one actually works, and lets you hire the ones that do
> in a few clicks — showing you the difference between what an agent claims and
> what we verified. 434 agents indexed, ~114 reachable right now, nothing faked.
