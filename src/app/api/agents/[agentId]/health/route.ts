import { NextResponse } from "next/server";
import { getAgentTokenUri } from "@/lib/erc8004";
import {
  classifyServiceProtocol,
  normalizeEndpoint,
  resolveAgentMetadata,
} from "@/lib/metadata";
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
      (service) => typeof service.endpoint === "string" && service.endpoint.trim().length > 0,
    );

    const results = await Promise.all(
      services.map(async (service) => {
        const endpoint = normalizeEndpoint(service.endpoint!);
        const protocol = classifyServiceProtocol(service.name, endpoint);

        // Non-HTTP service declarations are evidence, but are not endpoint health checks.
        if (protocol === "agentWallet" || protocol === "email") {
          return {
            name: service.name ?? "unnamed",
            protocol,
            endpoint,
            health: {
              status: "INVALID" as const,
              error: "Non-HTTP service; endpoint probing skipped",
            },
          };
        }

        return {
          name: service.name ?? "unnamed",
          protocol,
          endpoint,
          health: await safeProbe(endpoint),
        };
      }),
    );

    const probeable = results.filter(
      (service) => service.health.status !== "INVALID" || !["agentWallet", "email"].includes(service.protocol),
    );
    const liveCount = results.filter((service) => service.health.status === "LIVE").length;
    const timeoutCount = results.filter((service) => service.health.status === "TIMEOUT").length;
    const deadCount = results.filter((service) => service.health.status === "DEAD").length;
    const probeCount = probeable.length;

    const healthScore = probeCount === 0
      ? 0
      : Math.round(((liveCount + timeoutCount * 0.25) / probeCount) * 100);

    const overallStatus = liveCount > 0
      ? "LIVE"
      : timeoutCount > 0
        ? "TIMEOUT"
        : deadCount > 0
          ? "DEAD"
          : "UNKNOWN";

    return NextResponse.json({
      chainId: 56,
      agentId,
      agentName: metadata.name ?? null,
      claimedActive: metadata.active ?? null,
      checkedAt: new Date().toISOString(),
      summary: {
        overallStatus,
        healthScore,
        liveCount,
        timeoutCount,
        deadCount,
        probeCount,
        totalServices: results.length,
      },
      services: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health check failed" },
      { status: 404 },
    );
  }
}
