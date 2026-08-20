// scripts/altana/probe_u_token.mjs
// READ-ONLY probe of the testnet $U token. Goal: is there a permissionless way to get $U?
// It reads metadata, scans bytecode for common faucet selectors, then SIMULATES each
// candidate via eth_call from our wallet (NO transaction is sent). Run:
//   node scripts/altana/probe_u_token.mjs
import { createPublicClient, http, toFunctionSelector, encodeFunctionData, erc20Abi, formatUnits } from "viem";
import { bscTestnet } from "viem/chains";

const U = "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565";
const ME = "0xCE794C8c9785a80e4D56a42E9Afeac08971e4780";
const rpc = createPublicClient({ chain: bscTestnet, transport: http("https://bsc-testnet-rpc.publicnode.com") });

const [name, sym, dec, supply] = await Promise.all([
  rpc.readContract({ address: U, abi: erc20Abi, functionName: "name" }).catch(() => "?"),
  rpc.readContract({ address: U, abi: erc20Abi, functionName: "symbol" }).catch(() => "?"),
  rpc.readContract({ address: U, abi: erc20Abi, functionName: "decimals" }).catch(() => 18),
  rpc.readContract({ address: U, abi: erc20Abi, functionName: "totalSupply" }).catch(() => 0n),
]);
console.log("token   :", name, "|", sym, "| decimals", dec, "| totalSupply", formatUnits(supply, dec));

const code = await rpc.getBytecode({ address: U });
console.log("bytecode:", code ? `${code.length} chars` : "NONE");
// EIP-1967 implementation slot (is it a proxy?)
const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const impl = await rpc.getStorageAt({ address: U, slot: implSlot }).catch(() => null);
if (impl && impl !== "0x" && BigInt(impl) !== 0n) console.log("proxy   : YES -> impl", "0x" + impl.slice(-40));

const amt = 100n * 10n ** BigInt(dec); // 100 $U
const two = (n) => [{ type: "function", name: n, inputs: [{ type: "address" }, { type: "uint256" }], outputs: [], stateMutability: "nonpayable" }];
const oneU = (n) => [{ type: "function", name: n, inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" }];
const oneA = (n) => [{ type: "function", name: n, inputs: [{ type: "address" }], outputs: [], stateMutability: "nonpayable" }];
const none = (n) => [{ type: "function", name: n, inputs: [], outputs: [], stateMutability: "nonpayable" }];

const candidates = [
  ["mint(address,uint256)", () => encodeFunctionData({ abi: two("mint"), functionName: "mint", args: [ME, amt] })],
  ["mintTo(address,uint256)", () => encodeFunctionData({ abi: two("mintTo"), functionName: "mintTo", args: [ME, amt] })],
  ["gift(address,uint256)", () => encodeFunctionData({ abi: two("gift"), functionName: "gift", args: [ME, amt] })],
  ["mint(uint256)", () => encodeFunctionData({ abi: oneU("mint"), functionName: "mint", args: [amt] })],
  ["claim(uint256)", () => encodeFunctionData({ abi: oneU("claim"), functionName: "claim", args: [amt] })],
  ["freeMint(uint256)", () => encodeFunctionData({ abi: oneU("freeMint"), functionName: "freeMint", args: [amt] })],
  ["drip(address)", () => encodeFunctionData({ abi: oneA("drip"), functionName: "drip", args: [ME] })],
  ["faucet(address)", () => encodeFunctionData({ abi: oneA("faucet"), functionName: "faucet", args: [ME] })],
  ["mint()", () => encodeFunctionData({ abi: none("mint"), functionName: "mint", args: [] })],
  ["drip()", () => encodeFunctionData({ abi: none("drip"), functionName: "drip", args: [] })],
  ["faucet()", () => encodeFunctionData({ abi: none("faucet"), functionName: "faucet", args: [] })],
  ["claim()", () => encodeFunctionData({ abi: none("claim"), functionName: "claim", args: [] })],
  ["getTokens()", () => encodeFunctionData({ abi: none("getTokens"), functionName: "getTokens", args: [] })],
  ["requestTokens()", () => encodeFunctionData({ abi: none("requestTokens"), functionName: "requestTokens", args: [] })],
  ["freeMint()", () => encodeFunctionData({ abi: none("freeMint"), functionName: "freeMint", args: [] })],
];

console.log("\n=== simulate each candidate from our wallet (eth_call, NO tx) ===");
const winners = [];
for (const [sig, mk] of candidates) {
  const sel = toFunctionSelector(sig);
  const inCode = code && code.toLowerCase().includes(sel.slice(2).toLowerCase());
  try {
    await rpc.call({ account: ME, to: U, data: mk() });
    winners.push(sig);
    console.log(`✅ WOULD SUCCEED   ${sig}  ${sel}${inCode ? " [selector in bytecode]" : ""}  <-- permissionless!`);
  } catch (e) {
    const msg = String(e.shortMessage || e.message || e).replace(/\s+/g, " ").slice(0, 80);
    console.log(`   revert         ${sig}  ${sel}${inCode ? " [selector in bytecode]" : ""}  ${msg}`);
  }
}
console.log(winners.length ? `\n➡  Permissionless funding path found: ${winners.join(", ")}` : "\n➡  No permissionless mint/faucet on the token itself.");
process.exit(0);
