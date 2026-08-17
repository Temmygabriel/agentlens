import dns from "node:dns/promises";
import net from "node:net";

const MAX_RESPONSE_BYTES = 1_000_000;
const TIMEOUT_MS = 5000;

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }
  return true;
}

export type HealthStatus = "LIVE" | "DEAD" | "TIMEOUT" | "INVALID" | "UNKNOWN";

export type HealthResult = {
  status: HealthStatus;
  latencyMs?: number;
  httpCode?: number;
  error?: string;
};

export async function safeProbe(rawUrl: string, timeoutMs: number = TIMEOUT_MS): Promise<HealthResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { status: "INVALID", error: "Invalid URL" };
  }

  if (url.protocol !== "https:") {
    return { status: "INVALID", error: "Only HTTPS endpoints are probed" };
  }

  if (url.username || url.password) {
    return { status: "INVALID", error: "Credential-bearing URLs are not allowed" };
  }

  try {
    const addresses = await dns.lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
      return { status: "INVALID", error: "Private or reserved destination blocked" };
    }
  } catch {
    return { status: "UNKNOWN", error: "DNS resolution failed" };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        accept: "application/json,text/plain;q=0.8,*/*;q=0.5",
        "user-agent": "AgentLens/0.1 health-check",
      },
      cache: "no-store",
    });

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      return { status: "INVALID", httpCode: response.status, error: "Response exceeds 1 MB limit" };
    }

    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_RESPONSE_BYTES) {
      return { status: "INVALID", httpCode: response.status, error: "Response exceeds 1 MB limit" };
    }

    return {
      status: response.ok ? "LIVE" : "DEAD",
      httpCode: response.status,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { status: "TIMEOUT", latencyMs: timeoutMs, error: "Request timed out" };
    }
    return {
      status: "UNKNOWN",
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
    };
  } finally {
    clearTimeout(timer);
  }
}
