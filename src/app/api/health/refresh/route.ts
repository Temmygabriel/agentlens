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

// Stored registration_json should be a jsonb object, but be defensive: some
// rows may hold it as a JSON string (or null). Never throw — return {}.
function asRegistration(raw: unknown): AgentRegistration {
  if (raw && typeof raw === "object") return raw as AgentRegistration;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AgentRegistration;
    } catch {
      return {};
    }
  }
  return {};
}

// Mirror metadata.ts: prefer "services", fall back to legacy "endpoints".
function servicesOf(reg: AgentRegistration): AgentService[] {
  if (Array.isArray(reg.services)) return reg.services;
  if (Array.isArray(reg.endpoints)) return reg.endpoints;
  return [];
}

type AgentAnalysis = {
  status: string;
  serviceCount: number;
  probed: number;
  sampleEndpoint?: string;
  sampleProtocol?: string;
};

// Probe an agent's declared HTTP services and reduce them to one overall
// reachability status: any LIVE -> LIVE, else any TIMEOUT -> TIMEOUT (slow),
// else any DEAD -> DEAD (offline), else UNKNOWN (nothing HTTP-probeable, or
// every probe was inconclusive). Wallet/email services are not HTTP-probed.
async function analyzeAgent(reg: AgentRegistration): Promise<AgentAnalysis> {
  const services = servicesOf(reg).filter(
    (s) => s && typeof s.endpoint === "string" && s.endpoint.trim().length > 0,
  );
  const sliced = services.slice(0, MAX_SERVICES_PER_AGENT);

  let live = 0;
  let timeout = 0;
  let dead = 0;
  let probed = 0;
  let sampleEndpoint: string | undefined;
  let sampleProtocol: string | undefined;

  await Promise.all(
    sliced.map(async (s) => {
      const endpoint = normalizeEndpoint(s.endpoint as string);
      const protocol = classifyServiceProtocol(s.name, endpoint);
      if (!sampleEndpoint) {
        sampleEndpoint = endpoint;
        sampleProtocol = protocol;
      }
      if (protocol === "agentWallet" || protocol === "email") return;
      probed++;
      const res = await safeProbe(endpoint, PROBE_TIMEOUT_MS);
      if (res.status === "LIVE") live++;
      else if (res.status === "TIMEOUT") timeout++;
      else if (res.status === "DEAD") dead++;
    }),
  );

  const status = live > 0 ? "LIVE" : timeout > 0 ? "TIMEOUT" : dead > 0 ? "DEAD" : "UNKNOWN";
  return { status, serviceCount: services.length, probed, sampleEndpoint, sampleProtocol };
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

  // Diagnostic aggregates — tell us what's actually in the stored data.
  let rowsWithJson = 0;
  let rowsWithServices = 0;
  let rowsProbed = 0;
  let firstJsonType = "none";
  let sample: Record<string, unknown> | null = null;

  const outcomes: { id: number; status: string }[] = [];
  for (let i = 0; i < rows.length; i += AGENT_CONCURRENCY) {
    const batch = rows.slice(i, i + AGENT_CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (row) => {
        const raw = row.registration_json;
        const jsonType = raw === null ? "null" : Array.isArray(raw) ? "array" : typeof raw;
        const hasJson = raw !== null && (typeof raw === "object" || typeof raw === "string");
        let analysis: AgentAnalysis = { status: "UNKNOWN", serviceCount: 0, probed: 0 };
        try {
          analysis = await analyzeAgent(asRegistration(raw));
        } catch {
          /* keep UNKNOWN */
        }
        return { row, hasJson, jsonType, analysis };
      }),
    );
    for (const { row, hasJson, jsonType, analysis } of settled) {
      if (firstJsonType === "none") firstJsonType = jsonType;
      if (hasJson) rowsWithJson++;
      if (analysis.serviceCount > 0) rowsWithServices++;
      if (analysis.probed > 0) rowsProbed++;
      if (!sample && analysis.serviceCount > 0) {
        sample = {
          agentId: row.agent_id,
          serviceCount: analysis.serviceCount,
          endpoint: analysis.sampleEndpoint,
          protocol: analysis.sampleProtocol,
          status: analysis.status,
        };
      }
      outcomes.push({ id: row.id, status: analysis.status });
    }
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
    debug: { rowsWithJson, rowsWithServices, rowsProbed, firstJsonType, sample },
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
