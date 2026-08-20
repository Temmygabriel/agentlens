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
**Status:** **Phase 1 DONE (2026-08-20).** SDK **installed** (`@altananetwork/sdk@0.8.0`,
pinned, + deps `ox`/`porto`/`viem`) and its API surface verified against the **installed
package's own type defs** (not just docs — see "Phase 0/1 — verified" below; the session API
in the old notes was wrong and is now corrected). Proven end-to-end with our real key via
`scripts/altana/phase1_setup.mjs`: `signerFromPrivateKey` → `createClient({chains:[BNB_TESTNET]})`
→ `client.createWallet({signer})` returns a wallet whose **address equals our funded EOA**
`0xCE79…4780`; testnet **relay reachable**; **tBNB (gas) = 0.2 ✅**; **$U (job budget) = 0** ⚠️.
Signing scripts run **locally** (key never leaves the PC). **Next = Phase 2**: get testnet **$U**,
then grant a scoped session + build the revoke UI.

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

**Phase 0 — verify + set up:**
- ✅ **SDK confirmed** on npm: `@altananetwork/sdk@0.8.0`.
- ✅ **API verified against the live docs (2026-08-20)** — see "Phase 0 — verified" below.
- ✅ **Testnet agent wallet generated** (chain 97). The private key is stored **only on
  the builder's PC** at `~/.agentlens/altana-testnet-wallet.json`, **never committed and
  never uploaded** (per explicit instruction). Signing in Phase 3 happens **locally** from
  that file, so the key never leaves the machine. (The public address is not stored in this
  repo either; it goes in the submission form at Phase 4.)
- ⬜ Fund the wallet from `https://testnet.bnbchain.org/faucet-smart` (chain 97). **← user step**
- ⬜ (optional) Altana workshop / office hours during the build period.

### Phase 0 — verified (confirmed from https://docs.altana.network, 2026-08-20)

**Hiring (ERC-8183):** `hireErc8183Agent(session, params, opts) -> { jobId }` (also a
`(wallet, signer, params, opts)` form). `params = { provider: "0x…seller", task, budget }`;
`opts = { network }`. One atomic relay intent bundles createJob → registerJob → setBudget →
approve → fund. **Budget is $U, 18 decimals** (`100_000_000_000_000_000n` = 0.1 $U). Read:
`getErc8183Job(net, jobId)` (OPEN→FUNDED→SUBMITTED→COMPLETED; check `job.submittedAt > 0n`),
`getErc8183DeliverableUrl(net, jobId)` (`job.deliverable` is keccak256 of the manifest —
verify before trusting). Settle: `settleErc8183Job(wallet, signer, { jobId[, action:"dispute"] },
opts)`; refund after expiry via `buildClaimRefundCall(56, jobId)`. `ERC8183_ADDRESSES` covers
**BSC 56 AND testnet 97** ✅.

**Sessions (CORRECTED — these are `client` METHODS, not standalone functions):** from
`const client = createClient({ chains:[BNB_TESTNET], defaultChainId:97 })` —
`client.grantSession({ wallet, signer, permissions, expiry, register? })` returns a `Session`
(+`transactionHash`); `client.execute({ session, calls })` acts within it; `client.revokeSession({
wallet, signer, session })` revokes in one tx (immediate; also auto-expires at `expiry`);
`client.registerSessionKey({ wallet, signer, session })` makes an unregistered key visible in
KeyStore. `Session = { walletAddress, signer, publicKey, permissions, expiry(unixSeconds) }`.
`SessionPermissions = { calls?, spend? }`; `CallPermission = {to} | {signature} | {to,signature}(AND)`;
`SpendPermission = { limit, period:"minute"|"hour"|"day"|"week"|"month"|"year", token? }` (**limit in the
token's smallest unit; omit token = native coin**). `grantSession` **registers the key in KeyStore by
default** (`register:true`). Signer for our key = `signerFromPrivateKey(pk)` (its `.address` == the EOA,
so `createWallet` yields that same address as the smart account). Standalone `execute`/`hireErc8183Agent`
also exist with `(wallet, signer, …, opts)` OR `(session, …, opts)` overloads, `opts = { network:BNB_TESTNET }`.

**⚠️ Footguns (baked into `src/lib/altana.ts`):** (1) `permissions.calls` omitted =
**UNRESTRICTED** within the spend cap → always set BOTH `calls` and `spend`
(`buildScopedPermissions()` does). (2) Session objects must be **byte-exact on `execute()`**
→ persist exactly. (3) Keys stay **local/server-side**, never client-shipped.

**Phase 1 — install + wire + prove (✅ DONE 2026-08-20):** `@altananetwork/sdk@0.8.0`
installed (pinned) + deps. Local runner scripts added under `scripts/altana/`:
`_wallet.mjs` (loads the key from `~/.agentlens/…`, never prints it), `whoami.mjs`
(balance sanity check), `inspect_sdk.mjs` (dumps the real export surface), and
`phase1_setup.mjs` (signer → client → wallet, reads balances, **no tx**). Proven:
wallet address == funded EOA, tBNB 0.2, $U 0. **KEY-HANDLING NOTE (overrides the old
"server-side env var" plan):** by explicit instruction the private key stays **only on the
builder's PC** and is **never** put in Vercel/env/online — so the signing steps (Phase 2/3)
run as **local Node scripts**, not from the deployed web app. The deployed app only does
public reads (job status) + shows the scope/revoke UI. Chain 97 only.

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

## Open questions (updated Phase 1)

- ✅ **Session/Keystore API surface — RESOLVED & CORRECTED** (see "Sessions (CORRECTED)":
  they are `client.grantSession/execute/revokeSession/registerSessionKey` METHODS, not the
  standalone `grantSession/execute/revokeSession` the Phase 0 note wrongly listed).
- 🔑 **NEW BLOCKER — testnet $U.** An on-chain hire funds the job budget in `$U`
  (testnet token `0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565`), and our wallet holds **0**.
  Need to source testnet $U (Altana faucet / mint / swap) before Phase 3. Gas (tBNB) is fine.
  → resolve at the start of Phase 2.
- ⬜ XP allocation mechanics — still "to be confirmed" by Altana.
- ⬜ Does any agent already in our index expose an ERC-8183 **seller** address we can hire
  directly? Our HeyAnon agents answered read calls over MCP for the TermiX runs, but that is
  not the same as an on-chain ERC-8183 seller — confirm in Phase 2/3.

## Links

- Altana docs: https://docs.altana.network/ (LLM summary: `/llms.txt`, full: `/llms-full.txt`)
- ERC-8183 SDK: https://docs.altana.network/sdk/erc8183
- Sessions: https://docs.altana.network/concepts/sessions
- x402 server SDK: https://docs.altana.network/sdk/x402-server
- SDK + MCP server: https://github.com/altananetwork/altana-sdk
- Composable skills (Venus, Aave, PancakeSwap, Lista, Copy Trade…): https://skills.altana.network
- BSC testnet faucet: https://testnet.bnbchain.org/faucet-smart
