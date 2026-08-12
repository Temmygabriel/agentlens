export type AgentService = {
  name?: string;
  endpoint?: string;
  version?: string;
};

export type AgentRegistration = {
  type?: string;
  name?: string;
  description?: string;
  image?: string;
  services?: AgentService[];
  active?: boolean;
  x402Support?: boolean;
  registrations?: Array<Record<string, unknown>>;
  supportedTrust?: string[];
  [key: string]: unknown;
};

function decodeDataUri(uri: string): string | null {
  if (!uri.startsWith("data:")) return null;
  const comma = uri.indexOf(",");
  if (comma === -1) return null;
  const meta = uri.slice(5, comma);
  const data = uri.slice(comma + 1);
  try {
    if (meta.includes(";base64")) return Buffer.from(data, "base64").toString("utf8");
    return decodeURIComponent(data);
  } catch {
    return null;
  }
}

export function normalizeEndpoint(raw: string): string {
  const value = raw.trim();
  const markdown = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/i);
  if (markdown) return markdown[2];
  return value;
}

export function classifyServiceProtocol(name?: string, endpoint?: string): string {
  const value = `${name ?? ""} ${endpoint ?? ""}`.toLowerCase();
  if (value.includes("agentwallet") || value.startsWith("eip155:")) return "agentWallet";
  if (value.includes("email") || value.startsWith("mailto:")) return "email";
  if (value.includes("mcp")) return "MCP";
  if (value.includes("a2a") || value.includes("agent-card")) return "A2A";
  if (value.includes("oasf")) return "OASF";
  if (value.includes("x402")) return "x402";
  return "web";
}

export async function resolveAgentMetadata(uri: string): Promise<AgentRegistration> {
  const data = decodeDataUri(uri);
  if (data) return JSON.parse(data) as AgentRegistration;

  const normalized = uri.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${uri.slice("ipfs://".length)}`
    : uri;

  const response = await fetch(normalized, {
    headers: { accept: "application/json,text/plain;q=0.9,*/*;q=0.8" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Metadata request failed: ${response.status}`);
  }

  const text = await response.text();
  if (text.length > 1_000_000) throw new Error("Metadata exceeds 1 MB limit");
  return JSON.parse(text) as AgentRegistration;
}
