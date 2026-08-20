// scripts/altana/verify_txs.mjs
// Independently confirm our Altana testnet txs against a PUBLIC RPC (not the relay),
// so the evidence stands on its own. Read-only.
//   Run:  node scripts/altana/verify_txs.mjs
import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

const rpc = createPublicClient({ chain: bscTestnet, transport: http("https://bsc-testnet-rpc.publicnode.com") });
const TXS = [
  ["grant #1 (later revoked)", "0xffa0ac8472cf8926af9e6e03f79d19df7129a459824613300e0f61943f70a382"],
  ["grant #2 (live session)  ", "0x1bbbf4ed048eaebf59bc7413297d92c3539cae87f437aa7622e3fe368020c0e3"],
  ["execute VIA session key  ", "0x9d9120ce9b6f1b598da7f1cb92382ca88b508385a43e82b5aab0d29e7c5083d4"],
  ["revoke session #1        ", "0xcc2accbbfbb5678fcc10f4725cd7e8a0fdc40db5b7ddb06cce2d60bec94bc67a"],
];
for (const [label, hash] of TXS) {
  try {
    const r = await rpc.getTransactionReceipt({ hash });
    console.log(`${r.status === "success" ? "✅" : "❌"} ${label}  block ${r.blockNumber}  status ${r.status}  gasUsed ${r.gasUsed}`);
  } catch (e) {
    console.log(`⏳ ${label}  not found yet — ${String(e.shortMessage || e.message || e).slice(0, 60)}`);
  }
}
process.exit(0);
