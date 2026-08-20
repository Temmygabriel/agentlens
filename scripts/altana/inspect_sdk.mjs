// scripts/altana/inspect_sdk.mjs
// Prints the REAL export surface of @altananetwork/sdk so we build against what's
// actually installed, not against notes/docs. Read-only. Run:
//   node scripts/altana/inspect_sdk.mjs
import * as sdk from "@altananetwork/sdk";

const keys = Object.keys(sdk).sort();
console.log("=== @altananetwork/sdk exports:", keys.length, "===");
for (const k of keys) {
  const v = sdk[k];
  const t = typeof v;
  let extra = "";
  if (t === "function") extra = `(arity ${v.length})`;
  else if (t === "object" && v) extra = `{ ${Object.keys(v).slice(0, 12).join(", ")} }`;
  else if (t !== "object") extra = `= ${String(v).slice(0, 60)}`;
  console.log(`${t.padEnd(8)} ${k} ${extra}`);
}

console.log("\n=== Do the functions the plan assumes actually exist? ===");
const expected = [
  "hireErc8183Agent", "getErc8183Job", "getErc8183DeliverableUrl",
  "settleErc8183Job", "buildClaimRefundCall",
  "grantSession", "execute", "revokeSession",
  "ERC8183_ADDRESSES", "BNB",
];
for (const name of expected) {
  const present = name in sdk;
  console.log(`${present ? "YES" : "NO "}  ${name}${present ? "  (" + typeof sdk[name] + ")" : ""}`);
}

if (sdk.ERC8183_ADDRESSES) {
  console.log("\n=== ERC8183_ADDRESSES ===");
  console.log(JSON.stringify(sdk.ERC8183_ADDRESSES, (_k, v) => typeof v === "bigint" ? v.toString() : v, 2));
}
