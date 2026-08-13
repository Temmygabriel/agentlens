import { NextResponse } from "next/server";
import { fetchIndexedAgents } from "@/lib/scan";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

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
      return NextResponse.json({ page, requested: limit, discovered: 0, upserted: 0 });
    }

    const rows = agents.map((agent) => ({
      chain_id: agent.chainId,
      agent_id: agent.agentId,
      owner: agent.owner,
      agent_uri: agent.agentUri,
      name: agent.name,
      description: agent.description,
      image: agent.image,
      active_claimed: agent.active,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("agents")
      .upsert(rows, { onConflict: "chain_id,agent_id" })
      .select("id,chain_id,agent_id,name");

    if (error) throw new Error(error.message);

    return NextResponse.json({
      page,
      requested: limit,
      discovered: agents.length,
      upserted: data?.length ?? 0,
      agents: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}
