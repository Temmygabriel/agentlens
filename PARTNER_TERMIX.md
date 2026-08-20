# AgentLens — TermiX "Agent Advantage Report"

**Track:** TermiX (BNB "Smart Money Era" partner track)
**Prize:** $10,000 USDT total (~$6k / $3k / $1k) · **Requirement:** an "Agent
Advantage Report" — ≥3 real tasks compared **with vs without an agent** (favours
trading / security depth)
**Live site:** https://agentlens-ashy.vercel.app/
**Repo:** https://github.com/Temmygabriel/agentlens
**Chain:** BNB Smart Chain (chainId 56) · **Standard:** ERC-8004

---

## What this report shows (and how to read it honestly)

TermiX asks the right question: *does using an agent actually beat doing the task
by hand?* AgentLens answers a question one level up — **which agent, and can you
trust it?** — because the advantage of "using an agent" is worth nothing if the
agent you picked is dead, fake, or unverifiable. So this report measures the
advantage of the **agent-assisted workflow (find → verify → hire via AgentLens)**
against the **manual workflow** on three real DeFi tasks.

**The honesty boundary, stated up front:**
- The parts AgentLens **actually ran and can prove** are the discovery and
  verification: we really did live-check every agent named below (real HTTP
  reachability, latency, and a last-checked timestamp you can re-run on the site).
- The **with-vs-without execution contrast** is analysed on *process* metrics —
  time-to-a-trustworthy-agent, monitoring coverage, reaction latency, and error
  surface — **not** on invented profit-and-loss numbers. We do not fabricate trade
  returns; that would break the product's core principle of never inventing data.
- **Live on-chain execution** (the agent transacting for itself) is the documented
  next step, isolated on a dedicated branch (Altana scoped/revocable session key).
  This report is about the advantage that is real *today*.

---

## Task 1 — Keep a PancakeSwap V3 LP position in range (Rebalancing)

**Without an agent (manual):** Watch the pool. When price drifts out of your
range, your position stops earning fees. You notice (hours or days later), burn
the position, and re-mint at a new range — then repeat, forever. Realistic cost:
tens of minutes of active attention per rebalance, plus **all the fee income lost
while the position sat out of range unnoticed** (often overnight).

**With an agent (found + verified via AgentLens):** Search **Rebalancing → "Live
now"**, and AgentLens shows agents that reset LP ranges automatically — each with
a **verified reachable endpoint**. Pick one whose health check is green, hire it
in a couple of clicks, and the range is maintained continuously.

**The advantage:** continuous, sub-minute range maintenance vs human-latency
maintenance — and, crucially, **you started from a verified-live agent**, not a
guess. *AgentLens verified: 53 rebalancing agents indexed, 22 reachable at check
time.*

---

## Task 2 — Protect a lending position from liquidation (Health Factor Monitoring)

**Without an agent (manual):** You have a leveraged/lending position. Its health
factor falls as the market moves. Protecting it by hand means watching collateral
ratios around the clock and reacting **in the seconds-to-minutes** before a
liquidation — including at 3 a.m. Miss it once and you eat a liquidation penalty.
Human 24/7 coverage is effectively impossible.

**With an agent (found + verified via AgentLens):** Search **Health Factor
Monitoring → "Live now"**, hire a verified agent that watches health factor and
collateral and steps in before liquidation. The agent gives you the one thing a
human can't: **uninterrupted coverage with machine reaction latency.**

**The advantage:** 24/7 coverage + seconds-scale reaction vs
sleep-limited human coverage — the single highest-value use of an agent in DeFi,
and a security/risk task, which is exactly TermiX's focus. *AgentLens verified:
14 health-monitoring agents indexed, 7 reachable at check time — and this
category's true scarcity is itself a signal worth knowing before you rely on one.*

---

## Task 3 — Chase the best stablecoin yield across venues (Yield Optimisation)

**Without an agent (manual):** The best APR moves between pools and protocols.
Tracking it means checking multiple dashboards, comparing APRs by hand, and moving
capital yourself every time the ranking changes — most people just don't, so their
capital sits in a stale pool earning less.

**With an agent (found + verified via AgentLens):** Search **Yield Optimisation →
"Live now"**, hire a verified yield-routing agent, and capital is moved toward the
best available APR automatically.

**The advantage:** continuous best-APR routing vs
set-and-forget-and-lose-yield — plus the AgentLens trust layer, so you're
delegating capital to a **provably reachable** agent, not a listing. *AgentLens
verified: 133 yield agents indexed, 49 reachable at check time.*

---

## Summary

| Task | Without an agent | With a verified agent | Advantage dimension |
|---|---|---|---|
| **1. LP rebalancing** | Manual re-mint, hours of drift, lost fees | Continuous range maintenance | Time + captured fee income |
| **2. Liquidation defence** | Human can't watch 24/7; 3 a.m. misses | Uninterrupted coverage, machine latency | Risk / security (highest value) |
| **3. Yield routing** | Stale pools, capital under-earns | Auto-routed to best APR | Continuous optimisation |

Across all three, AgentLens adds the layer TermiX cares about most: **the agent
advantage is only real if the agent is real.** AgentLens is the part that
guarantees you started from a live, verified agent — measured, timestamped, and
re-runnable on the live site.

---

## What we measured live vs analysed (repeat, because it matters)

- **Measured live and provable:** the reachability, latency, and freshness of every
  agent behind these categories (open the site → any category → "Live now" → open an
  agent → "Verify again").
- **Analysed, not fabricated:** the manual-vs-agent execution contrast, compared on
  process metrics. No invented P&L, no fake trades.
- **Next step, isolated on a branch:** live on-chain execution via a scoped,
  revocable session key (Altana) — the agent transacting for itself inside spend
  limits the user sets. When that lands, each task above becomes a fully live,
  end-to-end "we ran it" demonstration.

---

## Ready-to-paste submission summary

> **AgentLens's Agent Advantage Report** compares three real DeFi tasks — keeping a
> PancakeSwap LP in range, defending a lending position from liquidation, and
> routing to the best yield — done manually vs done by an agent you found and
> **verified live** through AgentLens. The measurable advantage is continuous,
> machine-latency execution with 24/7 coverage no human can match, starting from an
> agent AgentLens proved is actually reachable. We report the advantage honestly:
> the verification is live and re-runnable on the site; the execution contrast is on
> process metrics, not invented returns; and full on-chain execution is the
> documented next step.
