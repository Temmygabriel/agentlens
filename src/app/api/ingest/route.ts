import { NextResponse } from "next/server";
import { fetchIndexedAgents, type IndexedAgent } from "@/lib/scan";
import {
  extractCapabilities,
  extractDomains,
  extractProtocols,
  resolveAgentMetadata,
} from "@/lib/metadata";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// 8004scan and IPFS/registration-URI hosts are rate-limited or slow;
// resolve metadata a few agents at a time rather than all at once so
// one batch of 50-100 agents doesn't fire 100 concurrent fetches.
const METADATA_CONCURRENCY = 5;

type EnrichedRow = {
  chain_id: number;
  agent_id: string;
  owner?: string | null;
  agent_uri?: string | null;
  name?: string | null;
  description?: string | null;
  image?: string | null;
  active_claimed?: boolean | null;
  registration_json: unknown;
  capabilities: string[];
  domains: string[];
  protocols: string[];
  metadata_fetched_at: string | null;
  metadata_error: string | null;
  updated_at: string;
};

async function enrichAgent(agent: IndexedAgent): Promise<EnrichedRow> {
  const base: EnrichedRow = {
    chain_id: agent.chainId,
    agent_id: agent.agentId,
    owner: agent.owner,
    agent_uri: agent.agentUri,
    // Fall back to whatever 8004scan already gave us; overwritten below
    // if the registration document has better values.
    name: agent.name,
    description: agent.description,
    image: agent.image,
    active_claimed: agent.active,
    registration_json: null,
    capabilities: [],
    domains: [],
    protocols: [],
    metadata_fetched_at: null,
    metadata_error: null,
    updated_at: new Date().toISOString(),
  };

  if (!agent.agentUri) {
    base.metadata_error = "No agentUri available to resolve";
    return base;
  }

  try {
    const registration = await resolveAgentMetadata(agent.agentUri);
    base.registration_json = registration;
    base.name = registration.name ?? base.name;
    base.description = registration.description ?? base.description;
    base.image = registration.image ?? base.image;
    base.active_claimed = typeof registration.active === "boolean" ? registration.active : base.active_claimed;
    base.capabilities = extractCapabilities(registration);
    base.domains = extractDomains(registration);
    base.protocols = extractProtocols(registration);
    base.metadata_fetched_at = new Date().toISOString();
  } catch (error) {
    // One agent's broken/unreachable registration URI must never fail
    // the whole ingestion batch — record the error and move on.
    base.metadata_error = error instanceof Error ? error.message.slice(0, 500) : "Metadata resolution failed";
  }

  return base;
}

async function enrichInBatches(agents: IndexedAgent[]): Promise<EnrichedRow[]> {
  const results: EnrichedRow[] = [];
  for (let i = 0; i < agents.length; i += METADATA_CONCURRENCY) {
    const batch = agents.slice(i, i + METADATA_CONCURRENCY);
    const enriched = await Promise.all(batch.map(enrichAgent));
    results.push(...enriched);
  }
  return results;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = Number(body?.page ?? 1);
    const limit = Math.min(Math.max(Number(body?.limit ?? 50), 1), 100);

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: "page must be a positive integer" }, { status: 400 });
    }

    const { agents } = await fetchIndexedAgents({ page, limit, chainId: 56 });
    const supabase = getSupabaseAdmin();

    if (!agents.length) {
      return NextResponse.json({ page, requested: limit, discovered: 0, upserted: 0, metadataResolved: 0 });
    }

    const rows = await enrichInBatches(agents);
    const metadataResolved = rows.filter((row) => row.metadata_fetched_at).length;

    const { data, error } = await supabase
      .from("agents")
      .upsert(rows, { onConflict: "chain_id,agent_id" })
      .select("id,chain_id,agent_id,name,capabilities,domains,protocols,metadata_error");

    if (error) throw new Error(error.message);

    return NextResponse.json({
      page,
      requested: limit,
      discovered: agents.length,
      upserted: data?.length ?? 0,
      metadataResolved,
      metadataFailed: agents.length - metadataResolved,
      agents: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}