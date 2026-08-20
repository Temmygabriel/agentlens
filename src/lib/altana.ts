// src/lib/altana.ts
// Altana / ERC-8183 on-chain hiring — VERIFIED API SKELETON (Phase 0 output).
//
// NOT WIRED YET. No live calls, no secrets, and no external imports — on purpose, so this
// sandbox branch's Vercel preview build stays green until Phase 1. Phase 3 replaces the
// local types/stubs below with the real `@altananetwork/sdk` per ALTANA_INTEGRATION.md.
//
// The agent's private key is NEVER hardcoded here and NEVER shipped to the client. It is
// read at runtime from a local/server-side secret (e.g. process.env.ALTANA_AGENT_PRIVATE_KEY),
// exactly like the Supabase service-role key. For this testnet experiment the key lives only
// on the builder's PC and signing happens locally — nothing is uploaded.
//
// API surface VERIFIED against the INSTALLED package @altananetwork/sdk@0.8.0 (Phase 1, 2026-08-20).
// NOTE: this corrects the Phase 0 notes — sessions are CLIENT METHODS, not standalone functions.
//   signer:  signerFromPrivateKey(key) -> Signer (our local key; wallet address == the EOA)
//   client:  createClient({ chains:[BNB_TESTNET], defaultChainId:97 })  (methods below)
//   wallet:  client.createWallet({ signer }) -> { address }   (counterfactual, no on-chain tx)
//   session: client.grantSession({ wallet, signer, permissions, expiry }) -> Session
//            client.execute({ session, calls }) / client.revokeSession({ wallet, signer, session })
//            client.registerSessionKey({ wallet, signer, session })  (makes the key visible in KeyStore)
//   hire:    hireErc8183Agent(session, { provider, task, budget }, { network:BNB_TESTNET }) -> { jobId, ... }
//   read:    getErc8183Job(network, jobId) / getErc8183DeliverableUrl(network, jobId)
//   settle:  settleErc8183Job(session, { jobId, action? }, opts) / buildClaimRefundCall(chainId, jobId)
//
// CRITICAL FOOTGUNS (enforced by the helpers below):
//   * permissions.calls omitted = UNRESTRICTED (within the spend cap). Always set BOTH.
//   * Session objects must be byte-exact on execute() — persist them exactly.
//   * SpendPermission.limit is in the token's SMALLEST unit on THAT chain (18 decimals for $U).
//   * grantSession registers the key in KeyStore by DEFAULT (register:true); pass register:false
//     for an ephemeral account-only session and registerSessionKey() later.

export const ALTANA_CHAINS = { bscMainnet: 56, bscTestnet: 97 } as const;
export const U_TOKEN_DECIMALS = 18;                              // $U budget has 18 decimals
export const DEFAULT_NETWORK: number = ALTANA_CHAINS.bscTestnet; // testnet-first (hard rule)

// Verified shapes mirroring @altananetwork/sdk (swapped for real imports in Phase 1).
// `signer` is intentionally omitted here — it is a live SDK object added when the SDK lands.
export type Hex = `0x${string}`;
// Real SDK shapes: a call rule needs at least a `to` or a `signature` (AND semantics if both).
export type CallPermission = { to: Hex; signature?: string } | { signature: string; to?: Hex };
// Real SDK period enum is wider than the Phase 0 note; `token` is OPTIONAL (omit = native coin).
export type SpendPermission = { limit: bigint; period: "minute" | "hour" | "day" | "week" | "month" | "year"; token?: Hex };
export type SessionPermissions = { calls?: readonly CallPermission[]; spend?: readonly SpendPermission[] };
export type AltanaSession = { walletAddress: Hex; publicKey: Hex; permissions: SessionPermissions; expiry: number };
export type Erc8183JobStatus = "OPEN" | "FUNDED" | "SUBMITTED" | "COMPLETED";
export type Erc8183Job = { jobId: string; status: Erc8183JobStatus; submittedAt: bigint; deliverable: Hex };
export type HireParams = { provider: Hex; task: string; budget: bigint };

const NOT_WIRED = "Altana on-chain hiring is not wired yet (Phase 1+). See ALTANA_INTEGRATION.md.";

// Phase 3 fills these with the real SDK. Typed stubs so future callers already compile.
export async function hireErc8183AgentOnChain(_session: AltanaSession, _params: HireParams, _network: number = DEFAULT_NETWORK): Promise<{ jobId: string }> { throw new Error(NOT_WIRED); }
export async function readErc8183Job(_network: number, _jobId: string): Promise<Erc8183Job> { throw new Error(NOT_WIRED); }

// --- Helpers that already work today (pure, testable, no SDK needed) ---

// Build a spend-capped, allowlisted permission set so we never accidentally grant an
// unrestricted session (the docs' main footgun). Always sets BOTH calls and spend.
export function buildScopedPermissions(opts: { contract: Hex; token: Hex; dailyLimit: bigint }): SessionPermissions {
  return { calls: [{ to: opts.contract }], spend: [{ limit: opts.dailyLimit, period: "day", token: opts.token }] };
}

// expiry is unix epoch SECONDS; caller passes the current time so this stays pure.
export function sessionExpirySeconds(nowUnixSeconds: number, days: number): number {
  return nowUnixSeconds + days * 24 * 60 * 60;
}

// Convert a human $U amount (e.g. 0.1) to the 18-decimal bigint the SDK expects.
export function uBudget(amount: number): bigint {
  const [whole, frac = ""] = String(amount).split(".");
  const fracPadded = (frac + "0".repeat(U_TOKEN_DECIMALS)).slice(0, U_TOKEN_DECIMALS);
  return BigInt(whole + fracPadded);
}
