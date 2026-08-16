const BASE_URL = "https://8004scan.io/api/v1/public/agents";

export type IndexedAgent = {
  chainId: number;
  agentId: string;
  owner?: string | null;
  agentUri?: string | null;
  name?: string | null;
  description?: string | null;
  image?: string | null;
  active?: boolean | null;
  x402Support?: boolean | null;
  raw: unknown;
};

function first(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function asString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function unwrap(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  for (const key of ["agents", "data", "items", "results"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function mapAgent(item: any): IndexedAgent | null {
  const chainId = Number(first(item?.chainId, item?.chain_id, item?.chain?.id, 56));
  const agentId = asString(first(item?.agentId, item?.agent_id, item?.tokenId, item?.token_id));
  if (!agentId || !Number.isFinite(chainId)) return null;

  return {
    chainId,
    agentId,
    owner: asString(first(item?.owner, item?.ownerAddress, item?.owner_address)),
    agentUri: asString(first(item?.agentUri, item?.agentURI, item?.agent_uri, item?.tokenURI, item?.token_uri)),
    name: asString(first(item?.name, item?.agentName, item?.agent_name)),
    description: asString(item?.description),
    image: asString(item?.image),
    active: typeof item?.active === "boolean" ? item.active : null,
    x402Support: typeof item?.x402Support === "boolean" ? item.x402Support : null,
    raw: item,
  };
}

export async function fetchIndexedAgents({ page = 1, limit = 50, chainId = 56 } = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("chainId", String(chainId));

  const headers: HeadersInit = { accept: "application/json" };
  if (process.env.EIGHT004SCAN_API_KEY) {
    headers.authorization = `Bearer ${process.env.EIGHT004SCAN_API_KEY}`;
  }

  const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`8004scan request failed: ${response.status}`);

  const payload = await response.json();
  const agents = unwrap(payload).map(mapAgent).filter(Boolean) as IndexedAgent[];
  return { agents, raw: payload };
}

/**
 * 8004scan's list API does not reliably include a resolvable metadata
 * URI per agent — its "agentId" is instead a composite string like
 * "56:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432:266231" (chainId:registry:tokenId).
 * When we can't find an agentUri in the list payload, we fall back to
 * reading tokenURI directly from the on-chain registry using the
 * numeric token ID extracted from this composite string.
 */
export function parseOnChainTokenId(agentId: string): bigint | null {
  const parts = agentId.split(":");
  const last = parts[parts.length - 1];
  if (!last || !/^\d+$/.test(last)) return null;
  try {
    return BigInt(last);
  } catch {
    return null;
  }
}