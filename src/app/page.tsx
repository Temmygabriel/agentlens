export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ fontSize: 14, opacity: 0.65 }}>BNB Smart Chain · ERC-8004</p>
      <h1 style={{ fontSize: 48, margin: "12px 0" }}>AgentLens</h1>
      <p style={{ fontSize: 20, maxWidth: 650, lineHeight: 1.5 }}>
        Find agents that are actually usable. AgentLens discovers ERC-8004 agents,
        checks their declared endpoints, and builds evidence around their health.
      </p>
      <div style={{ marginTop: 40, padding: 24, border: "1px solid #ddd", borderRadius: 16 }}>
        <strong>Day 1 technical spike</strong>
        <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
          Discover → Parse → Probe → Store
        </p>
      </div>
    </main>
  );
}
