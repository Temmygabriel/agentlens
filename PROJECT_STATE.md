# AgentLens — Project State (session handoff)

> Purpose: a quick, current snapshot so a new AI/session (or a different LLM)
> can pick up instantly. **The source of truth for WHAT to build is
> `brief_for_project.txt` in this folder (edited 2026-08-19) — read it first.**
> For deep architecture, schema, and gotchas see
> `AGENTLENS_CLAUDE_CODE_HANDOVER.md`.

Last updated: 2026-08-20

---

## 1. One-line what-it-is
The **BNB Agent Studio Marketplace**: a discovery / verification / **hire**
marketplace for AI agents on **BNB Smart Chain** (ERC-8004). Next.js 15 +
TypeScript + Supabase + viem, deployed on Vercel (auto-deploys the `main`
branch). The journey a judge must be able to complete with zero prior
knowledge: **land → find an agent by category → understand it → hire it in a
few clicks, with no dead ends.**

## 2. THE BRIEF CHANGED (2026-08-19) — this overrides older docs
Two shifts vs the original plan:
1. **The four categories are now MANDATORY and equal-depth:** Rebalancing ·
   Grid Trading · Yield Optimisation · Health Factor Monitoring. "Single-
   category submissions score poorly. All four, equally deep, is the bar."
2. **HIRE / "activate in a few clicks" is now CORE**, no longer out of scope.
   (The old version of this file said "Hire ❌ out of scope" — that is now
   WRONG. Ignore it.)

Main-track judging: **Functionality** (full journey works, no dead ends) ·
**Data Quality** (real-time, beyond basic counts, enough to make an informed
hire decision) · **Agent Diversity** (all four categories equally deep). Agents
must be live on BSC. Phase-2 criteria are hidden.

## 3. Hard constraints (do not violate)
- **FREE tools only. No paid APIs. No Claude/Anthropic API key available.**
  (An AI-matchmaker idea using the Claude API was explicitly rejected for cost.)
- **Do not rewrite / do not start over. Build on top of what exists.**
- Product principle: always separate **claims** (what an agent's registration
  says) from **observed signals** (what AgentLens verified, e.g. a live health
  check). **Never invent trust/reputation scores** — the health score is a live
  reachability check, not a rating.
- Empty capability/domain arrays are NORMAL, not bugs. Don't dedupe same-name
  agents (they are distinct on-chain IDs). ~2/3 of agents publish nothing
  verifiable → UNVERIFIED; present that honestly as a data-quality signal.
- Communicate with the user in **very plain language** (non-technical with
  code). Give COMPLETE file replacements, never partial diffs.

## 4. Repo / deploy state
- Local repo: `C:\Users\USER\Documents\HACKATHONS BUILDS\agentlens`
- GitHub: https://github.com/Temmygabriel/agentlens — `main` is the Vercel
  Production branch.
- **`main` (PRODUCTION) HEAD = `bb488f0`** — the four-category work was
  fast-forward-merged from `feat/four-categories` into `main` on 2026-08-20
  (user gave explicit go-ahead) and **auto-deployed live**. Production URL:
  `https://agentlens-temmygabriels-projects.vercel.app` (verified:
  `/category/rebalancing` → 200, `/api/stats` total 434).
- Everything in the build log through `bb488f0` is now LIVE on prod: dark
  theme + toggle, logo/favicon, `/api/stats` + `/api/health/refresh`, real
  availability seeding, why-panel + match reasons, evidence-forward home,
  detail-page showpiece (health gauge, claims-vs-verified split, freshness
  stamp), the four-category front door + category pages, and the hire flow.
- **Push gotcha:** the native `wincred` helper fixed the credential-manager
  OOM, but git's OWN pack step can still OOM under memory pressure
  (`calloc failed`). Fix that worked for the merge push:
  `git -c pack.threads=1 -c pack.window=0 -c pack.depth=0 -c
  pack.windowMemory=16m -c core.compression=0 push …` (safe because all
  objects were already on origin; the push only moves the `main` ref).

## 5. Feature status
- Discover ✅ · Verify ✅ · Compare ✅ · Why/proofbar ✅ · dark theme ✅ ·
  evidence home ✅ · detail showpiece ✅ — all LIVE on prod (`main`).
- **Merged to `main` + LIVE on prod (2026-08-20, was branch `feat/four-categories`):**
  - Four-category **front door** ✅ (home tiles → `/category/[id]` pages).
  - Query-time **category classification** ✅ (`src/lib/categories.ts` —
    tags each agent into 0-N of the four from its own name/description/
    capabilities/domains; nothing stored/invented; no SQL migration).
  - **Hire flow** ✅ (`bb488f0`) — "⚡ Hire this agent" CTA on the detail page
    opens a modal that picks the first LIVE service, shows its verified
    endpoint with Copy + Open ↗, flags x402, and has an honest empty-state
    ("Verify again", never a dead end). No fake transactions; a note says
    on-chain hiring (Altana scoped/revocable session key) plugs onto the
    Connect step next.
  - **Data populated** ✅ (2026-08-20). See §6.
