"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: number;
  agent_id: string;
  name: string | null;
  description: string | null;
  image: string | null;
  active_claimed: boolean | null;
  health_status: string | null;
  last_seen: string | null;
};

function statusLabel(status: string | null) {
  if (status === "LIVE") return "LIVE";
  if (status === "DEAD") return "DEAD";
  if (status === "TIMEOUT") return "TIMEOUT";
  return "UNVERIFIED";
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/agents?q=${encodeURIComponent(q)}&limit=50`);
      const data = await response.json();
      setAgents(data.agents ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 70 }}>
        <strong style={{ fontSize: 22 }}>AgentLens</strong>
        <span style={{ fontSize: 13, opacity: 0.6 }}>BNB Smart Chain · ERC-8004</span>
      </header>

      <section style={{ maxWidth: 760, marginBottom: 48 }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.6 }}>The agent marketplace with evidence</p>
        <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: "14px 0 18px" }}>Find an agent you can actually use.</h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, opacity: 0.7 }}>
          Discover BNB agents, compare what they do, and see evidence of whether they are reachable and active.
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search agents by name or capability..."
          style={{ width: "100%", marginTop: 28, padding: "17px 18px", border: "1px solid #ccc", borderRadius: 12, fontSize: 16, boxSizing: "border-box" }}
        />
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>BNB agents</h2>
          <span style={{ fontSize: 13, opacity: 0.6 }}>{loading ? "Loading..." : `${agents.length} found`}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {agents.map((agent) => (
            <article key={agent.id} style={{ border: "1px solid #e2e2e2", borderRadius: 16, padding: 20, minHeight: 180 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{agent.name || "Unnamed agent"}</h3>
                  <p style={{ margin: "7px 0 0", fontSize: 12, opacity: 0.5 }}>Agent #{agent.agent_id.split(":").pop()}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{statusLabel(agent.health_status)}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.7, marginTop: 20 }}>
                {agent.description || "No description provided yet."}
              </p>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 18 }}>
                {agent.active_claimed ? "Claimed active" : "Registration status available"}
              </div>
            </article>
          ))}
        </div>

        {!loading && agents.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", border: "1px dashed #ccc", borderRadius: 16 }}>
            No matching agents yet.
          </div>
        )}
      </section>
    </main>
  );
}
