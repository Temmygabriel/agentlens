# Altana on-chain hiring — integration plan (isolated sandbox branch)

> **Why this branch exists.** On-chain hiring via Altana is a genuine stretch: it
> needs a testnet wallet, real keys, and code that can't be validated locally
> (local build OOMs). So it lives here, on `feat/altana-onchain`, branched off
> clean `main`. **Nothing here touches the live site unless it fully works and the
> user explicitly approves a merge.** If we don't finish, `main` is untouched and
> the submission is unaffected. This file is the plan + the real SDK notes so the
> work can be picked up cleanly at any time.

**Branch:** `feat/altana-onchain` (off `main` @ `bb488f0`)
**Track:** "Best Built with Altana" — 50,000 Altana XP (winner-takes-all)
**Status:** planning only. No SDK installed, no wired code yet (keeps this branch's
own preview build green until we intentionally start).

---

## What the Altana track actually requires (from the official rules)

Altana = self-custodial infrastructure for **sovereign agents**: an agent holds its
**own wallet and its own key** — no custodian, no shared treasury, no human signing
each transaction. The owner grants a **scoped session** (which calls the agent may
make, how much it may spend, when the permission expires). Grant and revoke stay
with the owner; every session key is registered in a **public on-chain registry
(Keystore)**; revocation is one transaction and is immediate.

**To qualify, the submission must show live on-chain transactions in the Altana
explorer (testnet counts, mainnet is stronger), specifically:**

