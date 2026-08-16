// Compare selections live in the browser only (localStorage), not the
// database — this is a lightweight, per-visitor UI convenience, not
// shared or persistent evidence.
const KEY = "agentlens:compare";
export const MAX_COMPARE = 3;

export function readCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function writeCompareIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)));
  } catch {
    // Storage full/blocked — compare selection just won't persist, not fatal.
  }
}