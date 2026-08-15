export type AgentService = {
  name?: string;
  endpoint?: string;
  version?: string;
  skills?: unknown;
  domains?: unknown;
  [key: string]: unknown;
};

export type AgentRegistration = {
  type?: string;
  name?: string;
  description?: string;
  image?: string;
  services?: AgentService[];
  // Legacy field name (pre Jan 2026 EIP-8004 spec) — still widely used.
  // See https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html
  endpoints?: AgentService[];
  active?: boolean;
  x402Support?: boolean;
  registrations?: Array<Record<string, unknown>>;
  supportedTrust?: string[];
  [key: string]: unknown;
};

/**
 * Returns the agent's declared services array, preferring the current
 * "services" field name but falling back to the legacy "endpoints" name
 * (both are valid per 8004scan's field-name migration guidance — if
 * both are present, "services" wins).
 */
function servicesOf(registration: AgentRegistration): AgentService[] {
  if (Array.isArray(registration.services)) return registration.services;
  if (Array.isArray(registration.endpoints)) return registration.endpoints;
  return [];
}

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

// --- Rich metadata extraction (OASF-aware, defensive) -----------------
//
// Registration JSON is untrusted, third-party, and inconsistent in shape.
// These extractors never throw: unknown/missing fields simply yield [].
//
// Per 8004scan's Agent Metadata Profile, OASF skills/domains live INSIDE
// the OASF service entry (services[].skills / services[].domains), not
// at the top level of the registration document:
//   { "services": [ { "name": "OASF", "skills": [...], "domains": [...] } ] }
// We check there first, then fall back to top-level fields some agents
// place them at anyway, then finally to keyword inference from text.

const KNOWN_CAPABILITY_KEYWORDS: Record<string, string[]> = {
  trading: ["trade", "trading", "swap", "market-making", "arbitrage", "dex", "execution"],
  yield: ["yield", "liquidity", "lp", "staking", "apy", "lending", "borrowing"],
  monitoring: ["monitor", "monitoring", "alert", "watch", "position", "health factor", "liquidation"],
  research: ["research", "analysis", "analytics", "news", "intelligence", "insights"],
  security: ["security", "risk", "audit", "threat", "scam", "safety"],
  automation: ["automation", "automate", "workflow", "orchestration"],
};

function stringsFrom(value: unknown): string[] {
  const out: string[] = [];
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") out.push(item);
      else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const candidate = obj.name ?? obj.id ?? obj.label ?? obj.title;
        if (typeof candidate === "string") out.push(candidate);
      }
    }
  }
  return out.map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function findOasfService(registration: AgentRegistration): AgentService | undefined {
  return servicesOf(registration).find(
    (service) => (service?.name ?? "").toLowerCase() === "oasf",
  );
}

/**
 * Extracts declared capabilities (OASF "skills") from a registration
 * document. Checks the OASF service entry first (the standard
 * location), then legacy top-level fields, then falls back to keyword
 * inference against name/description so agents with no structured
 * metadata still get *something* — clearly weaker evidence, but not
 * zero evidence.
 */
export function extractCapabilities(registration: AgentRegistration): string[] {
  const oasf = findOasfService(registration);
  const explicit = new Set<string>([
    ...stringsFrom(oasf?.skills),
    ...stringsFrom(registration.capabilities),
    ...stringsFrom(registration.skills),
    ...stringsFrom((registration.extensions as Record<string, unknown> | undefined)?.["skills"]),
  ]);

  if (explicit.size > 0) return [...explicit];

  // Fallback: infer from name + description text only when nothing explicit exists.
  const text = `${registration.name ?? ""} ${registration.description ?? ""}`.toLowerCase();
  const inferred = Object.entries(KNOWN_CAPABILITY_KEYWORDS)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([id]) => id);
  return inferred;
}

/**
 * Extracts declared domains (e.g. "technology/blockchain",
 * "finance_and_business/finance") from the OASF service entry, falling
 * back to legacy top-level fields.
 */
export function extractDomains(registration: AgentRegistration): string[] {
  const oasf = findOasfService(registration);
  const explicit = new Set<string>([
    ...stringsFrom(oasf?.domains),
    ...stringsFrom(registration.domains),
    ...stringsFrom(registration.domain),
    ...stringsFrom((registration.extensions as Record<string, unknown> | undefined)?.["domains"]),
  ]);
  return [...explicit];
}

/**
 * Extracts the set of distinct service protocols declared for an agent
 * (web, MCP, A2A, OASF, agentWallet, email, x402, ...), reusing the
 * same classifier the health checker uses so the two stay consistent.
 * Supports both "services" (current) and "endpoints" (legacy) field names.
 */
export function extractProtocols(registration: AgentRegistration): string[] {
  const services = servicesOf(registration);
  const protocols = new Set<string>();
  for (const service of services) {
    if (!service) continue;
    const endpoint = typeof service.endpoint === "string" ? normalizeEndpoint(service.endpoint) : undefined;
    protocols.add(classifyServiceProtocol(service.name, endpoint));
  }
  if (registration.x402Support) protocols.add("x402");
  return [...protocols];
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