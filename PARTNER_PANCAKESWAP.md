# AgentLens × PancakeSwap — Partner Track Submission

**Track:** PancakeSwap (BNB "Smart Money Era" partner track)
**Prize:** 1,000 CAKE · **Criterion:** benefit PancakeSwap traders / LPs
**Live site:** https://agentlens-ashy.vercel.app/
**Repo:** https://github.com/Temmygabriel/agentlens
**Chain:** BNB Smart Chain (chainId 56) · **Standard:** ERC-8004

---

## The one-line fit

PancakeSwap is where the liquidity lives on BNB Chain — and AgentLens is the layer
that helps PancakeSwap LPs **find and trust the automation agents that keep that
liquidity productive.** Two of our four first-class categories —
**Rebalancing** and **Yield Optimisation** — map directly onto the two biggest
jobs a PancakeSwap LP has to do.

---

## Why PancakeSwap LPs specifically benefit

A PancakeSwap liquidity provider has three recurring problems. AgentLens is built
around exactly two of them, plus the trust problem that sits on top of both.

**1. Concentrated liquidity drifts out of range → dead capital.**
On PancakeSwap V3, an LP earns fees only while the price stays inside the range
they set. The moment it drifts out, the position stops earning and just sits
there. Fixing it by hand means watching the pool and re-minting the position at a
new range — constantly. Our **Rebalancing** category is exactly the agents that
do this automatically: reposition and reset LP ranges so the capital keeps earning
without manual babysitting. *(53 agents indexed, 22 reachable right now.)*

**2. Yield is fragmented across pools → idle capital.**
The best APR moves around between pools and venues. Chasing it by hand is a
full-time job. Our **Yield Optimisation** category is the agents that route
liquidity toward the best available APR/APY — including PancakeSwap pools — so
idle capital keeps working. *(133 agents indexed, 49 reachable right now.)*

**3. The trust gap — you won't hand your LP to a random agent.**
This is the real blocker, and it's the whole point of AgentLens. An LP won't
delegate a live position to an agent they can't verify. Before you hire any agent,
AgentLens **live-checks that it's actually reachable**, shows a
**"what it claims" vs "what we verified"** split, and stamps how recently it was
checked. So a PancakeSwap LP can pick an automation agent the same way they'd pick
a pool — on evidence, not on a listing.

---

## Concretely, in the product

Open the live site and filter to the LP-relevant jobs:

- **Rebalancing → "Live now"** surfaces agents like *BNB LP Range Rebalancer* and
  agents that declare `lps:rebalance` capabilities — each with a verified, reachable
  endpoint you can hire in a couple of clicks.
- **Yield Optimisation → "Live now"** surfaces yield-routing agents (e.g.
  *Yield-Farmer-X*) that a PancakeSwap LP would use to keep capital in the
  highest-APR pools.

Every one of these is a real ERC-8004 agent on BNB Chain, live-checked by
AgentLens — not a mock.

---

## Mapping to PancakeSwap's own examples

PancakeSwap named four kinds of agent they want to see. Here's where AgentLens
lands on each — two we cover head-on today, two we align with honestly:

| PancakeSwap's example | AgentLens |
|---|---|
| **Smarter liquidity management** | ✅ Our **Rebalancing** category — verified agents that keep V3 concentrated-liquidity positions in range. |
| **Finding better yields** | ✅ Our **Yield Optimisation** category — verified agents that route capital to the best available APR, PancakeSwap pools included. |
| **Researching market movements to find where new pools would help** | ◐ Research-type agents in the index can be surfaced; we point an LP to verified ones rather than pretending to run the analysis ourselves. |
| **Safe automated swaps without ever risking user funds** | ✅ This is our core principle. We only route you to **live-verified** agents, and the on-chain hire step is built to use a **scoped, revocable session key with a spend cap** (Altana) — the agent can act, but never beyond limits you set, and you can revoke in one transaction. "Without risking user funds" is exactly the guarantee we're engineering toward. |

---

## What we are *not* claiming (honesty)

AgentLens does **not** execute swaps or mint positions on PancakeSwap itself, and
we don't report any trading volume. We are the **discovery + verification + hire
layer** that routes a PancakeSwap LP to the automation agents that do that work —
and proves those agents are actually live before the LP trusts one. That
separation (we verify; the agent executes) is deliberate and is the honest core of
the whole product.

---

## Ready-to-paste submission blurb

> **AgentLens benefits PancakeSwap LPs directly.** Two of its four core
> categories — Rebalancing (keeping V3 concentrated-liquidity positions in range)
> and Yield Optimisation (routing capital to the best available APR) — are the two
> jobs every PancakeSwap LP struggles with by hand. AgentLens indexes the
> ERC-8004 agents that automate those jobs on BNB Chain, **live-checks which ones
> actually work right now**, and lets an LP hire a verified one in a few clicks —
> showing the difference between what an agent claims and what AgentLens proved. It
> turns "I have an out-of-range PancakeSwap position and no idea which bot to
> trust" into a one-minute, evidence-backed decision.

---

## Natural next step (PancakeSwap-specific)

- Tag agents that name PancakeSwap / V3 pools in their metadata as a "PancakeSwap-
  ready" filter inside the Rebalancing and Yield categories.
- Surface the specific pool/pair an agent targets, when it's declared, as another
  verified signal on the agent's evidence page.
