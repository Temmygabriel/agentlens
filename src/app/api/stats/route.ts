import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CATEGORIES, classifyCategories, type CategoryId } from "@/lib/categories";

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
    // Pull a bounded sample of the evidence fields to compute diversity in JS —
    // distinct type counts, per-category counts, and top breakdowns. We also
    // need name/description/health_status to classify each agent into the four
    // categories and to know how many in each are LIVE right now.
    const rowsQuery = supabase
      .from("agents")
      .select("name, description, capabilities, protocols, domains, health_status")
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

    // Keyed by lowercased value (so "Trading" and "trading" merge) but we keep
    // the first-seen original casing as the display label. Each agent counts at
    // most once per distinct value it declares (a Set per row).
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

    // Per-category totals + how many in each are reachable (LIVE) right now.
    const catAgg = new Map<CategoryId, { total: number; live: number }>(
      CATEGORIES.map((c): [CategoryId, { total: number; live: number }] => [c.id, { total: 0, live: 0 }]),
    );

    for (const row of rowsRes.data ?? []) {
      const caps = (row as { capabilities?: string[] | null }).capabilities ?? [];
      const protos = (row as { protocols?: string[] | null }).protocols ?? [];
      const domains = (row as { domains?: string[] | null }).domains ?? [];
      if (caps.length) withCapabilities++;
      for (const c of new Set(caps.filter(Boolean))) bump(capabilityCounts, c);
      for (const p of new Set(protos.filter(Boolean))) bump(protocolCounts, p);
      for (const d of new Set(domains.filter(Boolean))) bump(domainCounts, d);
      const isLive = (row as { health_status?: string | null }).health_status === "LIVE";
      for (const id of classifyCategories(row)) {
        const agg = catAgg.get(id)!;
        agg.total++;
        if (isLive) agg.live++;
      }
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
      // Always all four, even at 0, so the home tiles render consistently.
      categories: CATEGORIES.map((c) => ({ id: c.id, label: c.label, ...catAgg.get(c.id)! })),
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
