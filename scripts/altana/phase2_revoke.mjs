// scripts/altana/phase2_revoke.mjs
// Revoke a session key in ONE transaction (immediate on-chain). Proves the
// "user-facing control / revoke" requirement. Signs LOCALLY from ~/.agentlens.
//   Run:  node scripts/altana/phase2_revoke.mjs <session-public-key 0x04...>
import { signerFromPrivateKey, createClient, BNB_TESTNET } from "@altananetwork/sdk";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const withTimeout = (p, ms, l) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(`${l} timed out`)), ms).unref?.())]);
const { privateKey } = JSON.parse(readFileSync(join(homedir(), ".agentlens", "altana-testnet-wallet.json"), "utf8"));
const adminSigner = signerFromPrivateKey(privateKey);
const client = createClient({ chains: [BNB_TESTNET], defaultChainId: 97 });
const wallet = { address: adminSigner.address };

const pub = process.argv[2];
if (!/^0x04[0-9a-fA-F]{128}$/.test(pub || "")) { console.log("usage: node scripts/altana/phase2_revoke.mjs <session-public-key 0x04...>"); process.exit(1); }

console.log("revoking session:", pub);
console.log("on wallet        :", wallet.address);
const res = await withTimeout(client.revokeSession({ wallet, signer: adminSigner, session: pub, chainId: 97 }), 150000, "revokeSession");
console.log("  ✅ status:", res.status, "| tx:", res.transactionHash ?? "(no hash surfaced)", "| callsId:", res.callsId);
if (res.transactionHash) console.log("  Explorer:", BNB_TESTNET.explorer + "/tx/" + res.transactionHash);
process.exit(0);
