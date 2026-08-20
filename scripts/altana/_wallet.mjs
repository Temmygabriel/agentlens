// scripts/altana/_wallet.mjs
// Loads the Altana TESTNET agent wallet from the builder's LOCAL machine.
//
// The private key lives ONLY at ~/.agentlens/altana-testnet-wallet.json — off-repo and
// off-cloud, by explicit instruction. THIS FILE CONTAINS NO SECRET: it only reads that
// path at runtime and NEVER prints or returns the raw key. Safe to commit.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { privateKeyToAccount } from "viem/accounts";

export const KEY_PATH = join(homedir(), ".agentlens", "altana-testnet-wallet.json");

export function loadAgentWallet() {
  let raw;
  try {
    raw = readFileSync(KEY_PATH, "utf8");
  } catch (e) {
    throw new Error(`Cannot read wallet file at ${KEY_PATH} (${e.code || e.message}). ` +
      `Generate/fund it first — see ALTANA_INTEGRATION.md.`);
  }
  const data = JSON.parse(raw);
  const pk = data.privateKey;
  if (!/^0x[0-9a-fA-F]{64}$/.test(pk || "")) {
    throw new Error("privateKey missing or malformed in wallet file (expected 0x + 64 hex chars).");
  }
  const account = privateKeyToAccount(pk);
  if (data.address && data.address.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error(`Address mismatch: file says ${data.address} but the key derives ${account.address}.`);
  }
  // NOTE: returns a viem `account` object that can SIGN, but never the raw key string.
  return { account, address: account.address, chainId: data.chainId ?? 97 };
}
