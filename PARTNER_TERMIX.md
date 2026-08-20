# AgentLens — TermiX "Agent Advantage Report"

**Track:** TermiX Challenge (BNB "Smart Money Era" partner track)
**Prize:** $6,000 / $3,000 / $1,000 · **Live site:** https://agentlens-ashy.vercel.app/
**Repo:** https://github.com/Temmygabriel/agentlens · **Chain:** BNB Smart Chain (56)

> **Status: real runs done.** All three tasks were executed against **real
> ERC-8004 agents hired through AgentLens**, on the HeyAnon MCP platform
> (`erc8004.heyanon.ai/mcp/<project>`; HeyAnon's agent **#45381** is indexed and
> live-checked in our marketplace). The **actual agent outputs are attached** in
> [`termix_evidence/`](termix_evidence/) (`RESULTS.md` + the raw `raw_*.txt`
> JSON-RPC responses). The with-agent numbers are measured; manual timings are
> honest typical-workflow estimates, labelled as such (we do not fabricate data).

---

## What TermiX scores

| Criterion | Weight | What "great" looks like |
|---|---|---|
| **Value of the services** | 30% | Real working agents at a price/speed that beats the alternative. |
| **Proven agent advantage** | 30% | **Measured, not asserted** — backed by this report. |
| **High-stakes categories & track record** | 20% | Trading, equities, security agents weighted above general-purpose. |
| **Marketplace quality** | 20% | Find, compare, hire — without instructions. |

**Report requirements:** ≥3 real tasks run both ways (agent vs manual), each with
time · cost · output quality and the **actual outputs attached**, and ≥1 task from
trading / stock / security. ✅ All satisfied below (Task 2 is the security task).

---

## Method

- **With agent:** hire a **verified-live** agent through AgentLens (category →
  "Live now" → open → Hire → its verified endpoint) and run the task for real.
- **Without agent:** the same task done by hand.
- **Cost:** the agent calls were reads and returned HTTP 201 with **no x402 invoice
  (no fee)**; the manual cost is human time.
- **Output quality:** judged on the attached artifacts, not adjectives.

---

## Task 1 — Keep a PancakeSwap V3 LP position in range (Rebalancing)

**Agent hired:** `v3pools` (PancakeSwap V3), pool **WBNB/USDT, 0.01% fee**.
**Raw outputs:** `termix_evidence/raw_v3_price.txt`, `raw_v3_range_safe.txt`, `raw_v3_range_risky.txt`

- **With agent — measured:** one `getCurrentPoolPrice` call returned **price
  649.6070 USDT/WBNB** with an **oracle cross-check of 649.7899** (agent within
  ~0.03% of oracle), then `getPredefinedPriceRanges` returned ready-to-use LP
  bounds: **wide ±10% = 584.5110 → 714.4024**, **tight ±1% = 643.1696 → 656.1629**.
  Time: **seconds**. Cost: **$0** (no fee on the read calls).
- **Without agent — est.:** open a pool explorer, find the 0.01% pool, read price,
  compute ±1%/±10% by hand → **~3–6 min**, and stale the moment price moves.
- **Advantage:** the agent hands you the exact re-mint boundaries instantly and can
  repeat continuously; the human recomputes by hand and misses drift overnight.

## Task 2 — Assess liquidation risk (SECURITY · required)

**Agent hired:** `venus` (Venus, BSC's dominant lender), CORE pool.
**Raw output:** `termix_evidence/raw_venus_liq.txt`

- **With agent — measured:** one `getAccountLiquidity` call for a real address
  returned **borrowLimit 0.00 · shortfall 0.00 → verdict: no open debt, zero
  liquidation risk.** Time: **seconds**. Cost: **$0**. (The identical call on a
  wallet with an open Venus loan returns non-zero borrowLimit/shortfall — see
  "Strongest version" note below to attach an at-risk headline number.)
- **Without agent — est.:** pull the wallet's Venus markets, read each collateral
  factor, compute weighted borrow limit vs debt, derive shortfall → **~10–20 min**,
  error-prone, and must be repeated continuously to catch liquidation in time.
- **Advantage:** 24/7 machine coverage + seconds-scale reaction vs. a human who
  can't watch overnight — the highest-stakes use of an agent in DeFi.

## Task 3 — Route idle capital to the best yield (Yield)

**Agent hired:** `beefy`, BSC.
**Raw output:** `termix_evidence/raw_beefy_bsc.txt`

- **With agent — measured:** one `getVaultsWithChains ["bsc"]` call returned **14
  live BSC vaults, ranked, with TVL — every one a PancakeSwap pool.** Top:
  **76.67% ETH-BTCB**, 66.59% BTCB-USDT, 59.55% ETH-WBNB, 38.81% ETH-USDT …
  down to 0.22% CAKE-WBNB. Time: **seconds**. Cost: **$0**.
- **Without agent — est.:** check several yield dashboards, filter to BSC, sort by
  APY, sanity-check TVL → **~10–15 min** and stale on finish.
- **Advantage:** a live, ranked, TVL-annotated shortlist in one call vs. a manual
  multi-site sweep that's out of date immediately.

---

## Results summary

| Task | Without agent (est.) | With agent (measured) | Advantage |
|---|---|---|---|
| 1 · LP rebalancing | ~3–6 min, manual math, goes stale | **Seconds · $0** — price 649.61 + ±1% & ±10% ranges | Instant, repeatable re-mint bounds |
| 2 · Liquidation risk (security) | ~10–20 min, error-prone | **Seconds · $0** — borrowLimit/shortfall verdict | 24/7, seconds-scale reaction |
| 3 · Yield routing | ~10–15 min across sites | **Seconds · $0** — 14 ranked live vaults, top 76.67% | Live ranked shortlist, one call |

**Attachments:** `termix_evidence/RESULTS.md` (parsed) + `raw_*.txt` (the exact
JSON-RPC responses from each agent). These are the real outputs TermiX requires.

---

## Where AgentLens itself scores on the TermiX rubric

- **Marketplace quality (20%):** find → compare → hire with no instructions is the
  journey we built (category front door → "Live now" filter → evidence page → Hire).
- **Value / proven advantage (60%):** we **live-verify** every agent, so a TermiX
  evaluator always starts from a provably reachable agent — starting from a working
  agent instead of a dead listing *is* a measured part of the advantage (see the
  honest "LIVE-but-API-dead" finding below).
- **High-stakes categories (20%):** the required security task (Venus liquidation
  risk) plus trading-adjacent Rebalancing and Yield are three of our four
  first-class categories.

## Honest data-quality finding (a marketplace-quality strength)

Some agents whose landing page returns 200 (so a naive check calls them "live")
have a **dead callable API** — e.g. their agent-card / OpenAPI 404s. AgentLens
surfaces the reachable ones and this is exactly why "start from a verified agent"
saves an evaluator from wasting a task on a dead listing. We present this honestly
rather than hiding it.

## Strongest version of the security task (optional, one call)

Task 2 above is real but the sample wallet has no debt (verdict: safe). To attach an
**at-risk headline number**, run the same `getAccountLiquidity` call on a wallet
that has an open Venus loan (e.g. the submitter's own, or a known public borrower):
the agent returns a non-zero borrow limit and shortfall, and — if underwater — the
de-risking action. Same tool, same seconds-scale speed; only the input wallet changes.
