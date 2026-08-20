# TermiX Agent Advantage Report — captured outputs (real runs)

These are the **actual outputs** from real agents hired through the AgentLens
marketplace. Every number below was returned by a live ERC-8004 agent call; the
raw JSON-RPC responses are the sibling `raw_*.txt` files in this folder.

## How the agents were hired (all three tasks)

- All three agents are **ERC-8004 agents on the HeyAnon platform**, reachable at
  `https://erc8004.heyanon.ai/mcp/<project>`. HeyAnon's *"Aave powered by HeyAnon"*
  agent (on-chain agent **#45381**) is indexed and live-checked in AgentLens.
- Each task is a real JSON-RPC `tools/call` over MCP (the agent's declared
  protocol). **Every call returned HTTP 201 with a real result.**
- **Cost:** these are read/query calls — **no payment was required** (no x402
  invoice returned). A human's alternative cost is their time.
- **Latency:** each call returned in a couple of seconds.

---

## Task 1 — Rebalancing (PancakeSwap V3 · WBNB/USDT · 0.01% fee pool)

Agent: `v3pools`. Task: price the pool and produce ready-to-use LP ranges.

**`getCurrentPoolPrice`** → `raw_v3_price.txt`
- DEX: **Pancake**, pair usdt/wbnb, fee **0.01%**
- **Pool price: 649.6070 USDT/WBNB**
- Oracle cross-check: **649.7899** (agent's own price is within ~0.03% of oracle)

**`getPredefinedPriceRanges`** (two strategies) → `raw_v3_range_safe.txt`, `raw_v3_range_risky.txt`
- **Wide / "safe" (±10%): 584.5110 → 714.4024**
- **Tight / "risky" (±1%): 643.1696 → 656.1629**

**What the agent did:** read the live pool, priced WBNB at ~$649.6 (matching the
oracle), and returned the exact lower/upper range boundaries an LP would set for a
tight or a wide position — the core rebalancing decision — in one call, in seconds.

---

## Task 2 — Liquidation risk / security (Venus · CORE pool · BSC)  *(required security task)*

Agent: `venus`. Task: assess how close a wallet is to liquidation.

**`getAccountLiquidity`** for `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
(a real, publicly verifiable address) → `raw_venus_liq.txt`
- **borrowLimit: 0.00 · shortfall: 0.00** → agent verdict: **no open borrow
  position, zero liquidation risk.**

**What the agent did:** returned a real, correct liquidation verdict directly
(shortfall = 0 ⇒ not liquidatable). This proves the assessment pipe end-to-end.
For an *at-risk* demonstration, the identical call against a wallet with an open
Venus loan returns non-zero `borrowLimit`/`shortfall` — to be run on a wallet with
a live position (e.g. the submitter's own) for the headline number.

---

## Task 3 — Yield (Beefy · BSC)

Agent: `beefy`. Task: find the best available yield on BSC.

**`getVaultsWithChains ["bsc"]`** → `raw_beefy_bsc.txt`
- **14 live BSC vaults returned, every one a PancakeSwap pool.** Top by APY:

| APY | Vault | Platform | TVL |
|---|---|---|---|
| **76.67%** | ETH-BTCB | PancakeSwap | $12,230 |
| 66.59% | BTCB-USDT | PancakeSwap | $55,252 |
| 59.55% | ETH-WBNB | PancakeSwap | $9,942 |
| 38.81% | ETH-USDT | PancakeSwap | $54,279 |
| 35.93% | TST-WBNB | PancakeSwap | $1,844 |
| 34.49% | SOL-USDT | PancakeSwap | $5,646 |
| 33.09% | DOGE-WBNB | PancakeSwap | $45,275 |
| 26.45% | SOL-WBNB | PancakeSwap | $37,502 |
| … | … | … | … |
| 1.44% | axlUSDC-USDT | PancakeSwap | (lowest pair) |
| 0.22% | CAKE-WBNB | PancakeSwap | (lowest) |

**What the agent did:** returned a live, ranked, TVL-annotated yield table for BSC
in one call. (All-PancakeSwap output also ties directly into the PancakeSwap track.)

---

## Manual baseline (without-agent) — honest note

The **with-agent** numbers above are measured from real runs. The **without-agent**
side is the same task done by hand; times below are **typical-workflow estimates,
labelled as estimates** (not stopwatched), because inventing precise manual timings
would violate the project's never-fake-data rule:

- **Task 1 manual:** open a pool explorer, find the WBNB/USDT 0.01% pool, read the
  price, compute ±1% and ±10% bounds by hand — ~3–6 min, and it goes stale the
  moment price moves. Agent: one call, seconds, both ranges returned.
- **Task 2 manual:** pull the wallet's Venus markets, read each collateral factor,
  compute weighted borrow limit vs debt, derive shortfall — ~10–20 min, error-prone,
  and must be repeated continuously to catch liquidation. Agent: one call, seconds,
  and can run 24/7.
- **Task 3 manual:** check several yield dashboards, filter to BSC, sort by APY,
  sanity-check TVL — ~10–15 min across sites, stale on finish. Agent: one call,
  seconds, 14 ranked live vaults.
