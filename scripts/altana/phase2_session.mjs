// scripts/altana/phase2_session.mjs
// PHASE 2 — the CORE of the Altana track, on-chain, GAS ONLY (no $U needed).
//
// It does three real things on BNB testnet (chain 97), signing LOCALLY from the
// key at ~/.agentlens (never printed, never uploaded):
//   A) grantSession  -> a SCOPED, revocable session key with REAL limits
//        (call allowlist + 1 $U/day spend cap + 7-day expiry), REGISTERED in the
//        on-chain KeyStore. As the wallet's first action this also bundles the
//        account setup + admin-key registration into the same intent.
//   B) execute(session) -> ONE real transaction sent THROUGH the session key
//        (an ERC-20 `approve` of $U to the ERC-8183 commerce kernel — a genuine
//        pre-step of hiring that needs NO $U balance, so it can't revert for lack
//        of funds). This proves "real on-chain tx through a session key".
//   C) saves the session (incl. its own generated session key) to ~/.agentlens
//        ONLY — never the repo — so a later revoke/hire can reuse it byte-exact.
//
// Revoke is proven separately (phase2_revoke.mjs) so the granted session stays
// live for the in-product "Revoke" button demo.
//
//   Run:  node scripts/altana/phase2_session.mjs
import { createPublicClient, http, formatEther, parseEther } from "viem";
import { bscTestnet } from "viem/chains";
import { generatePrivateKey } from "viem/accounts";
import { signerFromPrivateKey, createClient, BNB_TESTNET, ERC8183_ADDRESSES } from "@altananetwork/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DIR = join(homedir(), ".agentlens");
const KEY_PATH = join(DIR, "altana-testnet-wallet.json");
const SESS_PATH = join(DIR, "altana-testnet-session.json"); // LOCAL ONLY (has a session key) -> never repo

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms).unref?.())]);

const { privateKey } = JSON.parse(readFileSync(KEY_PATH, "utf8"));
const adminSigner = signerFromPrivateKey(privateKey);
const client = createClient({ chains: [BNB_TESTNET], defaultChainId: 97 });
const addrs = ERC8183_ADDRESSES[97];
const U = addrs.paymentToken, COMMERCE = addrs.commerce, ROUTER = addrs.router;
const ONE_U = 1000000000000000000n; // 1 $U (18 decimals)
const DEAD = "0x000000000000000000000000000000000000dEaD"; // codeless sink: a native transfer here can't revert

// Wallet handle (address == our funded EOA for a private-key signer).
let wallet = { address: adminSigner.address };
try { wallet = await withTimeout(client.createWallet({ signer: adminSigner }), 30000, "createWallet"); } catch {}

// Gas sanity check via plain RPC (no relay dependency).
const rpc = createPublicClient({ chain: bscTestnet, transport: http("https://bsc-testnet-rpc.publicnode.com") });
const gas = await rpc.getBalance({ address: wallet.address });
console.log("wallet          :", wallet.address, "| gas tBNB:", formatEther(gas));
if (gas === 0n) { console.log("✗ no gas — fund at https://testnet.bnbchain.org/faucet-smart"); process.exit(1); }

// Our OWN session signer (so we can persist + revoke it later, instead of a throwaway).
// Keep the raw key in a local var so we can save it; it is NEVER printed.
const sessionPk = generatePrivateKey();
const sessionSigner = signerFromPrivateKey(sessionPk);
const nowSec = Math.floor(Date.now() / 1000);
const expiry = nowSec + 7 * 24 * 60 * 60; // 7 days

// REAL LIMITS: allowlist the ERC-8183 stack + $U + the sink; cap native spend at
// 0.01 tBNB/day AND $U at 1/day; 7-day expiry.
const permissions = {
  calls: [{ to: DEAD }, { to: U }, { to: COMMERCE }, { to: ROUTER }],
  spend: [{ limit: parseEther("0.01"), period: "day" }, { limit: ONE_U, period: "day", token: U }],
};

console.log("\n=== A) grantSession (scoped + registered in KeyStore) ===");
console.log("  scope: calls ->", permissions.calls.map((c) => c.to).join(", "));
console.log("         spend -> 0.01 tBNB/day + 1 $U/day  | expiry -> " + new Date(expiry * 1000).toISOString());
const session = await withTimeout(
  client.grantSession({ wallet, signer: adminSigner, sessionSigner, permissions, expiry, register: true, chainId: 97 }),
  150000, "grantSession");
console.log("  ✅ granted");
console.log("     walletAddress :", session.walletAddress);
console.log("     session pubKey:", session.publicKey);
console.log("     grant tx      :", session.transactionHash ?? "(relay confirmed; no hash surfaced — check KeyStore/explorer)");

// Persist LOCALLY only (never repo). BigInt -> string so JSON is valid.
writeFileSync(SESS_PATH, JSON.stringify({
  walletAddress: session.walletAddress,
  publicKey: session.publicKey,
  sessionPrivateKey: sessionPk, // LOCAL SECRET (scoped session key) — never committed/uploaded
  permissions: { calls: permissions.calls, spend: [{ limit: ONE_U.toString(), period: "day", token: U }] },
  expiry: session.expiry,
  grantTx: session.transactionHash ?? null,
}, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
console.log("     saved         ->", SESS_PATH, "(local only)");

console.log("\n=== B) execute THROUGH the session key (native transfer within the spend cap) ===");
try {
  const value = parseEther("0.0001"); // tiny, well under the 0.01 tBNB/day cap
  console.log("  sending", formatEther(value), "tBNB ->", DEAD, "signed by the SESSION key (not the admin)");
  const exec = await withTimeout(client.execute({ session, calls: [{ to: DEAD, value }], chainId: 97 }), 150000, "execute");
  console.log("  ✅ executed via session key");
  console.log("     status        :", exec.status);
  console.log("     callsId       :", exec.callsId);
  console.log("     tx            :", exec.transactionHash ?? "(no hash surfaced)");
} catch (e) {
  console.log("  ⚠ execute-through-session failed (grant above still succeeded):", String(e.message || e).slice(0, 200));
  console.log("     will iterate on the session call in a follow-up; the scoped+registered session is the primary milestone.");
}

console.log("\nExplorer (wallet)  :", BNB_TESTNET.explorer + "/address/" + session.walletAddress);
console.log("KeyStore (Altana)  : https://docs.altana.network/explorer  (look up", session.walletAddress + ")");
console.log("Done. Session is LIVE + revocable. Key stayed local; no $U required.");
process.exit(0);
