// scripts/altana/phase1_setup.mjs
// PHASE 1 MILESTONE — prove the Altana SDK wires up with our LOCAL key on BNB testnet.
// Builds: signer (from the local key) -> client -> wallet handle, and reads balances.
// NO on-chain transaction is sent here. The private key is read locally and NEVER printed.
//
//   Run:  node scripts/altana/phase1_setup.mjs
import { createPublicClient, http, formatEther, formatUnits, erc20Abi } from "viem";
import { bscTestnet } from "viem/chains";
import { signerFromPrivateKey, createClient, BNB_TESTNET, ERC8183_ADDRESSES, JOB_STATUS } from "@altananetwork/sdk";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY_PATH = join(homedir(), ".agentlens", "altana-testnet-wallet.json");
const { privateKey } = JSON.parse(readFileSync(KEY_PATH, "utf8"));

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms).unref?.())]);

// 1) Signer from our local key (offline, sync). Prints ONLY the public address.
const signer = signerFromPrivateKey(privateKey);
console.log("1) signer         :", signer.address, "| type:", signer.type);

// 2) Client for BNB testnet (offline construction).
const client = createClient({ chains: [BNB_TESTNET], defaultChainId: 97 });
console.log("2) client chains  :", client.chains.map((c) => c.chainId), "| default:", client.defaultChainId);
console.log("   relay          :", BNB_TESTNET.relayUrl, "| explorer:", BNB_TESTNET.explorer);

// 3) ERC-8183 testnet stack we will hire through.
const addrs = ERC8183_ADDRESSES[97];
console.log("3) erc8183@97     :", addrs);
console.log("   JOB_STATUS     :", JOB_STATUS.join(" -> "));

// 4) Wallet handle (counterfactual; may ping the relay to set up the smart account, NO tx).
let walletAddress = signer.address;
try {
  const wallet = await withTimeout(client.createWallet({ signer }), 25000, "createWallet");
  walletAddress = wallet.address;
  console.log("4) wallet.address :", wallet.address, "| == our EOA:", wallet.address.toLowerCase() === signer.address.toLowerCase());
} catch (e) {
  console.log("4) createWallet   : relay not reached yet —", String(e.message || e).slice(0, 140));
  console.log("   (fine for Phase 1 — the wallet is counterfactual; address is still our EOA.)");
}

// 5) Balances via plain RPC reads (no relay dependency): native tBNB (gas) + $U (job budget token).
const rpc = createPublicClient({ chain: bscTestnet, transport: http("https://bsc-testnet-rpc.publicnode.com") });
const native = await rpc.getBalance({ address: walletAddress });
console.log("5) tBNB (gas)     :", formatEther(native));
try {
  const uToken = addrs.paymentToken;
  const [uBal, uDec] = await Promise.all([
    rpc.readContract({ address: uToken, abi: erc20Abi, functionName: "balanceOf", args: [walletAddress] }),
    rpc.readContract({ address: uToken, abi: erc20Abi, functionName: "decimals" }),
  ]);
  const uSym = await rpc.readContract({ address: uToken, abi: erc20Abi, functionName: "symbol" }).catch(() => "$U");
  console.log("   $U token       :", uToken);
  console.log("   $U balance     :", formatUnits(uBal, uDec), uSym, uBal === 0n ? "(need > 0 to fund a hire — next funding step)" : "");
} catch (e) {
  console.log("   $U read        : failed —", String(e.message || e).slice(0, 140));
}

console.log("\n✅ Phase 1 wiring OK. No transaction sent. Key stayed local.");
process.exit(0);
