import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { safeProbe } from "@/lib/health";
import { classifyServiceProtocol, normalizeEndpoint } from "@/lib/metadata";
import type { AgentRegistration, AgentService } from "@/lib/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Batch health checks use a shorter per-endpoint timeout + bounded
// concurrency so a page of agents finishes well inside the serverless
// function's time limit (worst case ≈ ceil(limit/concurrency) * timeout).
const PROBE_TIMEOUT_MS = 3500;
const AGENT_CONCURRENCY = 10;
const MAX_SERVICES_PER_AGENT = 4;

type AgentRow = { id: number; agent_id: string; registration_json: unknown };

// Mirror metadata.ts: prefer "services", fall back to legacy "endpoints".
function servicesOf(reg: AgentRegistration): AgentService[] {
  if (Array.isArray(reg.services)) return reg.services;
  if (Array.isArray(reg.endpoints)) return reg.endpoints;
  return [];
}

// Probe an agent's declared HTTP services and reduce them to one overall
// reachability status: any LIVE -> LIVE, else any TIMEOUT -> TIMEOUT (slow),
// else any DEAD -> DEAD (offline), else UNKNOWN (nothing HTTP-probeable, or
// every probe was inconclusive). Wallet/email services are not HTTP-probed.
async function checkAgent(reg: AgentRegistration): Promise<string> {
  const services = servicesOf(reg)
    .filter((s) => s && typeof s.endpoint === "string" && s.endpoint.trim().length > 0)
    .slice(0, MAX_SERVICES_PER_AGENT);

  let live = 0;
  let timeout = 0;
  let dead = 0;

  await Promise.all(
    services.map(async (s) => {
      const endpoint = normalizeEndpoint(s.endpoint as string);
      const protocol = classifyServiceProtocol(s.name, endpoint);
      if (protocol === "agentWallet" || protocol === "email") return;
      const res = await safeProbe(endpoint, PROBE_TIMEOUT_MS);
      if (res.status === "LIVE") live++;
      else if (res.status === "TIMEOUT") timeout++;
      else if (res.status === "DEAD") dead++;
    }),
  );

  if (live > 0) return "LIVE";
  if (timeout > 0) return "TIMEOUT";
  if (dead > 0) return "DEAD";
  return "UNKNOWN";
}

async function refresh(page: number, limit: number) {
  const supabase = getSupabaseAdmin();
  const offset = (page - 1) * limit;

  // Stalest-first (nulls first) so repeated runs round-robin over the table.
  const { data, error, count } = await supabase
    .from("agents")
    .select("id, agent_id, registration_json", { count: "exact" })
    .eq("chain_id", 56)
    .order("last_seen", { ascending: true, nullsFirst: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AgentRow[];
  const checkedAt = new Date().toISOString();
  const tally: Record<string, number> = { LIVE: 0, TIMEOUT: 0, DEAD: 0, UNKNOWN: 0 };

  const outcomes: { id: number; status: string }[] = [];
  for (let i = 0; i < rows.length; i += AGENT_CONCURRENCY) {
    const batch = rows.slice(i, i + AGENT_CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (row) => {
        let status = "UNKNOWN";
        try {
          status = await checkAgent((row.registration_json ?? {}) as AgentRegistration);
        } catch {
          status = "UNKNOWN";
        }
        return { id: row.id, status };
      }),
    );
    outcomes.push(...settled);
  }

  await Promise.all(
    outcomes.map(async (o) => {
      tally[o.status] = (tally[o.status] ?? 0) + 1;
      await supabase.from("agents").update({ health_status: o.status, last_seen: checkedAt }).eq("id", o.id);
    }),
  );

  const total = count ?? 0;
  const processedThrough = offset + rows.length;
  return {
    ok: true,
    page,
    limit,
    checked: rows.length,
    tally,
    total,
    remaining: Math.max(total - processedThrough, 0),
    nextPage: processedThrough < total ? page + 1 : null,
    checkedAt,
  };
}

function readParams(pageRaw: unknown, limitRaw: unknown) {
  const page = Math.max(Math.trunc(Number(pageRaw) || 1), 1);
  const limit = Math.min(Math.max(Math.trunc(Number(limitRaw) || 40), 1), 60);
  return { page, limit };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = readParams(searchParams.get("page"), searchParams.get("limit"));
    return NextResponse.json(await refresh(page, limit));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health refresh failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { page, limit } = readParams(body.page, body.limit);
    return NextResponse.json(await refresh(page, limit));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health refresh failed" },
      { status: 500 },
    );
  }
}