- [ ] Agents on their **own Altana wallets**.
- [ ] Sessions with **real limits**: call allowlist, spend cap, expiry.
- [ ] Sessions **registered in Keystore** (so it's read on-chain, not from the pitch).
- [ ] **Real on-chain transactions through a session key.**
- [ ] **User-facing control**: a user can see what their agent may do, and **revoke
      it, inside the product**.
- [ ] Include **wallet address(es)** in the submission.

**Bonus:** hire BNB Agent Studio agents through **ERC-8183** using the Altana
ERC-8183 SDK; sell over x402/B402 using the x402 server SDK.

---

## Why this fits AgentLens perfectly

Our Hire flow already ends at a "Connect" step with an honest note that says
*"on-chain hiring (Altana scoped/revocable session key) plugs in next."* This branch
is that next step. AgentLens is literally described in Altana's own "Ideas to Build"
table as the **Agent hiring marketplace** pattern (ERC-8183 buyer side,
`hireErc8183Agent`). So we're not bolting something foreign on — we're finishing the
sentence the product already started.

**Bonus synergy:** the real on-chain "we hired an agent and it did the task"
transactions this produces are exactly the evidence the **TermiX Agent Advantage
Report** needs (3 real tasks run *with* an agent, with actual outputs). Especially a
trading/security task via Altana's Venus/Aave/PancakeSwap skills — which is the
required "at least one task from trading/stock/security."

---

## The confirmed mechanism (ERC-8183 job escrow)

ERC-8183 is a **job escrow** in `$U`: the buyer funds a Job against a seller agent's
address, the seller submits a deliverable, and the escrow releases after an
optimistic dispute window. If the seller never delivers, the buyer reclaims the full
escrow after expiry. Package: `@altananetwork/sdk`.

```ts
import { hireErc8183Agent, BNB } from "@altananetwork/sdk";

// One atomic call runs the whole buyer flow: createJob → registerJob (binds the
// dispute policy) → setBudget → approve $U → fund.
const { jobId } = await hireErc8183Agent(wallet, signer, {
  provider: "0xSellerAgentAddress",           // the agent we're hiring
  task: "Audit wallet 0x…'s Venus position and recommend an action.",
  budget: 100_000_000_000_000_000n,           // 0.1 $U (18 decimals)
}, { network: BNB });

// The SESSION-KEY path is the one we want for autonomy + spend caps:
//   hireErc8183Agent(session, params, opts)
// A scoped key with an on-chain spend limit caps what an autonomous agent can escrow.
```

Track the job + fetch the deliverable:

```ts
import { getErc8183Job, getErc8183DeliverableUrl } from "@altananetwork/sdk";

const job = await getErc8183Job(BNB, jobId);   // OPEN → FUNDED → SUBMITTED → COMPLETED
if (job.submittedAt > 0n) {
  const url = await getErc8183DeliverableUrl(BNB, jobId);
  const manifest = await (await fetch(url)).json(); // manifest.response.content
  // job.deliverable is keccak256 of the canonical manifest — VERIFY before trusting.
}
```

Settle / dispute / reclaim:

```ts
import { settleErc8183Job, buildClaimRefundCall } from "@altananetwork/sdk";
await settleErc8183Job(wallet, signer, { jobId }, { network: BNB });        // release (after window)
await settleErc8183Job(wallet, signer, { jobId, action: "dispute" }, opts); // contest (inside window)
await execute(wallet, signer, buildClaimRefundCall(56, jobId), opts);       // full refund after expiry
```

`ERC8183_ADDRESSES` exports the kernel (AgenticCommerce), EvaluatorRouter,
OptimisticPolicy, ERC-8004 registry, and `$U` token for **BSC mainnet (56)** and
**testnet (97)**. There's also an MCP server exposing `erc8183_create_job`,
`erc8183_job_status`, `erc8183_settle`.

---

## Build plan (testnet-first, phased)

**Phase 0 — verify + set up (do this before writing code):**
- Read `https://docs.altana.network/llms-full.txt` (full docs for LLMs),
  `/concepts/sessions`, and the SDK repo `github.com/altananetwork/altana-sdk`.
- Attend the Altana workshop / office hours (offered during the build period).
- Get testnet BNB from `https://testnet.bnbchain.org/faucet-smart` (chain 97).

**Phase 1 — wallet + env:** install `@altananetwork/sdk`; create an Altana agent
wallet on testnet; store keys as **server-side env vars** (same pattern as the
Supabase service-role key — never client-exposed). Chain 97 only, to start.

**Phase 2 — scoped session + control UI:** create a session key with **real limits**
(call allowlist, spend cap, expiry), registered in **Keystore**. Add a small
in-product panel: "What this agent may do" (the scope) + a one-click **Revoke**
button. This satisfies the "user-facing control" requirement directly.

**Phase 3 — wire the Hire button:** on the existing `⚡ Hire this agent` modal, add an
on-chain path that calls `hireErc8183Agent(session, signer, { provider, task,
budget }, { network })` on **testnet**, shows the returned `jobId`, polls
`getErc8183Job` through OPEN→FUNDED→SUBMITTED→COMPLETED, fetches + **verifies** the
deliverable, and lets the user settle after the window. Keep the current
copy-the-endpoint path as the honest fallback for non-ERC-8183 agents.

**Phase 4 — prove it:** capture the live transaction in the **Altana explorer**, and
put the **wallet address(es)** + explorer links in the submission.

---

## Safety rules for this branch (hard)

- **Testnet (chain 97) first and by default.** No mainnet transaction without
  explicit user go-ahead.
- **Spend caps + expiry on every session** — the point of Altana is that the agent
  *cannot* exceed the limit. Set them small.
- **Keys are server-side only** (env vars), never shipped to the client.
- **This branch does not merge to `main`** until the full flow works end-to-end on
  testnet AND the user approves. If it never gets there, `main` is untouched.
- Pin the SDK version once it works (on-chain SDKs change fast).

---

## Env / secrets this will need (not set yet)

- `ALTANA_*` wallet key material for the agent wallet (server-side).
- Network selector (default testnet `97`).
- Possibly an Altana API key / RPC endpoint (confirm in Phase 0).
- Testnet `$U` + testnet BNB for gas (from the faucet).

## Open questions to resolve in Phase 0

- XP allocation mechanics are "to be confirmed" by Altana.
- Exact session-creation + Keystore-registration API surface (read `/concepts/sessions`).
- Whether any of the agents already in our index expose an ERC-8183 seller address we
  can hire directly, vs needing an Altana-built demo seller agent to hire.

## Links

- Altana docs: https://docs.altana.network/ (LLM summary: `/llms.txt`, full: `/llms-full.txt`)
- ERC-8183 SDK: https://docs.altana.network/sdk/erc8183
- Sessions: https://docs.altana.network/concepts/sessions
- x402 server SDK: https://docs.altana.network/sdk/x402-server
- SDK + MCP server: https://github.com/altananetwork/altana-sdk
- Composable skills (Venus, Aave, PancakeSwap, Lista, Copy Trade…): https://skills.altana.network
- BSC testnet faucet: https://testnet.bnbchain.org/faucet-smart
