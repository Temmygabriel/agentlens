import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Live marketplace stats for the home "proof bar". All numbers are drawn
// straight from the ingested `agents` table — nothing invented. Counts are
// exact via Supabase head:true count queries; diversity (distinct skill/
// protocol/domain types) is computed from the real declared arrays.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const totalQuery = supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("chain_id", 56);
    const liveQuery = supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("chain_id", 56)
      .eq("health_status", "LIVE");
    const offlineQuery = supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("chain_id", 56)
      .eq("health_status", "DEAD");
    const slowQuery = supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("chain_id", 56)
      .eq("health_status", "TIMEOUT");
    // Pull just the evidence arrays (bounded) to count distinct types in JS —
    // Postgres array DISTINCT across rows isn't a one-liner via the JS client.
    const rowsQuery = supabase
      .from("agents")
      .select("capabilities, protocols, domains")
      .eq("chain_id", 56)
      .limit(1000);

    const [totalRes, liveRes, offlineRes, slowRes, rowsRes] = await Promise.all([
      totalQuery,
      liveQuery,
      offlineQuery,
      slowQuery,
      rowsQuery,
    ]);
    if (totalRes.error) throw totalRes.error;
    if (liveRes.error) throw liveRes.error;
    if (offlineRes.error) throw offlineRes.error;
    if (slowRes.error) throw slowRes.error;
    if (rowsRes.error) throw rowsRes.error;

    const capabilityTypes = new Set<string>();
    const protocolTypes = new Set<string>();
    const domainTypes = new Set<string>();
    let withCapabilities = 0;

    for (const row of rowsRes.data ?? []) {
      const caps = (row as { capabilities?: string[] | null }).capabilities ?? [];
      const protos = (row as { protocols?: string[] | null }).protocols ?? [];
      const domains = (row as { domains?: string[] | null }).domains ?? [];
      if (caps.length) withCapabilities++;
      for (const c of caps) if (c) capabilityTypes.add(c.toLowerCase());
      for (const p of protos) if (p) protocolTypes.add(p);
      for (const d of domains) if (d) domainTypes.add(d.toLowerCase());
    }

    return NextResponse.json({
      total: totalRes.count ?? 0,
      live: liveRes.count ?? 0,
      offline: offlineRes.count ?? 0,
      slow: slowRes.count ?? 0,
      capabilityTypes: capabilityTypes.size,
      protocolTypes: protocolTypes.size,
      domainTypes: domainTypes.size,
      withCapabilities,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load stats" },
      { status: 500 },
    );
  }
}
