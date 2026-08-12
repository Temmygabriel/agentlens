import { createPublicClient, http, parseAbi } from "viem";
import { bsc } from "viem/chains";

export const BSC_RPC_URL =
  process.env.BSC_RPC_URL || "https://bsc-dataseed.bnbchain.org";

export const ERC8004_IDENTITY_REGISTRY =
  "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

const identityAbi = parseAbi([
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
]);

export const bscClient = createPublicClient({
  chain: bsc,
  transport: http(BSC_RPC_URL),
});

export async function getAgentTokenUri(agentId: bigint) {
  return bscClient.readContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: "tokenURI",
    args: [agentId],
  });
}

export async function getAgentOwner(agentId: bigint) {
  return bscClient.readContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: "ownerOf",
    args: [agentId],
  });
}
