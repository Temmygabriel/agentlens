// scripts/altana/whoami.mjs
// READ-ONLY sanity check for Phase 1: proves the LOCAL key loads and testnet RPC works.
// Prints the address, chain, and native tBNB (gas) balance. NEVER prints the key.
//
//   Run:  node scripts/altana/whoami.mjs
import { createPublicClient, http, formatEther } from "viem";
import { bscTestnet } from "viem/chains";
import { loadAgentWallet, KEY_PATH } from "./_wallet.mjs";

const RPCS = [
  "https://bsc-testnet-rpc.publicnode.com",
  "https://data-seed-prebsc-1-s1.binance.org:8545",
  "https://data-seed-prebsc-2-s1.binance.org:8545",
];

const { address, chainId } = loadAgentWallet();
console.log("Key file:    ", KEY_PATH, "(read locally; key NOT shown)");
console.log("Agent addr:  ", address);
console.log("Chain (file):", chainId);

for (const url of RPCS) {
  try {
    const client = createPublicClient({ chain: bscTestnet, transport: http(url) });
    const [bal, liveChain] = await Promise.all([
      client.getBalance({ address }),
      client.getChainId(),
    ]);
    console.log("RPC:         ", url);
    console.log("Live chain:  ", liveChain);
    console.log("tBNB (gas):  ", formatEther(bal));
    process.exit(0);
  } catch (e) {
    console.error("RPC failed:", url, String(e.message || e).slice(0, 100));
  }
}
console.error("ALL_RPCS_FAILED");
process.exit(1);
