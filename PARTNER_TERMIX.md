# AgentLens — TermiX "Agent Advantage Report"

**Track:** TermiX Challenge (BNB "Smart Money Era" partner track)
**Prize:** $6,000 / $3,000 / $1,000 · **Live site:** https://agentlens-ashy.vercel.app/
**Repo:** https://github.com/Temmygabriel/agentlens · **Chain:** BNB Smart Chain (56)

---

## ⚠️ Read this first — what TermiX actually requires

TermiX does **not** ask you to integrate anything with them. They will **hire agents
from your marketplace themselves** and judge whether those agents are worth paying
for. Their scoring (independent of the main track):

| Criterion | Weight | What "great" looks like |
|---|---|---|
| **Value of the services** | 30% | Real working agents at a price/speed that beats the alternative. |
| **Proven agent advantage** | 30% | **Measured, not asserted** — backed by this Agent Advantage Report. |
| **High-stakes categories & track record** | 20% | Trading, equities, security agents weighted above general-purpose; trading agents need a real record (win rate, window, risk). |
| **Marketplace quality** | 20% | Find, compare, hire — without instructions. |

**The required report must contain:**
1. **At least 3 real tasks run BOTH ways** — with an agent hired through AgentLens vs. without.
2. For each task: **time, cost, and output quality**, with the **actual outputs attached**.
3. **At least one task from trading, stock, or security.**

> **Honesty boundary — important, and we hold to it.** The three task *definitions,
> procedures, and advantage analysis* below are complete. The **measured numbers and
> attached outputs must be captured from real runs** — they are marked `‹RUN›` and
> are deliberately left blank here rather than invented, because inventing them would
> break the core principle this whole product is built on (never fake data). See
> "How to complete this report" at the end: each `with-agent` run is a real hire
> through AgentLens (a verified-live agent's endpoint, or an ERC-8183 job once the
> Altana branch lands), and each `without-agent` run is the same task done manually.
> This is the exact report structure TermiX asks for, ready to populate.

---

## Method

- **Without agent:** a person does the task by hand, timed, with the real output saved.
- **With agent:** hire a **verified-live** agent through AgentLens (Discover/category →
  "Live now" → open → Hire → its verified endpoint), run the same task, save the output.
  AgentLens's job is that you start from an agent that provably works — not a dead listing.
- **Cost:** gas / any per-call fee for the agent path; "time spent" valued for the manual path.
- **Output quality:** judged on the attached artifacts, not adjectives.

---

## Task 1 — Keep a PancakeSwap V3 LP position in range (DeFi ops · Rebalancing)

**Definition:** an LP position has drifted out of range; bring it back into an
earning range and keep it there for the test window.

- **Without agent:** watch the pool, notice the drift, burn + re-mint at a new range,
  repeat. `‹RUN: time __ · cost __ · output (screenshots of manual re-mint + fees earned) __›`
- **With agent (AgentLens → Rebalancing → Live now):** hire a verified rebalancing
  agent; it maintains the range automatically for the window.
  `‹RUN: which agent (name + verified endpoint) __ · time-to-hire __ · cost __ · output __›`
- **Advantage:** continuous, machine-latency range maintenance + fees captured that a
  human misses overnight. `‹fill from the two runs›`

## Task 2 — Assess liquidation risk and recommend a de-risking action (SECURITY · required)

*This is the required trading/stock/security task.*

**Definition:** given a wallet with a lending position (e.g. Venus/Aave), assess how
close it is to liquidation and recommend a concrete de-risking action.

- **Without agent:** pull the position by hand, compute health factor / LTV, reason
  about collateral and thresholds, write the recommendation.
  `‹RUN: time __ · cost __ · output (the manual analysis doc) __›`
- **With agent (AgentLens → Health Factor Monitoring → Live now):** hire a verified
  health-monitoring agent; task it to audit the position and recommend an action.
  `‹RUN: which agent __ · time __ · cost __ · output (the agent's returned analysis) __›`
- **Advantage:** 24/7 machine coverage + seconds-scale reaction vs. a human who can't
  watch overnight — the single highest-value, highest-stakes use of an agent in DeFi.
  `‹fill from the two runs›`

## Task 3 — Route idle capital to the best available yield (Trading/DeFi · Yield)

**Definition:** given a fixed amount of stablecoins, find and move to the best
available APR across venues over the test window.

- **Without agent:** check dashboards, compare APRs by hand, move capital manually.
  `‹RUN: time __ · cost __ · output (the manual APR comparison + where capital ended up) __›`
- **With agent (AgentLens → Yield Optimisation → Live now):** hire a verified
  yield-routing agent to do it. `‹RUN: which agent __ · time __ · cost __ · output __›`
- **Advantage:** continuous best-APR routing vs. set-and-forget under-earning. `‹fill›`

---

## Results summary (fill from the runs)

| Task | Without agent (time / cost / quality) | With agent (time / cost / quality) | Advantage |
|---|---|---|---|
| 1 · LP rebalancing | `‹RUN›` | `‹RUN›` | `‹RUN›` |
| 2 · Liquidation risk (security) | `‹RUN›` | `‹RUN›` | `‹RUN›` |
| 3 · Yield routing | `‹RUN›` | `‹RUN›` | `‹RUN›` |

**Attachments:** the actual outputs from each run (manual docs + agent responses),
linked/embedded here. *(TermiX requires the real outputs attached.)*

---

## Where AgentLens itself scores on the TermiX rubric

- **Marketplace quality (20%):** find → compare → hire with no instructions is exactly
  the journey we built (category front door, live filter, evidence page, Hire modal).
- **Value of services / proven advantage (60%):** we don't just list agents — we
  **live-verify** them, so a TermiX evaluator hiring from our marketplace always starts
  from a provably reachable agent. Starting from a working agent instead of a dead one
  *is* a measurable part of the advantage.
- **High-stakes categories (20%):** Health Factor Monitoring (security/risk) and
  Rebalancing/Yield (trading-adjacent DeFi) are two of our four first-class categories.

---

## How to complete this report (the honest path to real numbers)

1. **Pick one verified-live agent per task** on the live site (each category → "Live
   now" → confirm the health gauge is green). Note its name + verified endpoint.
2. **Run the with-agent side for real:** hire it and either (a) call its verified
   endpoint directly, or (b) once the `feat/altana-onchain` branch lands, hire it via
   an ERC-8183 job so the run is an on-chain transaction (which also satisfies the
   Altana track). Save the returned output.
3. **Run the without-agent side for real:** do the same task by hand, timed. Save that output.
4. **Fill every `‹RUN›`** with the measured time/cost and attach both outputs.
5. At least Task 2 satisfies the required trading/stock/security task.

> Bottom line for the user: TermiX is **not** a pure "write a doc" track — it needs 3
> tasks genuinely executed with outputs attached. This file is the complete,
> rubric-shaped report; the remaining work is running the 3 tasks (roughly an
> afternoon), which the marketplace already makes easy because you start from
> verified-live agents.
