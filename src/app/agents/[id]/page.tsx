"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Service = {
  name: string;
  protocol: string;
  endpoint: string;
  health?: { status: string; latencyMs?: number; httpCode?: number; error?: string };
};

type AgentData = {
  chainId: number;
  agentId: string;
  owner: string;
  agentUri: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    active?: boolean;
    x402Support?: boolean;
    supportedTrust?: string[];
    services?: Service[];
  } | null;
  metadataError?: string | null;
};

type HealthData = {
  checkedAt: string;
  summary: {
    overallStatus: string;
    healthScore: number;
    liveCount: number;
    timeoutCount: number;
    deadCount: number;
    probeCount: number;
    totalServices: number;
  };
  services: Service[];
};

function shorten(value: string, start = 8, end = 6) {
  return value.length > start + end + 3 ? `${value.slice(0, start)}…${value.slice(-end)}` : value;
}

function statusTone(status?: string) {
  if (status === "LIVE") return "#16803c";
  if (status === "DEAD") return "#c62828";
  if (status === "TIMEOUT") return "#a16207";
  return "#666";
}

export default function AgentDetail({ params }: { params: Promise<{ id: string }> }) {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    params.then(async ({ id }) => {
      try {
        const [agentResponse, healthResponse] = await Promise.all([
          fetch(`/api/agents/${id}`),
          fetch(`/api/agents/${id}/health`),
        ]);
        const agentData = await agentResponse.json();
        const healthData = await healthResponse.json();
        if (!agentResponse.ok) throw new Error(agentData.error || "Agent not found");
        setAgent(agentData);
        if (healthResponse.ok) setHealth(healthData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load agent");
      }
    });
  }, [params]);

  async function checkNow() {
    if (!agent) return;
    setChecking(true);
    try {
      const response = await fetch(`/api/agents/${agent.agentId}/health`);
      const data = await response.json();
      if (response.ok) setHealth(data);
    } finally {
      setChecking(false);
    }
  }

  if (error) return <main style={{ padding: 40, fontFamily: "system-ui" }}>{error}</main>;
  if (!agent) return <main style={{ padding: 40, fontFamily: "system-ui" }}>Loading agent evidence…</main>;

  const metadata = agent.metadata;
  const services = health?.services ?? metadata?.services ?? [];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 24px 80px", fontFamily: "system-ui, sans-serif" }}>
      <Link href="/" style={{ color: "inherit", textDecoration: "none", opacity: 0.6 }}>← Agent marketplace</Link>

      <section style={{ marginTop: 42, paddingBottom: 30, borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", opacity: 0.55 }}>BNB Smart Chain · ERC-8004</p>
            <h1 style={{ fontSize: 46, lineHeight: 1.05, margin: "12px 0" }}>{metadata?.name || `Agent #${agent.agentId}`}</h1>
            <p style={{ maxWidth: 720, fontSize: 17, lineHeight: 1.65, opacity: 0.72 }}>
              {metadata?.description || "This agent has no description in its ERC-8004 registration."}
            </p>
          </div>
          {health && (
            <div style={{ minWidth: 150, padding: 18, border: "1px solid #e5e5e5", borderRadius: 16 }}>
              <div style={{ fontSize: 12, opacity: 0.55 }}>Health score</div>
              <div style={{ fontSize: 38, fontWeight: 750 }}>{health.summary.healthScore}</div>
              <div style={{ color: statusTone(health.summary.overallStatus), fontWeight: 700, fontSize: 12 }}>{health.summary.overallStatus}</div>
            </div>
          )}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, margin: "26px 0" }}>
        <div style={{ padding: 18, border: "1px solid #e5e5e5", borderRadius: 14 }}><small>On-chain agent ID</small><div style={{ marginTop: 8, fontWeight: 650 }}>#{agent.agentId}</div></div>
        <div style={{ padding: 18, border: "1px solid #e5e5e5", borderRadius: 14 }}><small>Owner</small><div style={{ marginTop: 8, fontWeight: 650 }}>{shorten(agent.owner)}</div></div>
        <div style={{ padding: 18, border: "1px solid #e5e5e5", borderRadius: 14 }}><small>Claimed active</small><div style={{ marginTop: 8, fontWeight: 650 }}>{metadata?.active ? "Yes" : "Not claimed"}</div></div>
        <div style={{ padding: 18, border: "1px solid #e5e5e5", borderRadius: 14 }}><small>x402</small><div style={{ marginTop: 8, fontWeight: 650 }}>{metadata?.x402Support ? "Supported" : "Not declared"}</div></div>
      </section>

      <section style={{ marginTop: 38 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div><h2 style={{ margin: 0 }}>Evidence</h2><p style={{ opacity: 0.6, marginTop: 7 }}>What AgentLens can verify right now.</p></div>
          <button onClick={checkNow} disabled={checking} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", background: "white", cursor: "pointer" }}>{checking ? "Checking…" : "Check now"}</button>
        </div>

        <div style={{ marginTop: 18, border: "1px solid #e5e5e5", borderRadius: 16, overflow: "hidden" }}>
          {services.length === 0 ? <div style={{ padding: 24, opacity: 0.6 }}>No declared services found.</div> : services.map((service, index) => (
            <div key={`${service.name}-${index}`} style={{ padding: 18, borderBottom: index === services.length - 1 ? 0 : "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div><strong>{service.name || "Unnamed service"}</strong><span style={{ marginLeft: 8, fontSize: 11, opacity: 0.55 }}>{service.protocol}</span></div>
                <strong style={{ fontSize: 12, color: statusTone(service.health?.status) }}>{service.health?.status || "DECLARED"}</strong>
              </div>
              <div style={{ marginTop: 9, fontSize: 13, wordBreak: "break-all", opacity: 0.65 }}>{service.endpoint}</div>
              {service.health && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.55 }}>{service.health.httpCode ? `HTTP ${service.health.httpCode}` : ""}{service.health.latencyMs ? ` · ${service.health.latencyMs}ms` : ""}{service.health.error ? ` · ${service.health.error}` : ""}</div>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34, padding: 22, borderRadius: 16, background: "#f7f7f7" }}>
        <h2 style={{ marginTop: 0 }}>Trust signals</h2>
        <p style={{ lineHeight: 1.6, opacity: 0.7 }}>
          AgentLens separates <strong>what the agent claims</strong> from <strong>what we can verify</strong>. Reputation and transaction history are not yet scored here, so we do not invent a trust rating.
        </p>
        <div style={{ fontSize: 13, opacity: 0.65 }}>Supported trust: {metadata?.supportedTrust?.join(", ") || "Not declared"}</div>
      </section>
    </main>
  );
}
