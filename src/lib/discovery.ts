export const CAPABILITIES = [
  { id: "trading", label: "Trading", terms: ["trade", "trading", "swap", "market", "arbitrage", "dex"] },
  { id: "yield", label: "Yield", terms: ["yield", "liquidity", "lp", "staking", "apy", "defi"] },
  { id: "monitoring", label: "Monitoring", terms: ["monitor", "monitoring", "alert", "watch", "position", "wallet", "health factor"] },
  { id: "research", label: "Research", terms: ["research", "analysis", "analytics", "news", "intelligence", "data"] },
  { id: "security", label: "Security", terms: ["security", "risk", "audit", "threat", "scam"] },
  { id: "automation", label: "Automation", terms: ["automation", "automate", "workflow", "orchestration", "agent"] },
] as const;

export type CapabilityId = (typeof CAPABILITIES)[number]["id"];

export function capabilityForAgent(name?: string | null, description?: string | null) {
  const text = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  return CAPABILITIES.filter(c => c.terms.some(term => text.includes(term))).map(c => c.id);
}

export const INTENTS = [
  { id: "defi", label: "I need a DeFi agent", query: "defi" },
  { id: "trading", label: "I want to trade", query: "trading" },
  { id: "monitor", label: "Monitor a wallet or position", query: "monitor" },
  { id: "research", label: "Research & intelligence", query: "research" },
] as const;
