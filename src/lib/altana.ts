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
// API surface confirmed against https://docs.altana.network (2026-08-20):
//   hire:    hireErc8183Agent(session, params, opts) -> { jobId }
//   read:    getErc8183Job(net, jobId) / getErc8183DeliverableUrl(net, jobId)
//   settle:  settleErc8183Job(...) / buildClaimRefundCall(chainId, jobId)
//   session: grantSession(session) / execute(session, calls) / revokeSession(...)
//
// CRITICAL FOOTGUNS from the docs — enforced by the helpers below:
//   * permissions.calls omitted = UNRESTRICTED (within the spend cap). Always set BOTH.
//   * Session objects must be byte-exact on execute() — persist them exactly.
//   * SpendPermission.limit is in the token's SMALLEST unit on THAT chain.
//   * Session public key is registered in the on-chain Keystore by default at grant.

export const ALTANA_CHAINS = { bscMainnet: 56, bscTestnet: 97 } as const;
export const U_TOKEN_DECIMALS = 18;                              // $U budget has 18 decimals
export const DEFAULT_NETWORK: number = ALTANA_CHAINS.bscTestnet; // testnet-first (hard rule)

// Verified shapes mirroring @altananetwork/sdk (swapped for real imports in Phase 1).
// `signer` is intentionally omitted here — it is a live SDK object added when the SDK lands.
export type Hex = `0x${string}`;
export type CallPermission = { to?: Hex; signature?: string };
export type SpendPermission = { limit: bigint; period: "day" | "week" | "month"; token: Hex };
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