- **In flight on branch `feat/discover-categories` (`c05923c`, pushed — Vercel
  preview building):** the Discover page's generic "Popular needs" / "Capability"
  chips reworked into the **four category chips** (wired to the existing
  `?category=` filter, reusing existing `.intent-chip`/`.filter-bar` CSS so no
  stylesheet change). Makes home tiles, category pages, and Discover all tell one
  consistent four-category story. Awaiting user eyeball on the preview → ff-merge.
- **Partner-track docs** ✅ written (repo root, 2026-08-20): `PARTNER_PANCAKESWAP.md`
  (rebalancing/yield = LP benefit wording) + `PARTNER_TERMIX.md` (Agent Advantage
  Report: 3 tasks with-vs-without an agent, honest process-metric framing). Chosen
  tracks: **Main + PancakeSwap + TermiX**.
- **Altana on-chain hire** — to be attempted on a **separate isolated branch**
  (user's explicit call 2026-08-20) so an unfinished/broken attempt can never touch
  live `main`. The hire flow is already framed Altana-ready (Connect step + honest
  "plugs in next" note).

## 6. Live data on the branch/preview DB (Supabase is shared prod↔preview)
As of 2026-08-20, after category-targeted ingest + full health-refresh sweeps:
- **Total agents 434** (was 200) · **capability types 101** (was 4) ·
  **withCapabilities 195** (was 53).
- **Live right now: 114** · Offline 50 · Slow 7.
- Per category (total / live):
  - Rebalancing **53 / 22**
  - Grid Trading **23 / 3**
  - Yield Optimisation **133 / 49**
  - Health Factor Monitoring **14 / 7**
- Every category has live, hireable agents, so land→find→understand→hire works
  in all four with no dead ends.
- **Honest supply cap (confirmed):** the counts differ by REAL market supply,
  not effort. Yield is a crowded niche; Grid and Health-monitoring are scarce
  (only ~10-14 distinct agents each exist on 8004scan). Attempts to grow Grid
  and Health returned dupes, broken-metadata agents, or agents that honestly
  belong to yield/rebalancing — so they were NOT force-classified. Frame
  "equal depth" as: each category is a fully-built first-class page with real
  live hireable agents, and showing the TRUE per-category supply is itself a
  Data Quality strength (not hiding empty shelves).

## 7. Build / validation status  ⚠️
- Local `next build` / `tsc` still **OOMs** (~285 MB heap ceiling in this
  environment) — cannot typecheck locally. **Vercel preview IS the typecheck.**
- Workflow: assistant pushes to a feature branch (currently
  `feat/discover-categories`) → Vercel builds a PREVIEW → user eyeballs the preview
  URL → on explicit user go-ahead, fast-forward-merge to `main` (auto-deploys prod).
- Active preview branch URL (pattern):
  `https://agentlens-git-feat-discover-categories-temmygabriels-projects.vercel.app`

## 8. Environment gotchas
- **Git push:** the global `.NET` credential helper (`manager`) OOM-crashes
  under memory pressure. FIXED for this repo by pinning the native helper:
  `git config --local credential.helper ""` then
  `git config --local --add credential.helper wincred`. Do NOT revert.
- **Preview access:** Vercel Deployment Protection (Preview) is now **Disabled**
  (user set it), so assistant tools can reach preview API routes directly. It
  was previously a 302→SSO login wall that blocked everything but the user's
  browser.
- No `.env.local` locally → can't run the app with real data on this machine;
  real data lives on Vercel (env vars set there).

## 9. Good next steps
- **Discover polish** ✅ done in code (branch `feat/discover-categories`, `c05923c`)
  — awaiting user eyeball on preview → ff-merge to `main`.
- **Partner docs** ✅ done (`PARTNER_PANCAKESWAP.md`, `PARTNER_TERMIX.md`); tracks =
  Main + PancakeSwap + TermiX.
- **Altana on-chain hire** — attempt on a **separate isolated branch** (per user);
  merge only if it lands, so live `main` is never at risk.
- **Richer Data Quality per agent** — 8004scan **Pro API is FREE for the hackathon**
  (500 req/min, 100k/day) but **needs a registered API key** (possible blocker; not
  started). Reputation/feedback/activity signals that go "beyond basic counts."
- Optional: Health-category top-up is EXHAUSTED as a lever (see §6 honest supply
  cap) — don't chase counts further.
