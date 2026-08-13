import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50), 1), 100);

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("agents")
      .select("id, chain_id, agent_id, owner, name, description, image, active_claimed, health_status, last_seen")
      .eq("chain_id", 56)
      .order("last_seen", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    if (status) query = query.eq("health_status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ agents: data ?? [], count: data?.length ?? 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load agents" },
      { status: 500 },
    );
  }
}
