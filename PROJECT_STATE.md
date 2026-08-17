# AgentLens — Project State (session handoff)

> Purpose: a quick, current snapshot so a new AI/session (or a different LLM)
> can pick up instantly. For deep architecture, schema, and gotchas, read
> `AGENTLENS_CLAUDE_CODE_HANDOVER.md` in this same folder FIRST — this file
> only records the live state + what changed most recently.

Last updated: 2026-08-17

---

## 1. One-line what-it-is
Discovery / verification / comparison marketplace for AI agents on **BNB Smart
Chain** (ERC-8004). Next.js 15 + TypeScript + Supabase + viem, deployed on
Vercel (auto-deploys the `main` branch). Judging criteria for the hackathon:
**Functionality, Data quality, Agent diversity.**

## 2. Hard constraints (do not violate)
- **FREE tools only. No paid APIs. No Claude/Anthropic API key available.**
  (An AI-matchmaker idea using the Claude API was explicitly rejected for cost.)
- **Do not rewrite / do not depart from the current build path.** Build on top.
- Product principle: always separate **claims** (what an agent's registration
  says) from **observed signals** (what AgentLens verified, e.g. a live health
  check). Never invent trust/reputation scores.
- Communicate with the user in **very plain language** (non-technical with code).

## 3. Repo / deploy state
- Local repo: `C:\Users\USER\Documents\HACKATHONS BUILDS\agentlens`
- GitHub: https://github.com/Temmygabriel/agentlens — `main` is the Vercel
  Production branch.
- Before this session, `main` HEAD was `780818a "Add agent comparison feature"`,
  local in sync with origin/main.
- The **Compare feature is confirmed live** (commit `780818a`, files
  `src/lib/compare.ts` + `src/app/compare/page.tsx`). This resolved an open
  question from the older handover doc.
- Feature status: Discover ✅ · Verify ✅ · Compare ✅ · Hire ❌ (out of scope,
  do not build speculatively).

## 4. What changed THIS session (not yet committed/pushed as of writing)
Goal: make search feel intelligent + prove data quality at a glance, all free.

1. **New API route `src/app/api/stats/route.ts`** — returns real marketplace
   numbers from Supabase: `total` agents, `live` (health_status='LIVE'), and
   diversity counts (`capabilityTypes`, `protocolTypes`, `domainTypes`,
   `withCapabilities`). Degrades gracefully (500 on error; UI falls back).
2. **Home "proof bar" (`src/app/page.tsx`)** — hero now fetches `/api/stats`
   and shows "N agents indexed · M live right now · K skill types · P
   protocols". If the fetch fails, it falls back to the old static stats, so
   it never breaks.
3. **"Why we picked this" on result cards (`src/app/page.tsx` +
   `src/app/discover/page.tsx`)** — the ranker already computed match reasons
   and the API already returned them (`matchReasons`), but the UI was throwing
   them away. Now each card shows the top 2 reasons when a search is active.
4. **Better ranker reasons (`src/lib/match.ts`)** — reason wording is now
   human-readable ("Declared skill: trading", "Live now — passed a health
   check") and ranked so the strongest evidence shows first. **Scoring math is
   unchanged** — only reason text/ordering changed.
5. **CSS (`src/app/globals.css`)** — added `.why`, `.why-label`, `.why-item`,
   `.stat-live` (yellow/green palette matching the existing design).

Files touched: `src/app/api/stats/route.ts` (new), `src/app/page.tsx`,
`src/app/discover/page.tsx`, `src/lib/match.ts`, `src/app/globals.css`.

## 5. Build / validation status  ⚠️
- Could NOT run `next build` or even `tsc --noEmit` in the local dev
  environment: the Node process is killed at ~285 MB ("JavaScript heap out of
  memory" / "process out of memory") regardless of `--max-old-space-size`.
  This is an **environment memory ceiling**, not a code problem. The project
  builds fine on Vercel (that's how it's live).
- Changes were **manually code-reviewed** for type/JSX correctness instead.
- **Recommended validation:** push to a NEW branch → Vercel builds a PREVIEW
  deploy (does not touch production `main`) → confirm build passes + eyeball
  the preview URL → then merge to `main` to go live.

## 6. Environment notes
- Node v24 / npm 11 installed. `node_modules` is installed.
- No `.env.local` locally → cannot run the live app with real data on this
  machine (needs `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
  Real data shows on Vercel where env vars are set.
- `gh` CLI is NOT on the reachable PATH, but git HTTPS auth works (clone/push
  fine). The Grep/ripgrep tool binary was also missing in this environment.

## 7. Good next steps (ideas, all free)
- Show a compact "why" / match reasons on the **agent detail page** too.
- Add a "Live now" quick-filter shortcut on the home hero (reuse the existing
  `status=LIVE` API param).
- Health-history persistence (roadmap item) — heavier; needs a cron + a table;
  only if time allows.
- Do NOT add reputation/trust scores or a hire flow (off-brand / out of scope).
