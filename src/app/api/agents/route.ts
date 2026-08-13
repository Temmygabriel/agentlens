import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CAPABILITIES } from "@/lib/discovery";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const capability = searchParams.get("capability")?.trim() ?? "";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50), 1), 100);

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("agents")
      .select("id, chain_id, agent_id, owner, name, description, image, active_claimed, health_status, last_seen")
      .eq("chain_id", 56)
      .order("last_seen", { ascending: false, nullsFirst: false })
      .limit(100);

    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    if (status) query = query.eq("health_status", status);

    const { data, error } = await query;
    if (error) throw error;

    let agents = data ?? [];
    if (capability && CAPABILITIES.some(c => c.id === capability)) {
      const terms = CAPABILITIES.find(c => c.id === capability)!.terms;
      agents = agents.filter(a => {
        const text = `${a.name ?? ""} ${a.description ?? ""}`.toLowerCase();
        return terms.some(term => text.includes(term));
      });
    }

    return NextResponse.json({ agents: agents.slice(0, limit), count: agents.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load agents" },
      { status: 500 },
    );
  }
}
