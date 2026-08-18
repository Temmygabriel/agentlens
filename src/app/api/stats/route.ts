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

    // Keyed by lowercased value (so "Trading" and "trading" merge), but we
    // keep the first-seen original casing as the display label. Each agent
    // counts at most once per distinct value it declares (a Set per row),
    // so an agent listing "trading" twice doesn't inflate its own count.
    const capabilityCounts = new Map<string, { label: string; count: number }>();
    const protocolCounts = new Map<string, { label: string; count: number }>();
    const domainCounts = new Map<string, { label: string; count: number }>();
    let withCapabilities = 0;

    const bump = (map: Map<string, { label: string; count: number }>, raw: string) => {
      const key = raw.toLowerCase();
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { label: raw, count: 1 });
    };

    for (const row of rowsRes.data ?? []) {
      const caps = (row as { capabilities?: string[] | null }).capabilities ?? [];
      const protos = (row as { protocols?: string[] | null }).protocols ?? [];
      const domains = (row as { domains?: string[] | null }).domains ?? [];
      if (caps.length) withCapabilities++;
      for (const c of new Set(caps.filter(Boolean))) bump(capabilityCounts, c);
      for (const p of new Set(protos.filter(Boolean))) bump(protocolCounts, p);
      for (const d of new Set(domains.filter(Boolean))) bump(domainCounts, d);
    }

    const toBreakdown = (map: Map<string, { label: string; count: number }>) =>
      [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    return NextResponse.json({
      total: totalRes.count ?? 0,
      live: liveRes.count ?? 0,
      offline: offlineRes.count ?? 0,
      slow: slowRes.count ?? 0,
      capabilityTypes: capabilityCounts.size,
      protocolTypes: protocolCounts.size,
      domainTypes: domainCounts.size,
      withCapabilities,
      capabilityBreakdown: toBreakdown(capabilityCounts),
      protocolBreakdown: toBreakdown(protocolCounts),
      domainBreakdown: toBreakdown(domainCounts),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load stats" },
      { status: 500 },
    );
  }
}
