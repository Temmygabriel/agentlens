import { NextResponse } from "next/server";
import { getAgentOwner, getAgentTokenUri } from "@/lib/erc8004";
import { extractCapabilities, extractDomains, extractProtocols, resolveAgentMetadata } from "@/lib/metadata";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;

  if (!/^\d+$/.test(agentId)) {
    return NextResponse.json({ error: "agentId must be numeric" }, { status: 400 });
  }

  try {
    const id = BigInt(agentId);
    const [owner, agentUri] = await Promise.all([
      getAgentOwner(id),
      getAgentTokenUri(id),
    ]);

    let metadata = null;
    let metadataError = null;
    let capabilities: string[] = [];
    let domains: string[] = [];
    let protocols: string[] = [];
    try {
      metadata = await resolveAgentMetadata(agentUri);
      capabilities = extractCapabilities(metadata);
      domains = extractDomains(metadata);
      protocols = extractProtocols(metadata);
    } catch (error) {
      metadataError = error instanceof Error ? error.message : "Metadata resolution failed";
    }

    return NextResponse.json({
      chainId: 56,
      agentId,
      owner,
      agentUri,
      metadata,
      metadataError,
      capabilities,
      domains,
      protocols,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent lookup failed" },
      { status: 404 },
    );
  }
}