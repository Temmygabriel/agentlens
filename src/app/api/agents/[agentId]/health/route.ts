import { NextResponse } from "next/server";
import { getAgentTokenUri } from "@/lib/erc8004";
import { resolveAgentMetadata } from "@/lib/metadata";
import { safeProbe } from "@/lib/health";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;

  if (!/^\d+$/.test(agentId)) {
    return NextResponse.json({ error: "agentId must be numeric" }, { status: 400 });
  }

  try {
    const agentUri = await getAgentTokenUri(BigInt(agentId));
    const metadata = await resolveAgentMetadata(agentUri);
    const services = (metadata.services ?? []).filter(
      (service) => typeof service.endpoint === "string" && service.endpoint.length > 0,
    );

    const results = await Promise.all(
      services.map(async (service) => ({
        name: service.name ?? "unnamed",
        protocol: service.name ?? "unknown",
        endpoint: service.endpoint,
        health: await safeProbe(service.endpoint!),
      })),
    );

    return NextResponse.json({
      chainId: 56,
      agentId,
      agentName: metadata.name ?? null,
      checkedAt: new Date().toISOString(),
      services: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health check failed" },
      { status: 404 },
    );
  }
}
